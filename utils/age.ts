import type { AgeLabel } from '@/types/roles';

/**
 * Calculate age in years from a birth date string.
 */
export function calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Get the age label for a person based on their birth date.
 * - child: under 13
 * - teenager: 13-17
 * - adult: 18+
 */
export function getAgeLabel(birthDate: string | null): AgeLabel | null {
    const age = calculateAge(birthDate);
    if (age === null) return null;

    if (age < 13) return 'child';
    if (age < 18) return 'teenager';
    return 'adult';
}
