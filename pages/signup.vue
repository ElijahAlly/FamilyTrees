<script lang="ts" setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/useAuth';
import { useRoute } from 'nuxt/app';
import { storeToRefs } from 'pinia';

type TabView = 'signup' | 'login';

const route = useRoute();

const email = ref('');
const username = ref('');
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
    username.value = '';
    otpError.value = null;
    isVerifying.value = false;
    loading.value = false;
    resendOtpError.value = null;
    resendOtpLoading.value = false;
}

const handleSubmit = async () => {
    if (isVerifying.value) {
        // Verify the otp, which then calls getProfile in the useAuth store 
        const success = await verifyOtp(email.value, otpCode.value);
    } else {
        if (curTab.value === 'signup') {
            handleSignUp(email.value, username.value);
        } else {
            handleLogin(email.value);
        }
    }
}

const baseTabStyles = 'transition-all duration-200 p-1 rounded select-none';
const inactiveTabStyles = 'text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-500 hover:text-white';
const activeTabStyles = 'text-white bg-zinc-700 hover:bg-zinc-700 hover:text-white';

const baseSubmitStyles = 'text-white rounded-md transition-all duration-200 p-1';
const disabledSubmitStyles = 'bg-zinc-600 hover:bg-zinc-600 opacity-50 pointer-events-none';
const activeSubmitStyles = 'bg-emerald-600 hover:bg-emerald-700';
</script>

<template>
    <section class="w-full h-full flex justify-center">
        <div
            class="h-fit w-[50%] min-w-96 max-w-[360px] flex flex-col gap-3 border dark:border-zinc-500 rounded shadow-lg shadow-zinc-600/45 mt-48 p-9">
            <!-- Tab buttons - only show if not verifying -->
            <div v-if="!isVerifying" class="flex gap-3">
                <div :class="[baseTabStyles, { [inactiveTabStyles]: curTab !== 'signup', [activeTabStyles]: curTab === 'signup' }]"
                    role="button" @click="toggleTab('signup')">
                    Signup
                </div>
                <div :class="[baseTabStyles, { [inactiveTabStyles]: curTab !== 'login', [activeTabStyles]: curTab === 'login' }]"
                    role="button" @click="toggleTab('login')">
                    Login
                </div>
            </div>

            <!-- Error message -->
            <p v-if="otpError || resendOtpError" class="text-red-500 text-sm">{{ otpError || resendOtpError }}</p>

            <form class="row flex-center flex w-full" @submit.prevent="handleSubmit">

                <!-- OTP Verification View -->
                <div v-if="isVerifying" class="col-6 form-widget w-full">
                    <button @click.prevent.stop="toggleTab('login')"
                        class="text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors mb-4">
                        {{ '<-' }} Cancel </button>
                            <p class="dark:text-white">Enter the code sent to your email:</p>
                            <p class="dark:text-zinc-200 my-2 italic">{{ email }}</p>
                            <div class="my-4">
                                <input v-model="otpCode" class="border rounded p-3 w-full" required
                                    placeholder="Enter verification code" type="text" pattern="[0-9]*"
                                    inputmode="numeric" />
                            </div>
                            <div class="w-full flex justify-between px-1">
                                <p @click="() => resendOtp(email)"
                                    class="text-zinc-500 dark:text-zinc-400 underline hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer p-1 border border-zinc-500 hover:border-zinc-800 dark:border-zinc-400 dark:hover:border-zinc-200 rounded-md transition-colors">
                                    {{ resendOtpLoading ? 'sending new code...' : 'resend code' }}
                                </p>
                                <input type="submit"
                                    :class="[baseSubmitStyles, { [disabledSubmitStyles]: loading, [activeSubmitStyles]: !loading }]"
                                    role="button" :value="loading ? 'Verifying...' : 'Verify Code'"
                                    :disabled="loading" />
                            </div>
                </div>

                <!-- Signup View -->
                <div v-if="curTab === 'signup' && !isVerifying" class="col-6 form-widget">
                    <div class="my-3">
                        <input v-model="username" class="border rounded p-3" required placeholder="Your Username" />
                    </div>
                    <p class="dark:text-white">Sign up with your email</p>
                    <div class="my-3">
                        <input v-model="email" class="border rounded p-3" required type="email"
                            placeholder="Your email" />
                    </div>
                    <div>
                        <input type="submit"
                            :class="[baseSubmitStyles, { [disabledSubmitStyles]: loading, [activeSubmitStyles]: !loading }]"
                            role="button" :value="loading ? 'Loading...' : 'Signup'" :disabled="loading" />
                    </div>
                </div>

                <!-- Login View -->
                <div v-if="curTab === 'login' && !isVerifying" class="col-6 form-widget">
                    <p class="my-3 dark:text-white">Login with your email</p>
                    <div class="my-3">
                        <input v-model="email" class="border rounded p-3" required type="email"
                            placeholder="Your email" />
                    </div>
                    <div>
                        <input type="submit"
                            :class="[baseSubmitStyles, { [disabledSubmitStyles]: loading, [activeSubmitStyles]: !loading }]"
                            role="button" :value="loading ? 'Loading...' : 'Login'" :disabled="loading" />
                    </div>
                </div>
            </form>
        </div>
    </section>
</template>
