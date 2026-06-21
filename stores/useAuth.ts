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
                // Stale persisted user with a bad/missing token. Clear state
                // silently — the route guard or current page will handle the
                // redirect. Toasting here would alarm users whose stale token
                // just expired naturally.
                persistUser(null);
                profile.value = null;
                return;
            }

            // Profile may be null if person record hasn't been created yet (e.g. during onboarding)
            profile.value = (data as PersonType) || null;
        } catch (error: any) {
            // 401 from the auth middleware (expired/invalid JWT) — clear state
            // silently. Other errors aren't actionable for the user either, so
            // don't toast; rely on the calling page to recover.
            if (error?.status === 401 || error?.statusCode === 401) {
                persistUser(null);
                profile.value = null;
            }
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
                // Dev convenience: skip the "create an account first" step so
                // any email lands you logged in. Real production accounts must
                // still go through /signup.
                if (import.meta.dev) {
                    const localPart = email.split('@')[0] || 'dev';
                    await handleSignUp(email, localPart, '');
                    return;
                }
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

            // Honor ?return_to=… for cross-app sign-in (photos.mytrees.family,
            // cinderella.photography). Internal paths get a SPA navigate;
            // absolute URLs get a window.location bounce with #token=<jwt>
            // so the destination can capture the identity.
            //
            // New users (onboardingCompleted=false) always go through
            // /onboarding first regardless of return_to — we just pass it
            // through so onboarding → profile → return_to can resume the flow.
            const returnTo = (router.currentRoute.value.query.return_to as string | undefined) || null;
            const isOnboarded = result.onboardingCompleted !== false;

            if (returnTo && isOnboarded) {
                if (returnTo.startsWith('/')) {
                    // Split path + query/hash explicitly: vue-router's
                    // `{ path }` form treats the whole string as the path
                    // and silently drops the query string, which would lose
                    // response_type, client_id, etc. on the OAuth bounce.
                    const url = new URL(returnTo, 'http://_');
                    router.replace({
                        path: url.pathname,
                        query: Object.fromEntries(url.searchParams),
                        hash: url.hash || undefined,
                    });
                    isVerifying.value = false;
                    return true;
                } else if (import.meta.client) {
                    try {
                        const url = new URL(returnTo);
                        // Reject anything not under the mytrees.family or
                        // cinderella.photography ecosystem.
                        const isAllowed =
                            /\.mytrees\.family$/.test(url.host) ||
                            url.host === 'mytrees.family' ||
                            /\.cinderella\.photography$/.test(url.host) ||
                            url.host === 'cinderella.photography' ||
                            url.host === 'localhost' || url.host.startsWith('localhost:');
                        if (isAllowed) {
                            url.hash = `token=${result.token}`;
                            window.location.href = url.toString();
                            isVerifying.value = false;
                            return true;
                        }
                    } catch { /* fall through to default */ }
                }
            }

            // New user or no return_to: route through onboarding/profile.
            // return_to (if any) rides along in the query so the profile page
            // can resume the cross-app flow after the user finishes setting up.
            if (!isOnboarded) {
                router.replace({
                    path: '/onboarding',
                    query: returnTo ? { return_to: returnTo } : {},
                });
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
