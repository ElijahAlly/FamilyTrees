<script lang="ts" setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/useAuth';
import { useRoute } from 'nuxt/app';
import { storeToRefs } from 'pinia';

type TabView = 'signup' | 'login';

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
    <section class="w-full min-h-screen flex justify-center items-start pt-32 px-4">
        <div class="w-full max-w-sm flex flex-col gap-4 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 shadow-lg p-8">
            <!-- Tab buttons - only show if not verifying -->
            <div v-if="!isVerifying" class="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
                <button
                    :class="[
                        'flex-1 py-1.5 px-3 rounded text-sm font-medium transition-all duration-200 select-none',
                        curTab === 'signup'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    ]"
                    @click="toggleTab('signup')"
                >
                    Sign Up
                </button>
                <button
                    :class="[
                        'flex-1 py-1.5 px-3 rounded text-sm font-medium transition-all duration-200 select-none',
                        curTab === 'login'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    ]"
                    @click="toggleTab('login')"
                >
                    Log In
                </button>
            </div>

            <!-- Error message -->
            <p v-if="otpError || resendOtpError" class="text-red-500 text-sm">{{ otpError || resendOtpError }}</p>

            <form class="flex flex-col w-full" @submit.prevent="handleSubmit">

                <!-- OTP Verification View -->
                <div v-if="isVerifying" class="flex flex-col gap-3 w-full">
                    <button @click.prevent.stop="toggleTab('login')" type="button"
                        class="text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors self-start">
                        &larr; Cancel
                    </button>
                    <p class="text-zinc-900 dark:text-white text-sm">Enter the code sent to your email:</p>
                    <p class="text-zinc-600 dark:text-zinc-300 text-sm italic">{{ email }}</p>
                    <input v-model="otpCode"
                        class="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        required placeholder="Enter verification code" type="text" pattern="[0-9]*" inputmode="numeric" />
                    <div class="flex justify-between items-center">
                        <button type="button" @click="() => resendOtp(email)"
                            class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm underline transition-colors">
                            {{ resendOtpLoading ? 'Sending...' : 'Resend code' }}
                        </button>
                        <button type="submit"
                            :disabled="loading"
                            :class="[
                                'px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200',
                                loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                            ]"
                        >
                            {{ loading ? 'Verifying...' : 'Verify Code' }}
                        </button>
                    </div>
                </div>

                <!-- Signup View -->
                <div v-if="curTab === 'signup' && !isVerifying" class="flex flex-col gap-3 w-full">
                    <div class="flex gap-2">
                        <input v-model="firstName"
                            class="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            required placeholder="First Name" />
                        <input v-model="lastName"
                            class="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            required placeholder="Last Name" />
                    </div>
                    <p class="text-zinc-600 dark:text-zinc-300 text-sm">Sign up with your email</p>
                    <input v-model="email"
                        class="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        required type="email" placeholder="Your email" />
                    <button type="submit"
                        :disabled="loading"
                        :class="[
                            'w-full py-2.5 text-sm font-medium text-white rounded-md transition-all duration-200',
                            loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                        ]"
                    >
                        {{ loading ? 'Loading...' : 'Sign Up' }}
                    </button>
                </div>

                <!-- Login View -->
                <div v-if="curTab === 'login' && !isVerifying" class="flex flex-col gap-3 w-full">
                    <p class="text-zinc-600 dark:text-zinc-300 text-sm">Log in with your email</p>
                    <input v-model="email"
                        class="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        required type="email" placeholder="Your email" />
                    <button type="submit"
                        :disabled="loading"
                        :class="[
                            'w-full py-2.5 text-sm font-medium text-white rounded-md transition-all duration-200',
                            loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                        ]"
                    >
                        {{ loading ? 'Loading...' : 'Log In' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>
