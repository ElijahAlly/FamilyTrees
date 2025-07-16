import { defineStore } from 'pinia';
import type { Ref, ComputedRef } from 'vue';
import type { PersonType } from '../types/person';
import type { SupabaseSession, SupabaseUser } from '../types/supabase';

const supabaseAppId = process.env.NUXT_SUPABASE_APP_ID!;

interface AuthStoreProps {
    user: Ref<SupabaseUser | null>;
    session: Ref<SupabaseSession | null>;
    profile: Ref<PersonType | null>;
    loading: Ref<boolean>;
    error: Ref<string | null>;
    userEmail: ComputedRef<string>;
    username: ComputedRef<string>;
    isAuthenticated: ComputedRef<boolean>;
    otpError: Ref<string | null>;
    isVerifying: Ref<boolean>;
    resendOtpLoading: Ref<boolean>;
    resendOtpError: Ref<string | null>;
    verifyOtp: (email: string, token: string) => Promise<boolean>;
    resendOtp: (email: string) => Promise<boolean>;
    signOut: () => void;
    handleLogin: (email: string) => void;
    handleSignUp: (email: string, username: string) => void;
    checkIfUserExists: (email: { email?: string }) => Promise<boolean>;
}

export const useAuthStore = defineStore('auth', (): AuthStoreProps => {
    const router = useRouter();
    
    // Single instance of the Supabase client outside the store
    const supabase = useSupabaseClient();
    
    /**
     * Represents a user session with authentication tokens and expiry information.
     * 
     * export interface Session {
     *   /**
     *    * The OAuth provider token. If present, this can be used to make external API
     *    * requests to the OAuth provider used.
     *    
     *   ? provider_token?: string | null;
     * 
     *   /**
     *    * The OAuth provider refresh token. If present, this can be used to refresh
     *    * the provider_token via the OAuth provider's API.
     *    * 
     *    * Note: Not all OAuth providers return a provider refresh token. If missing,
     *    * refer to the OAuth provider's documentation for information on how to
     *    * obtain the provider refresh token.
     *    
     *   ? provider_refresh_token?: string | null;
     * 
     *   /**
     *    * The access token JWT. It is recommended to set the JWT_EXPIRY to a shorter
     *    * expiry value for security purposes.
     *    
     *   ? access_token: string;
     * 
     *   /**
     *    * A one-time use refresh token that never expires. Used to obtain new
     *    * access tokens when they expire.
     *    
     *   ? refresh_token: string;
     * 
     *   /**
     *    * The number of seconds until the token expires (since it was issued).
     *    * Returned when a login is confirmed.
     *    
     *   ? expires_in: number;
     * 
     *   /**
     *    * A timestamp of when the token will expire. Returned when a login is confirmed.
     *    
     *   ? expires_at?: number;
     * 
     *   /**
     *    * The type of token, typically "bearer".
     *    
     *   ? token_type: string;
     * }
     */
    const session = useSupabaseSession();

    const user = ref<SupabaseUser | null>(null);

    onMounted(async () => user.value = (await supabase.auth.getUser()).data.user)

    const profile = ref<PersonType | null>(null);

    const isAuthenticated = computed<boolean>(() => user.value !== null);
    const userEmail = computed<string>(() => session.email || '');
    const username = computed<string>(() => session.username || '');

    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);
    
    const isVerifying = ref<boolean>(false);
    const otpError = ref<string | null>(null);
    const resendOtpLoading = ref<boolean>(false);
    const resendOtpError = ref<string | null>(null);

    const goToProfile = async () => {
        if (!supabase || !user.value) return;

        try {
            loading.value = true;

            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('user_id', user.value.id)
                .single();

            if (!data || error) {
                console.error('Supabase query error: could not find user.', error);
                signOut();
                await navigateTo(`/signup?existing=true`);
            }

            profile.value = data as PersonType;
            loading.value = false;
            router.replace({
                name: 'familyName-member-personId',
                params: {
                    familyName: profile.value.last_name,
                    personId: `${profile.value.id}`
                }
            })
        } catch (error) {
            console.error(error);
        }
    }

    const checkIfUserExists = async ({ email }: { email?: string }): Promise<boolean> => {
        try {
            // Check if user exists
            const { data , error } = await supabase.rpc('check_user_exists', { check_email: email });
            if (error) throw error;
            return !!data;
        } catch(err: any) {
            console.error('Failed to check if user exists:', err);
            return false;
        }
    }

    const handleSignUp = async (email: string, username: string) => {
        if (!supabase) return;

        try {
            loading.value = true;
            otpError.value = null;
            
            if (await checkIfUserExists({ email })) {
                otpError.value = 'An account with this email already exists';
                loading.value = false;
                return;
            }

            const { error: signUpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    data: { username },
                    shouldCreateUser: true
                }
            });

            if (signUpError) throw signUpError;

            isVerifying.value = true;

        } catch (error) {
            console.error(error);
            otpError.value = 'An error occurred during signup';
            // ! BUG: figure out where sign up is stuck loading !!!!

        } finally {
            loading.value = false;
        }
    }

    const handleLogin = async (email: string) => {
        if (!supabase) return;

        try {
            loading.value = true;
            otpError.value = null;

            if (!(await checkIfUserExists({ email }))) {
                otpError.value = 'No account found with this email';
                return;
            }

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                }
            });

            if (error?.status === 429 || error?.code === "over_email_send_rate_limit") {
                resendOtp(email);
                return;
            }

            if (error) throw error;

            isVerifying.value = true;

        } catch (error) {
            console.error(error);
            otpError.value = 'An error occurred during login';

        } finally {
            loading.value = false;
        }
    }

    const signOut = async () => {
        try {
            loading.value = true;
            user.value = null;
            profile.value = null;
            if (window && supabaseAppId) window.localStorage.removeItem('sb-' + supabaseAppId + '-auth-token');

            // Create a promise that rejects after 5 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Sign out timed out')), 5000);
            });

            // Race between the signOut call and the timeout
            if (supabase) {
                await Promise.race([
                    supabase.auth.signOut(),
                    timeoutPromise
                ]);
            }

            await navigateTo(`/signup?existing=true`);
        } catch (error) {
            console.error(error);
        } finally {
            loading.value = false;
        }
    }

    const verifyOtp = async (email: string, token: string): Promise<boolean> => {
        if (!supabase) return false;

        try {
            loading.value = true;
            otpError.value = null;

            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email'
            });

            if (error) throw error;

            // Wait for session to be established
            const { data } = await supabase.auth.getSession();

            if (!data.session) {
                throw new Error('Session not established after verification');
            }

            user.value = data.session.user;
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
        if (!supabase) return false;

        try {
            resendOtpLoading.value = true;
            resendOtpError.value = null;

            const { error } = await supabase.auth.resend({
                email,
                type: 'signup'
            });

            if (error) throw error;

            resendOtpLoading.value = false;
            return true;

        } catch (error) {
            console.error(error);
            resendOtpError.value = 'Error resending code.';
            return false;
        }
    }

    // * The following commented out code is a basic setup for using providers (Google, Apple, Facebook, etc.) 
    // * I do not think we want to do this for a few reasons listed below...

    // ? Pros:
    // 1. Users can sign in quickly with familiar methods.
    //      - Reduces friction during onboarding, potentially increasing conversion rates.
    // 3. Delegates security responsibilities to major tech companies with robust systems.
    // 5. Often includes additional profile data that can pre-populate user information.

    // ! Cons:
    // 1. Users may forget which provider they initially used and click the wrong one if we offer multiple providers they use frequently.
    //      - This could lead to many more duplicate accounts for a single user which means we must include simple ways to transfer the account from their `Google` login to their `Apple` login...
    //      - Requires additional account linking/merging functionality to handle inevitable duplicates.
    //      - May create confusion for less tech-savvy family members who are crucial for family tree apps.
    // 2. Creates dependency on third-party services that may change their APIs or terms.
    // * 3. !!!!! Some users have privacy concerns about connecting family tree data to social accounts !!!!!
    // 4. If a user loses access to their provider account (deleted, suspended, etc), they could lose access to their family tree data.

    // async function signInWithProvider(provider: string) {
    //     if (!supabaseClient.value) throw new Error('Supabase client not initialized');
    //     try {
    //         const { data, error } = await supabaseClient.value.auth.signInWithOAuth({
    //             provider: provider as any,
    //             options: {
    //                 redirectTo: `${window.location.origin}/auth/callback`
    //             }
    //         });

    //         if (error) throw error;

    //         return data;
    //     } catch (error: any) {
    //         error.value = error.message;
    //         throw error;
    //     }
    // }

    // async function fetchProfile() {
    //     if (!supabaseClient.value) throw new Error('Supabase client not initialized');
    //     try {
    //         if (!user.value) return;

    //         const { data: profileData, error } = await supabaseClient.value
    //             .from('people')
    //             .select('*')
    //             .eq('user_id', user.value.id)
    //             .single<PersonType>();

    //         if (error) throw error;

    //         profile.value = profileData;
    //     } catch (error: any) {
    //         error.value = error.message;
    //         throw error;
    //     }
    // }

    // async function handleAuthStateChange() {
    //     if (!supabaseClient.value) throw new Error('Supabase client not initialized');
    //     const { data: { session: currentSession } } = await supabaseClient.value.auth.getSession();
    //     // console.log("\n== currentSession ==\n", currentSession, "\n");
    //     session.value = currentSession;
    //     user.value = currentSession?.user ?? null;

    //     if (user.value) {
    //         await fetchProfile();
    //     }
    // }

    // async function logout() {
    //     if (!supabaseClient.value) throw new Error('Supabase client not initialized');
    //     try {
    //         loading.value = true;
    //         const { error } = await supabaseClient.value.auth.signOut();

    //         if (error) throw error;

    //         // Clear local state
    //         user.value = null;
    //         session.value = null;
    //         profile.value = null;

    //     } catch (error: any) {
    //         error.value = error.message;
    //         throw error;
    //     } finally {
    //         loading.value = false;
    //     }
    // }

    return {
        user,
        session,
        profile,
        loading,
        error,
        userEmail,
        username,
        isAuthenticated,
        otpError,
        isVerifying,
        resendOtpLoading,
        resendOtpError,
        verifyOtp,
        resendOtp,
        signOut,
        handleLogin,
        handleSignUp,
        checkIfUserExists
    }
})