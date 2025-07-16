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

// * Below is for provider login
// const isLoading = ref(false);
// const auth = useAuthStore();
// type ProviderName = 'Google' | 'Apple' | 'Github' | 'Facebook';
// type ProviderType = {
//     name: ProviderName;
//     icon: string;
//     color: string;
// }
// const providers: ProviderType[] = [
//     // Google - Works !!! (In Development)
//     { name: 'Google', icon: 'flat-color-icons:google', color: 'text-neutral-200 bg-blue-700 hover:bg-blue-600' },
//     // Apple - Does not work :(
//     { name: 'Apple', icon: 'ri:apple-fill', color: 'text-neutral-200 dark:text-black dark:text-black bg-black hover:bg-gray-900 dark:bg-neutral-200 dark:hover:bg-gray-200' },
//     // Github - Works !!! (In Development)
//     { name: 'Github', icon: 'mdi:github', color: 'text-neutral-200 dark:text-black bg-gray-800 hover:bg-gray-900 dark:bg-neutral-200 dark:hover:bg-gray-200' },
//     // Facebook - Does not work :(
//     { name: 'Facebook', icon: 'logos:facebook', color: 'text-neutral-200 hover:bg-blue-600 bg-[#0C63D4]' },
// ]
// const formData = reactive({
//     firstName: '',
//     middleName: '',
//     lastName: '',
//     email: '',
//     birthDate: '',
//     gender: ''
// })
// const handleSubmit = async () => {
//     isLoading.value = true;
//     // console.log('Form submitted:', formData);
//     try {
//       // Simulate an API call
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       // Handle successful submission
//     } catch (error) {
//       // Handle error
//     } finally {
//       isLoading.value = false;
//     }
// }
// const signInWithProvider = async (providerName: ProviderName) => {
//     isLoading.value = true;
//     try {
//         await auth.signInWithProvider(providerName.toLowerCase())
//     } catch (error: any) {
//         console.error('Sign in error:', error.message)
//     } finally {
//         isLoading.value = false;
//     }
// }
// const overlayTransition = {
//     'enter-active-class': 'transition-opacity duration-300 ease-out',
//     'enter-from-class': 'opacity-0',
//     'enter-to-class': 'opacity-100',
//     'leave-active-class': 'transition-opacity duration-200 ease-in',
//     'leave-from-class': 'opacity-100',
//     'leave-to-class': 'opacity-0'
// };
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
    <!-- 
   <div 
        class="mt-[16vh] flex flex-col items-center justify-center"
    >
        <div class="p-8 rounded-lg shadow-md w-96 relative bg-zinc-100 dark:bg-zinc-900"> -->
    <!-- Loading Overlay -->
    <!-- <Transition v-bind="overlayTransition">
                <div 
                    v-if="isLoading"
                    class="absolute inset-0 bg-neutral-200/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-md select-none"
                >
                    <Icon
                        icon="eos-icons:bubble-loading"
                        class="h-12 w-12 text-zinc-500" 
                    />
                </div>
            </Transition>

            <div class="mb-6">
                <button
                    class="mr-4 pb-2"
                    :class="{
                        'text-zinc-600 border-b-2 border-zinc-600 dark:text-neutral-200 dark:border-neutral-200': mode === 'login',
                        'text-neutral-400 hover:text-zinc-400': mode === 'signup'
                    }"
                    @click="mode = 'login'"
                >
                    Login
                </button>
                <button
                    :class="{
                        'text-zinc-600 border-b-2 border-zinc-600 dark:text-neutral-200 dark:border-neutral-200': mode === 'signup',
                        'text-neutral-400 hover:text-zinc-400': mode === 'login'
                    }"
                    class="pb-2"
                    @click="mode = 'signup'"
                >
                    Sign Up
                </button>
            </div>

            <form @submit.prevent="handleSubmit">
                <div class="mb-4">
                    <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2" for="firstName">
                        First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                        v-model="formData.firstName"
                        class="bg-transparent shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline"
                        id="firstName"
                        type="text"
                        autocomplete="given-name"
                        required
                    />
                </div>

                <div class="mb-4" v-if="mode === 'signup'">
                    <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2" for="middleName">
                        Middle Name
                    </label>
                    <input
                        v-model="formData.middleName"
                        class="bg-transparent shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline"
                        id="middleName"
                        type="text"
                        autocomplete="additional-name"
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2" for="lastName">
                        Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                        v-model="formData.lastName"
                        class="bg-transparent shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline"
                        id="lastName"
                        type="text"
                        autocomplete="family-name"
                        required
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2" for="email">
                        Email <span class="text-red-500">*</span>
                    </label>
                    <div class="flex shadow appearance-none border rounded min-w-fit overflow-hidden">
                        <input
                            v-model="formData.email" 
                            class="bg-transparent w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="email"
                            required
                            placeholder="Enter your email"
                            autocomplete="email"
                        />
                    </div>
                </div>

                <template v-if="mode === 'signup'">
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2" for="birthDate">
                            Birth Date
                        </label>
                        <input
                            v-model="formData.birthDate"
                            class="bg-transparent shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline"
                            id="birthDate"
                            type="date"
                            autocomplete="bday"
                        />
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2">
                            Gender
                        </label>
                        <select
                            v-model="formData.gender"
                            class="bg-transparent shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-neutral-200 leading-tight focus:outline-none focus:shadow-outline appearance-none"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </template>

                <button
                    class="bg-zinc-500 hover:bg-zinc-700 dark:bg-transparent dark:bg-zinc-600 dark:hover:bg-zinc-300 dark:hover:text-black transition-colors duration-300 text-neutral-200 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    type="submit"
                >
                    {{ mode === 'login' ? 'Login' : 'Sign Up' }}
                </button>

                Social Provider Buttons
                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-neutral-50 dark:bg-zinc-900 text-gray-500 dark:text-neutral-300">Or sign in with</span>
                        </div>
                    </div> -->

    <!-- <h1 class="mt-3 mb-6 font-extralight text-center dark:text-white">Sign in/up with</h1>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            v-for="provider in providers"
                            :key="provider.name"
                            type="button"
                            :class="[
                                provider.color,
                                'relative flex w-full items-center justify-center gap-2 rounded-sm p-3 py-2 text-sm font-semibold transition-all duration-200'
                            ]"
                            @click="signInWithProvider(provider.name)"
                        >
                            <Icon
                                :icon="provider.icon"
                                class="h-5 w-5"
                                :style="{ color: provider.name === 'Facebook' ? '#0C63D4' : 'inherit' }"
                            />
                            <span>
                                {{ provider.name }}
                            </span>
                        </button>
                    </div> -->
    <!-- </div>
            </form> -->
    <!-- </div>
    </div>
-->
</template>

<!-- <style scoped>
.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}
</style> -->