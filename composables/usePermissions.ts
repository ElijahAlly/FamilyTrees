import { ref, computed } from 'vue';
import type { FamilyRole, FamilyRoleRecord } from '@/types/roles';
import type { PersonType } from '@/types/person';
import { calculateAge, getAgeLabel } from '@/utils/age';

const ROLE_HIERARCHY: Record<FamilyRole, number> = {
    owner: 5,
    banker: 4,
    admin: 3,
    member: 2,
    guest: 1,
};

export function usePermissions() {
    const userRole = ref<FamilyRole | null>(null);
    const roleRecord = ref<FamilyRoleRecord | null>(null);
    const loading = ref(false);

    const isOwner = computed(() => userRole.value === 'owner');
    const isBanker = computed(() => userRole.value === 'banker' || isOwner.value);
    const isAdmin = computed(() => {
        if (!userRole.value) return false;
        return ROLE_HIERARCHY[userRole.value] >= ROLE_HIERARCHY['admin'];
    });
    const isMember = computed(() => {
        if (!userRole.value) return false;
        return ROLE_HIERARCHY[userRole.value] >= ROLE_HIERARCHY['member'];
    });

    async function fetchRole(userId: string, familyId: number) {
        loading.value = true;
        try {
            const { data } = await $fetch('/api/roles/get-role', {
                method: 'GET',
                params: { userId, familyId },
            }) as any;

            if (data) {
                roleRecord.value = data;
                userRole.value = data.role;
            } else {
                roleRecord.value = null;
                userRole.value = null;
            }
        } catch (err) {
            console.error('Error fetching role:', err);
            userRole.value = null;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Check if the current user can upload photos for a target person.
     * Client-side check (server enforces the real rules).
     */
    function canUploadPhotos(
        actorPerson: PersonType | null,
        targetPerson: PersonType | null,
        actorUserId: string | null,
    ): boolean {
        if (!actorPerson || !targetPerson || !actorUserId || !userRole.value) return false;

        // Admin+ can always upload
        if (ROLE_HIERARCHY[userRole.value] >= ROLE_HIERARCHY['admin']) {
            return true;
        }

        // Guest cannot upload
        if (userRole.value === 'guest') return false;

        const actorAge = getAgeLabel(actorPerson.birthDate);
        const targetAge = getAgeLabel(targetPerson.birthDate);

        // Children cannot upload
        if (actorAge === 'child') return false;

        // Self-management
        const isSelf = targetPerson.claimedBy?.userId === actorUserId
            || (targetPerson as any).userId === actorUserId
            || (targetPerson as any).claimedBy === actorUserId;
        if (isSelf) return true; // Teens will get approval flow server-side

        // Parent managing child/teen
        const isParent = targetPerson.motherId === actorPerson.id || targetPerson.fatherId === actorPerson.id;
        if (isParent && (targetAge === 'child' || targetAge === 'teenager')) return true;

        return false;
    }

    /**
     * Check if the current user can view content with the given rating.
     */
    function canViewContent(rating: string | null, viewerPerson: PersonType | null): boolean {
        if (!rating || rating === 'general') return true;
        if (!viewerPerson) return false;

        const ageLabel = getAgeLabel(viewerPerson.birthDate);

        if (rating === 'teen') {
            return ageLabel === 'teenager' || ageLabel === 'adult' || ageLabel === null;
        }
        if (rating === 'adult') {
            return ageLabel === 'adult' || ageLabel === null;
        }

        return true;
    }

    return {
        userRole,
        roleRecord,
        loading,
        isOwner,
        isBanker,
        isAdmin,
        isMember,
        fetchRole,
        canUploadPhotos,
        canViewContent,
    };
}
