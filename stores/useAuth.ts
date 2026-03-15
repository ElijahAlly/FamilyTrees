import { defineStore } from 'pinia';
import type { Ref, ComputedRef } from 'vue';
import type { FamilyType, PersonType, ApiResponse, VerifyOtpResponse } from '@/types';
import { useToast } from '@/composables/useToast';

interface AuthUser {
    id: string;
    email: string;
    createdAt: string;
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
    handleSignUp: (email: string, firstName: string, lastName: string) => void;
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

    // Migrate old localStorage key to new persist key (one-time)
    if (import.meta.client) {
        const oldUser = localStorage.getItem('mft-auth-user');
        if (oldUser && !localStorage.getItem('mft-auth')) {
            try {
                const parsed = JSON.parse(oldUser);
                localStorage.setItem('mft-auth', JSON.stringify({ user: parsed }));
            } catch { /* ignore */ }
            localStorage.removeItem('mft-auth-user');
        }
    }

    const persistUser = (authUser: AuthUser | null, token?: string) => {
        user.value = authUser;
        if (import.meta.client) {
            if (token) {
                localStorage.setItem('mft-auth-token', token);
            }
            if (!authUser) {
                localStorage.removeItem('mft-auth-token');
            }
        }
    };

    const { showToast } = useToast();

    const profileLoading = ref<boolean>(false);

    const getProfile = async () => {
        if (!user.value) return;
        try {
            profileLoading.value = true;

            const { data, error: fetchError } = await $fetch<{ data: PersonType | null; error?: string }>('/api/auth/get-profile', {
                method: 'GET',
            });

            if (fetchError) {
                showToast('Could not load your profile. Please sign in again.', 'error');
                signOut();
                await navigateTo(`/signup?existing=true`);
                return;
            }

            // Profile may be null if person record hasn't been created yet (e.g. during onboarding)
            profile.value = (data as PersonType) || null;
        } catch (error) {
            showToast('Failed to load profile.', 'error');
        } finally {
            profileLoading.value = false;
        }
    }

    const goToProfile = async () => {
        try {
            await getProfile();
            if (!profile.value) {
                // No person record yet — redirect to onboarding to create one
                router.replace({ path: '/onboarding' });
                return;
            }
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
            const { exists } = await $fetch<{ exists: boolean }>('/api/auth/check-user-exists', {
                method: 'GET',
                params: { email }
            });
            return !!exists;
        } catch (err: any) {
            console.error('Failed to check if user exists:', err);
            return false;
        }
    }

    const handleSignUp = async (email: string, firstName: string, lastName: string) => {
        try {
            loading.value = true;
            otpError.value = null;

            if (await checkIfUserExists({ email })) {
                otpError.value = 'An account with this email already exists';
                loading.value = false;
                return;
            }

            const result = await $fetch<ApiResponse & { otp?: string }>('/api/auth/signup', {
                method: 'POST',
                body: { email, firstName, lastName }
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // In dev mode, the server returns the OTP directly — skip verification UI
            if (result.otp) {
                await verifyOtp(email, result.otp);
                return;
            }

            isVerifying.value = true;

        } catch (error: any) {
            showToast('An error occurred during signup.', 'error');
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

            const result = await $fetch<ApiResponse & { otp?: string }>('/api/auth/login', {
                method: 'POST',
                body: { email }
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // In dev mode, the server returns the OTP directly — skip verification UI
            if (result.otp) {
                await verifyOtp(email, result.otp);
                return;
            }

            isVerifying.value = true;

        } catch (error) {
            showToast('An error occurred during login.', 'error');
            otpError.value = 'An error occurred during login';
        } finally {
            loading.value = false;
        }
    }

    const clearStoresAfterSignout = () => {
        const familyStore = useFamilyStore();
        familyStore.clearStoresAfterSignout();
        const claimsStore = useClaimsStore();
        claimsStore.clearStore();
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

            const result = await $fetch<VerifyOtpResponse>('/api/auth/verify-otp', {
                method: 'POST',
                body: { email, token }
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            persistUser(result.user, result.token);
            if (result.profile) {
                profile.value = result.profile;
            }

            // Redirect to onboarding if not completed, otherwise go to profile
            if (result.onboardingCompleted === false) {
                router.replace({ path: '/onboarding' });
            } else {
                goToProfile();
            }

            isVerifying.value = false;
            return true;

        } catch (error) {
            showToast('Invalid or expired code.', 'error');
            otpError.value = 'Invalid or expired code';
            return false;
        } finally {
            loading.value = false;
        }
    }

    const resendOtp = async (email: string): Promise<boolean> => {
        try {
            resendOtpLoading.value = true;
            resendOtpError.value = null;

            const result = await $fetch<ApiResponse>('/api/auth/login', {
                method: 'POST',
                body: { email }
            });

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
}, {
    persist: {
        key: 'mft-auth',
        pick: ['user'],
    },
});
