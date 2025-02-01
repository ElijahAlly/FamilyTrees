<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';

const mode = ref<'signin' | 'signup'>('signin');
const isLoading = ref(false);

const auth = useAuthStore();

type ProviderName = 'Google' | 'Apple' | 'Github' | 'Facebook';
type ProviderType = {
    name: ProviderName;
    icon: string;
    color: string;
}

const providers: ProviderType[] = [
    // Google - Works !!! (In Development)
    { name: 'Google', icon: 'flat-color-icons:google', color: 'text-neutral-200 bg-blue-700 hover:bg-blue-600' },
    // Apple - Does not work :(
    { name: 'Apple', icon: 'ri:apple-fill', color: 'text-neutral-200 dark:text-black dark:text-black bg-black hover:bg-gray-900 dark:bg-neutral-200 dark:hover:bg-gray-200' },
    // Github - Works !!! (In Development)
    { name: 'Github', icon: 'mdi:github', color: 'text-neutral-200 dark:text-black bg-gray-800 hover:bg-gray-900 dark:bg-neutral-200 dark:hover:bg-gray-200' },
    // Facebook - Does not work :(
    { name: 'Facebook', icon: 'logos:facebook', color: 'text-neutral-200 hover:bg-blue-600 bg-[#0C63D4]' },
]

const formData = reactive({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    birthDate: '',
    gender: ''
})

const handleSubmit = async () => {
    isLoading.value = true;
    // console.log('Form submitted:', formData);

    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Handle successful submission
    } catch (error) {
      // Handle error
    } finally {
      isLoading.value = false;
    }
}

const signInWithProvider = async (providerName: ProviderName) => {
    isLoading.value = true;
    try {
        await auth.signInWithProvider(providerName.toLowerCase())
    } catch (error: any) {
        console.error('Sign in error:', error.message)
    } finally {
        isLoading.value = false;
    }
}

const overlayTransition = {
    'enter-active-class': 'transition-opacity duration-300 ease-out',
    'enter-from-class': 'opacity-0',
    'enter-to-class': 'opacity-100',
    'leave-active-class': 'transition-opacity duration-200 ease-in',
    'leave-from-class': 'opacity-100',
    'leave-to-class': 'opacity-0'
};
</script>

<template>
    <div 
        class="min-h-screen flex flex-col items-center justify-center"
        :class="{
            '-translate-y-48': mode === 'signin',
            '-translate-y-16': mode === 'signup',
        }"
    >
        <div class="bg-neutral-50 dark:bg-zinc-900 p-8 rounded-lg shadow-md w-96 relative">
            <!-- Loading Overlay -->
            <Transition v-bind="overlayTransition">
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
                        'text-zinc-600 border-b-2 border-zinc-600 dark:text-neutral-200 dark:border-neutral-200': mode === 'signin',
                        'text-neutral-400 hover:text-zinc-400': mode === 'signup'
                    }"
                    @click="mode = 'signin'"
                >
                    Sign In
                </button>
                <button
                    :class="{
                        'text-zinc-600 border-b-2 border-zinc-600 dark:text-neutral-200 dark:border-neutral-200': mode === 'signup',
                        'text-neutral-400 hover:text-zinc-400': mode === 'signin'
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
                    {{ mode === 'signin' ? 'Sign In' : 'Sign Up' }}
                </button>

                <!-- Social Provider Buttons -->
                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-neutral-50 dark:bg-zinc-900 text-gray-500 dark:text-neutral-300">Or sign in with</span>
                        </div>
                    </div>

                    <div class="mt-6 grid grid-cols-2 gap-3">
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
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}
</style>