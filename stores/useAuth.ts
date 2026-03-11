import { defineStore } from 'pinia';
import type { Ref, ComputedRef } from 'vue';
import type { FamilyType, PersonType } from '@/types';

interface AuthUser {
    id: string;
    email: string;
    created_at: string;
}

interface AuthStoreProps {
    user: Ref<AuthUser | null>;
    profile: Ref<PersonType | null>;
    loading: Ref<boolean>;
    error: Ref<string | null>;
    userEmail: ComputedRef<string>;
    isAuthenticated: ComputedRef<boolean>;
    otpError: Ref<string | null>;
    isVerifying: Ref<boolean>;
    resendOtpLoading: Ref<boolean>;
    resendOtpError: Ref<string | null>;
    familiesCreatedByMember: Ref<FamilyType[]>;
    verifyOtp: (email: string, token: string) => Promise<boolean>;
    resendOtp: (email: string) => Promise<boolean>;
    signOut: () => void;
    handleLogin: (email: string) => void;
    getProfile: () => Promise<void>;
    handleSignUp: (email: string, username: string) => void;
    checkIfUserExists: (email: { email?: string }) => Promise<boolean>;
}

export const useAuthStore = defineStore('auth', (): AuthStoreProps => {
    const router = useRouter();

    const user = ref<AuthUser | null>(null);
    const profile = ref<PersonType | null>(null);
    const familiesCreatedByMember = ref<FamilyType[]>([]);

    const isAuthenticated = computed<boolean>(() => user.value !== null);
    const userEmail = computed<string>(() => user.value?.email || '');

    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const isVerifying = ref<boolean>(false);
    const otpError = ref<string | null>(null);
    const resendOtpLoading = ref<boolean>(false);
    const resendOtpError = ref<string | null>(null);

    // Restore user from localStorage on mount
    onMounted(() => {
        const stored = localStorage.getItem('mft-auth-user');
        if (stored) {
            try {
                user.value = JSON.parse(stored);
            } catch {
                localStorage.removeItem('mft-auth-user');
            }
        }
    });

    const persistUser = (authUser: AuthUser | null) => {
        user.value = authUser;
        if (authUser) {
            localStorage.setItem('mft-auth-user', JSON.stringify(authUser));
        } else {
            localStorage.removeItem('mft-auth-user');
        }
    };

    const getProfile = async () => {
        if (!user.value) return;
        try {
            loading.value = true;

            const { data, error: fetchError } = await $fetch('/api/auth/get-profile', {
                method: 'GET',
                params: { userId: user.value.id }
            }) as any;

            if (!data || fetchError) {
                console.error('Could not find user profile.', fetchError);
                loading.value = false;
                signOut();
                await navigateTo(`/signup?existing=true`);
                return;
            }

            profile.value = data as PersonType;
            loading.value = false;
        } catch (error) {
            console.error(error);
        }
    }

    const goToProfile = async () => {
        try {
            await getProfile();
            if (!profile.value) return;
            router.replace({
                name: 'member-personId',
                params: { personId: `${profile.value.id}` }
            });
        } catch (error) {
            console.error(error);
        }
    }

    const checkIfUserExists = async ({ email }: { email?: string }): Promise<boolean> => {
        try {
            const { exists } = await $fetch('/api/auth/check-user-exists', {
                method: 'GET',
                params: { email }
            }) as any;
            return !!exists;
        } catch (err: any) {
            console.error('Failed to check if user exists:', err);
            return false;
        }
    }

    const handleSignUp = async (email: string, username: string) => {
        try {
            loading.value = true;
            otpError.value = null;

            if (await checkIfUserExists({ email })) {
                otpError.value = 'An account with this email already exists';
                loading.value = false;
                return;
            }

            const result = await $fetch('/api/auth/signup', {
                method: 'POST',
                body: { email, username }
            }) as any;

            if (!result.success) {
                throw new Error(result.error);
            }

            isVerifying.value = true;

        } catch (error: any) {
            console.error(error);
            otpError.value = 'An error occurred during signup';
        } finally {
            loading.value = false;
        }
    }

    const handleLogin = async (email: string) => {
        try {
            loading.value = true;
            otpError.value = null;

            if (!(await checkIfUserExists({ email }))) {
                otpError.value = 'No account found with this email';
                return;
            }

            const result = await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email }
            }) as any;

            if (!result.success) {
                throw new Error(result.error);
            }

            isVerifying.value = true;

        } catch (error) {
            console.error(error);
            otpError.value = 'An error occurred during login';
        } finally {
            loading.value = false;
        }
    }

    const clearStoresAfterSignout = () => {
        const familyStore = useFamilyStore();
        familyStore.clearStoresAfterSignout();
    }

    const signOut = async () => {
        try {
            loading.value = true;
            persistUser(null);
            profile.value = null;
            clearStoresAfterSignout();

            await navigateTo(`/signup?existing=true`);
        } catch (error) {
            console.error(error);
        } finally {
            loading.value = false;
        }
    }

    const verifyOtp = async (email: string, token: string): Promise<boolean> => {
        try {
            loading.value = true;
            otpError.value = null;

            const result = await $fetch('/api/auth/verify-otp', {
                method: 'POST',
                body: { email, token }
            }) as any;

            if (!result.success) {
                throw new Error(result.error);
            }

            persistUser(result.user);
            if (result.profile) {
                profile.value = result.profile;
            }

            goToProfile();

            isVerifying.value = false;
            loading.value = false;
            return true;

        } catch (error) {
            console.error(error);
            otpError.value = 'Invalid or expired code';
            return false;
        }
    }

    const resendOtp = async (email: string): Promise<boolean> => {
        try {
            resendOtpLoading.value = true;
            resendOtpError.value = null;

            const result = await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email }
            }) as any;

            if (!result.success) {
                throw new Error(result.error);
            }

            resendOtpLoading.value = false;
            return true;

        } catch (error) {
            console.error(error);
            resendOtpError.value = 'Error resending code.';
            return false;
        }
    }

    return {
        user,
        profile,
        loading,
        error,
        userEmail,
        isAuthenticated,
        otpError,
        isVerifying,
        resendOtpLoading,
        resendOtpError,
        familiesCreatedByMember,
        verifyOtp,
        resendOtp,
        signOut,
        getProfile,
        handleLogin,
        handleSignUp,
        checkIfUserExists
    }
});
