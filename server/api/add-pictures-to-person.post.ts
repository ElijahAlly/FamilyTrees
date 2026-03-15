import { defineEventHandler, readMultipartFormData } from 'h3';
import { db } from '../db';
import { people, mediaSubmissions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { canManagePhotosFor } from '../utils/permissions';
import { requireAuth } from '../utils/auth';

const GPAPICS_URL = process.env.GPAPICS_URL || 'http://localhost:3000';
const GPAPICS_API_KEY = process.env.GPAPICS_API_KEY || '';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const formData = await readMultipartFormData(event);
    if (!formData) throw new Error('No form data received');

    const files = formData.filter((item: any) => item.name === 'files[]');
    const familyId = formData.find((item: any) => item.name === 'familyId')?.data.toString();
    const id = formData.find((item: any) => item.name === 'id')?.data.toString();
    const pictures = formData.find((item: any) => item.name === 'pictures')?.data.toString().split(',');

    if (!files.length || !familyId || !id || !pictures) {
        throw new Error('Missing required data');
    }

    try {
        // Permission check
        const permission = await canManagePhotosFor(userId, Number(id), Number(familyId));
        if (!permission.allowed) {
            return { success: false, error: 'You do not have permission to upload photos for this person' };
        }

        // If requires approval (teenager uploading for self), create pending submission instead
        if (permission.requiresApproval) {
            for (const fileData of files) {
                // For pending submissions, store a placeholder - the actual upload happens on approval
                await db
                    .insert(mediaSubmissions)
                    .values({
                        mediaUrl: `pending:${fileData.filename || 'upload'}`,
                        familyId: Number(familyId),
                        personId: Number(id),
                        submittedBy: userId,
                        status: 'pending',
                        contentRating: 'general',
                    });
            }
            return { success: true, data: pictures.filter(Boolean), pendingApproval: true };
        }
        const uploadedMediaIds: string[] = [];

        // Upload each file to gpapics
        for (const fileData of files) {
            const gpapicsForm = new FormData();
            const blob = new Blob([fileData.data], { type: fileData.type || 'image/jpeg' });
            gpapicsForm.append('file', blob, fileData.filename || 'upload.jpg');
            gpapicsForm.append('source', 'family-trees');
            gpapicsForm.append('sourceRef', `family:${familyId}:person:${id}`);

            const response = await fetch(`${GPAPICS_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'X-API-Key': GPAPICS_API_KEY,
                },
                body: gpapicsForm,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GPapics upload failed: ${response.status} ${errorText}`);
            }

            const result = await response.json() as { success: boolean; media: { id: number } };
            if (result.success && result.media) {
                uploadedMediaIds.push(String(result.media.id));
            }
        }

        // Update person's pictures array with gpapics media IDs
        const existingPictures = pictures.filter(pic => !!pic);
        const updatedPictures = [...uploadedMediaIds, ...existingPictures];

        const updateResult = await db
            .update(people)
            .set({ pictures: updatedPictures })
            .where(eq(people.id, Number(id)))
            .returning({ pictures: people.pictures });

        return {
            success: true,
            data: updateResult[0]?.pictures || []
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
});
