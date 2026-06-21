<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/useAuth';
import { useRoute } from 'nuxt/app';
import { storeToRefs } from 'pinia';

type TabView = 'signup' | 'login';

// Focused auth screen — drop the app navbar/footer so only the MyTrees logo
// shows, matching the OAuth consent screen at /oauth/authorize.
definePageMeta({ layout: false });

const route = useRoute();

const email = ref('');
const firstName = ref('');
const lastName = ref('');
const otpCode = ref('');

const curTab = ref<TabView>(route.query.existing ? 'login' : 'signup');

const authStore = useAuthStore();
const { handleSignUp, handleLogin, verifyOtp, resendOtp } = authStore;
const {
    user,
    loading,
    // otp
    otpError,
    isVerifying,
    // resending otp
    resendOtpLoading,
    resendOtpError
} = storeToRefs(authStore);

// Cross-app sign-in context. When an external client (e.g. cinderella /
// photos) bounces a logged-out user here, ?return_to=/oauth/authorize?…
// carries the client_id — we look up its friendly name so the user can see
// who they're signing in to continue to.
const returnTo = computed(() => (route.query.return_to as string | undefined) || null);
const isIdpFlow = computed(() => !!returnTo.value);
const clientName = ref<string | null>(null);

onMounted(async () => {
    const rt = returnTo.value;
    if (!rt) return;
    // Pull client_id out of the (possibly partially-encoded) return_to URL.
    const match = rt.match(/[?&]client_id=([^&]+)/);
    if (!match) return;
    try {
        const clientId = decodeURIComponent(match[1]);
        const client = await $fetch<{ name: string }>(
            `/api/oauth/client/${encodeURIComponent(clientId)}`,
        );
        clientName.value = client?.name ?? null;
    } catch {
        // Unknown client / lookup failed — fall back to a generic message.
    }
});

const heading = computed(() => {
    if (isVerifying.value) return 'Check your email';
    return curTab.value === 'signup' ? 'Create your account' : 'Welcome back';
});

const toggleTab = (to: TabView) => {
    curTab.value = to;
    otpCode.value = '';
    email.value = '';
    firstName.value = '';
    lastName.value = '';
    otpError.value = null;
    isVerifying.value = false;
    loading.value = false;
    resendOtpError.value = null;
    resendOtpLoading.value = false;
}

const handleSubmit = async () => {
    if (isVerifying.value) {
        await verifyOtp(email.value, otpCode.value);
    } else {
        if (curTab.value === 'signup') {
            handleSignUp(email.value, firstName.value, lastName.value);
        } else {
            handleLogin(email.value);
        }
    }
}
</script>

<template>
    <div
        class="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950"
    >
        <!-- Brand mark only — no full navbar -->
        <NuxtLink to="/" class="mb-8 select-none">
            <img
                src="/my-trees-logo-with-name.png"
                alt="MyTrees.family"
                class="h-12 w-auto"
            />
        </NuxtLink>

        <!-- Heading + cross-app context -->
        <div class="mb-6 text-center">
            <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {{ heading }}
            </h1>
            <p
                v-if="isIdpFlow"
                class="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
            >
                to continue to
                <span class="font-medium text-violet-600 dark:text-violet-400">{{
                    clientName ?? 'the app that sent you'
                }}</span>
            </p>
        </div>

        <div
            class="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900"
        >
            <!-- Tab buttons - only show if not verifying -->
            <div
                v-if="!isVerifying"
                class="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
            >
                <button
                    :class="[
                        'flex-1 select-none rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        curTab === 'signup'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    ]"
                    @click="toggleTab('signup')"
                >
                    Sign Up
                </button>
                <button
                    :class="[
                        'flex-1 select-none rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        curTab === 'login'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    ]"
                    @click="toggleTab('login')"
                >
                    Log In
                </button>
            </div>

            <!-- Error message -->
            <p v-if="otpError || resendOtpError" class="text-sm text-red-500">{{ otpError || resendOtpError }}</p>

            <form class="flex w-full flex-col" @submit.prevent="handleSubmit">

                <!-- OTP Verification View -->
                <div v-if="isVerifying" class="flex w-full flex-col gap-3">
                    <button @click.prevent.stop="toggleTab('login')" type="button"
                        class="self-start text-sm text-zinc-500 transition-colors hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400">
                        &larr; Cancel
                    </button>
                    <p class="text-sm text-zinc-900 dark:text-white">Enter the code sent to your email:</p>
                    <p class="text-sm italic text-zinc-600 dark:text-zinc-300">{{ email }}</p>
                    <input v-model="otpCode"
                        class="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:text-white"
                        required placeholder="Enter verification code" type="text" pattern="[0-9]*" inputmode="numeric" />
                    <div class="flex items-center justify-between">
                        <button type="button" @click="() => resendOtp(email)"
                            class="text-sm text-zinc-500 underline transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                            {{ resendOtpLoading ? 'Sending...' : 'Resend code' }}
                        </button>
                        <button type="submit"
                            :disabled="loading"
                            :class="[
                                'rounded-md px-4 py-2 text-sm font-medium text-white transition-all duration-200',
                                loading ? 'cursor-not-allowed bg-zinc-400' : 'bg-violet-600 hover:bg-violet-700'
                            ]"
                        >
                            {{ loading ? 'Verifying...' : 'Verify Code' }}
                        </button>
                    </div>
                </div>

                <!-- Signup View -->
                <div v-if="curTab === 'signup' && !isVerifying" class="flex w-full flex-col gap-3">
                    <div class="flex gap-2">
                        <input v-model="firstName"
                            class="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:text-white"
                            required placeholder="First Name" />
                        <input v-model="lastName"
                            class="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:text-white"
                            required placeholder="Last Name" />
                    </div>
                    <p class="text-sm text-zinc-600 dark:text-zinc-300">Sign up with your email</p>
                    <input v-model="email"
                        class="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:text-white"
                        required type="email" placeholder="Your email" />
                    <button type="submit"
                        :disabled="loading"
                        :class="[
                            'w-full rounded-md py-2.5 text-sm font-medium text-white transition-all duration-200',
                            loading ? 'cursor-not-allowed bg-zinc-400' : 'bg-violet-600 hover:bg-violet-700'
                        ]"
                    >
                        {{ loading ? 'Loading...' : 'Sign Up' }}
                    </button>
                </div>

                <!-- Login View -->
                <div v-if="curTab === 'login' && !isVerifying" class="flex w-full flex-col gap-3">
                    <p class="text-sm text-zinc-600 dark:text-zinc-300">Log in with your email</p>
                    <input v-model="email"
                        class="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:text-white"
                        required type="email" placeholder="Your email" />
                    <button type="submit"
                        :disabled="loading"
                        :class="[
                            'w-full rounded-md py-2.5 text-sm font-medium text-white transition-all duration-200',
                            loading ? 'cursor-not-allowed bg-zinc-400' : 'bg-violet-600 hover:bg-violet-700'
                        ]"
                    >
                        {{ loading ? 'Loading...' : 'Log In' }}
                    </button>
                </div>
            </form>
        </div>

        <!-- Trust footer -->
        <p class="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            <NuxtLink to="/privacy-policy" class="hover:text-violet-600">Privacy</NuxtLink>
            ·
            <NuxtLink to="/terms-of-service" class="hover:text-violet-600">Terms</NuxtLink>
        </p>
    </div>
</template>
