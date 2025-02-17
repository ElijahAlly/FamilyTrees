import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)

    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    if (!formData) throw new Error('No form data received')

    // Extract files and other data
    const files = formData.filter(item => item.name === 'files[]')
    const familyId = formData.find(item => item.name === 'familyId')?.data.toString()
    const id = formData.find(item => item.name === 'id')?.data.toString()
    const pictures = formData.find(item => item.name === 'pictures')?.data.toString().split(',');

    if (!files.length || !familyId || !id || !pictures) {
        throw new Error('Missing required data')
    }

    try {
        const uploadedUrls: string[] = [];

        // Upload each file to storage
        for (const fileData of files) {
            const fileName = `${Date.now()}-${fileData.filename?.replaceAll(' ', '-') || ''}`;
            const filePath = `${familyId}/${id}/${fileName}`;

            // Upload file to Supabase storage
            const { data: storageData, error: storageError } = await client
                .storage
                .from('people')
                .upload(filePath, fileData.data, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: fileData.type // Add content type
                });

            if (storageError) throw storageError;
            
            uploadedUrls.push(fileName);

            // Or for the full url https://xyz.supabase.co/storage/v1/object/public/people/${filePath}
            // Get public URL for the uploaded file
            // const { data: publicUrlData } = client
            //     .storage
            //     .from('people')
            //     .getPublicUrl(filePath);
            // publicUrlData.publicUrl
        }

        // Update person's pictures array in the database
        const { data: updateData, error: updateError } = await client
            .from('people')
            .update({
                pictures: [...uploadedUrls, ...pictures.filter(pic => !!pic)]
            })
            .eq('id', id)
            .select('pictures')
            .single();

        if (updateError) throw updateError;

        return {
            success: true,
            data: updateData?.pictures || []
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
});