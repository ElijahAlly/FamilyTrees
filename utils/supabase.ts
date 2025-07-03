import { useRuntimeConfig } from 'nuxt/app';

/**
 * Generates a public URL for a person's picture in Supabase storage
 * @param familyId - The family ID
 * @param personId - The person ID
 * @param filename - The filename with extension
 * @returns The complete public URL for the image
 */
export const getPersonPictureUrl = (familyId: number, personId: number, filename: string) => {
    const supabaseUrl = useRuntimeConfig().public.supabaseUrl;
    const path = `people/${familyId}/${personId}/${filename}`;
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
};