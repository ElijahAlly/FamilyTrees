import { defineStore } from 'pinia';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { PersonType } from '@/types/person';
import { ref } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';

export const useAuthStore = defineStore('auth', () => {
    const config = useRuntimeConfig();
    const supabaseUrl = config.public.supabaseUrl;
    const supabaseAnonKey = config.public.supabaseKey;

    if (typeof supabaseUrl !== 'string' || typeof supabaseAnonKey !== 'string' || !supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        }
    });
    
    const user = ref<User | null>(null);
    const session = ref<Session | null>(null);
    const profile = ref<PersonType | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function signInWithProvider(provider: string) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
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
        try {
            if (!user.value) return;

            const { data: profileData, error } = await supabase
                .from('people')
                .select('*')
                .eq('user_id', user.value.id)
                .single();

            if (error) throw error;

            profile.value = profileData;
        } catch (error: any) {
            error.value = error.message;
            throw error;
        }
    }

    async function handleAuthStateChange() {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        // console.log("\n== currentSession ==\n", currentSession, "\n");
        session.value = currentSession;
        user.value = currentSession?.user ?? null;

        if (user.value) {
            await fetchProfile();
        }
    }

    async function logout() {
        try {
            loading.value = true;
            const { error } = await supabase.auth.signOut();

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
        supabase,
        logout,
        signInWithProvider,
        fetchProfile,
        handleAuthStateChange
    }
})