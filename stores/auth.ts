import { defineStore } from 'pinia';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { PersonType } from '@/types/person';
import { ref } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';

export const useAuthStore = defineStore('auth', () => {
    // Single instance of the Supabase client outside the store
    const supabaseClient = ref<ReturnType<typeof createClient> | null>(null);

    function createSupabaseClient() {
        if (supabaseClient.value?.auth) return;
        
        const config = useRuntimeConfig();
        const supabaseUrl = config.public.supabaseUrl;
        const supabaseAnonKey = config.public.supabaseKey;

        if (typeof supabaseUrl !== 'string' || typeof supabaseAnonKey !== 'string' || !supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabaseClient.value = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            }
        });
    }

    createSupabaseClient();

    const user = ref<User | null>(null);
    const session = ref<Session | null>(null);
    const profile = ref<PersonType | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function signInWithProvider(provider: string) {
        if (!supabaseClient.value) throw new Error('Supabase client not initialized');
        try {
            const { data, error } = await supabaseClient.value.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;

            return data;
        } catch (error: any) {
            error.value = error.message;
            throw error;
        }
    }

    async function fetchProfile() {
        if (!supabaseClient.value) throw new Error('Supabase client not initialized');
        try {
            if (!user.value) return;

            const { data: profileData, error } = await supabaseClient.value
                .from('people')
                .select('*')
                .eq('user_id', user.value.id)
                .single<PersonType>();

            if (error) throw error;

            profile.value = profileData;
        } catch (error: any) {
            error.value = error.message;
            throw error;
        }
    }

    async function handleAuthStateChange() {
        if (!supabaseClient.value) throw new Error('Supabase client not initialized');
        const { data: { session: currentSession } } = await supabaseClient.value.auth.getSession();
        // console.log("\n== currentSession ==\n", currentSession, "\n");
        session.value = currentSession;
        user.value = currentSession?.user ?? null;

        if (user.value) {
            await fetchProfile();
        }
    }

    async function logout() {
        if (!supabaseClient.value) throw new Error('Supabase client not initialized');
        try {
            loading.value = true;
            const { error } = await supabaseClient.value.auth.signOut();

            if (error) throw error;

            // Clear local state
            user.value = null;
            session.value = null;
            profile.value = null;

        } catch (error: any) {
            error.value = error.message;
            throw error;
        } finally {
            loading.value = false;
        }
    }

    return {
        user,
        session,
        profile,
        loading,
        error,
        logout,
        signInWithProvider,
        fetchProfile,
        handleAuthStateChange
    }
})