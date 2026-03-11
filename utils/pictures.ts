/**
 * Returns the URL for a person's picture stored in gpapics.
 * Pictures array now stores gpapics media IDs instead of filenames.
 * Images are served through a local proxy route that authenticates with gpapics.
 * @param mediaId - The gpapics media ID (stored as string in pictures array)
 * @param variant - 'raw' for full image, 'thumb' for thumbnail
 */
export const getPersonPictureUrl = (mediaId: string, variant: 'raw' | 'thumb' = 'raw') => {
    return `/api/gpapics-media/${mediaId}/${variant}`;
};

/**
 * @deprecated Use getPersonPictureUrl(mediaId) instead.
 * Kept for backward compatibility with existing pictures stored as filenames.
 */
export const getLegacyPersonPictureUrl = (familyId: number, personId: number, filename: string) => {
    // If the filename looks like a gpapics media ID (numeric), use the new URL format
    if (/^\d+$/.test(filename)) {
        return getPersonPictureUrl(filename);
    }
    // Otherwise fall back to old local path for pre-migration pictures
    return `/uploads/people/${familyId}/${personId}/${filename}`;
};
