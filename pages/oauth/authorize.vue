<script setup lang="ts">
/**
 * OAuth2 consent screen. Browser arrives here from a client app
 * (e.g. cinderella.photography) with query params:
 *   ?response_type=code
 *   &client_id=<id>
 *   &redirect_uri=<absolute>
 *   &scope=<space-separated>
 *   &state=<opaque>
 *   &code_challenge=<base64url>
 *   &code_challenge_method=S256
 *
 * If the user isn't logged in to mytrees.family we bounce them to /signup
 * with return_to set so they come back here after OTP verification.
 */
import { Icon } from '@iconify/vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

// Standalone screen: drop the app navbar/footer so only the MyTrees logo shows.
definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const error = ref<string | null>(null);
const submitting = ref(false);
const clientName = ref<string | null>(null);
// Gates the Allow/Deny UI. Only flips true after we've confirmed a live
// session — until then we render nothing user-actionable, so a stale
// localStorage token never shows a "click Allow" UI it can't honor.
const sessionReady = ref(false);

const goToSignIn = () => {
  // Wipe any stale token + persisted user so we don't loop right back here
  // with a 401 on the next mount. ('mft-auth' is the pinia-persist key.)
  if (import.meta.client) {
    localStorage.removeItem('mft-auth-token');
    localStorage.removeItem('mft-auth');
  }
  const here = `${window.location.pathname}${window.location.search}`;
  router.replace({ path: '/signup', query: { return_to: here } });
};

const params = computed(() => ({
  response_type: route.query.response_type as string | undefined,
  client_id: route.query.client_id as string | undefined,
  redirect_uri: route.query.redirect_uri as string | undefined,
  scope: (route.query.scope as string | undefined) || '',
  state: (route.query.state as string | undefined) || '',
  code_challenge: route.query.code_challenge as string | undefined,
  code_challenge_method:
    (route.query.code_challenge_method as 'S256' | 'plain' | undefined) || 'S256',
}));

const requestedScopes = computed(() =>
  (params.value.scope || '').split(/\s+/).filter(Boolean),
);

const friendlyScope = (s: string) => {
  switch (s) {
    case 'profile': return 'Your name and email';
    case 'photos:read': return 'View your photos on photos.mytrees.family';
    case 'photos:write': return 'Upload photos to photos.mytrees.family on your behalf';
    case 'photos:admin': return 'Share and transfer ownership of your photos';
    default: return s;
  }
};

const validate = (): string | null => {
  if (params.value.response_type !== 'code') return 'Unsupported response_type';
  if (!params.value.client_id) return 'client_id required';
  if (!params.value.redirect_uri) return 'redirect_uri required';
  if (!params.value.code_challenge) return 'PKCE code_challenge required';
  return null;
};

onMounted(async () => {
  const v = validate();
  if (v) {
    error.value = v;
    return;
  }

  // Sync fast-path: no persisted user or no token → straight to sign-in
  // before we waste a network round-trip.
  const hasToken = import.meta.client && !!localStorage.getItem('mft-auth-token');
  if (!auth.isAuthenticated || !hasToken) {
    goToSignIn();
    return;
  }

  // Verify the token is actually live (the DB may have been wiped, the
  // JWT may have expired, etc.) and fetch the friendly client name in
  // parallel. Only flip sessionReady once both succeed.
  try {
    const [client] = await Promise.all([
      $fetch<{ name: string }>(
        `/api/oauth/client/${encodeURIComponent(params.value.client_id!)}`,
      ),
      $fetch('/api/auth/get-profile'),
    ]);
    clientName.value = client?.name ?? null;
    sessionReady.value = true;
  } catch (e: any) {
    if (e?.status === 401 || e?.statusCode === 401) {
      goToSignIn();
      return;
    }
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load';
  }
});

const submit = async (decision: 'allow' | 'deny') => {
  if (submitting.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const token = import.meta.client ? localStorage.getItem('mft-auth-token') : null;
    const res = await $fetch<{ redirectUrl: string }>('/api/oauth/authorize', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: {
        clientId: params.value.client_id,
        redirectUri: params.value.redirect_uri,
        scope: params.value.scope,
        state: params.value.state,
        codeChallenge: params.value.code_challenge,
        codeChallengeMethod: params.value.code_challenge_method,
        decision,
      },
    });
    if (res?.redirectUrl) {
      window.location.href = res.redirectUrl;
    } else {
      error.value = 'No redirect URL returned';
    }
  } catch (e: any) {
    // Token expired between mount and submit — silently re-auth instead of
    // showing a confusing "Invalid or expired token" message.
    if (e?.status === 401 || e?.statusCode === 401) {
      goToSignIn();
      return;
    }
    error.value = e?.data?.statusMessage || e?.message || 'Submit failed';
  } finally {
    submitting.value = false;
  }
};
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

    <div
      class="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <!-- Error -->
      <div v-if="error" class="text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950"
        >
          <Icon
            icon="mdi:alert-circle-outline"
            class="h-7 w-7 text-red-600 dark:text-red-400"
          />
        </div>
        <h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Something's off
        </h1>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{{ error }}</p>
        <button
          class="mt-5 text-sm font-medium text-violet-600 hover:text-violet-500"
          @click="goToSignIn"
        >
          Back to sign in
        </button>
      </div>

      <!-- Verifying session -->
      <div v-else-if="!sessionReady" class="flex flex-col items-center py-6">
        <LoadingSpinner />
        <p class="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Checking your session…
        </p>
      </div>

      <!-- Consent -->
      <div v-else>
        <h1
          class="text-center text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100"
        >
          <span class="text-violet-600 dark:text-violet-400">{{
            clientName ?? params.client_id
          }}</span>
          wants to use your MyTrees.family account
        </h1>
        <p class="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Grant permission?
        </p>

        <!-- Signed-in identity (one account per user — no switcher) -->
        <div
          class="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold uppercase text-white"
          >
            {{ (auth.userEmail || '?').charAt(0) }}
          </div>
          <div class="min-w-0">
            <p
              class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              {{ auth.userEmail }}
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Signed in to MyTrees.family
            </p>
          </div>
        </div>

        <!-- Requested permissions -->
        <div v-if="requestedScopes.length" class="mt-5">
          <p
            class="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
          >
            This will let {{ clientName ?? 'this app' }}:
          </p>
          <ul class="mt-3 space-y-2.5">
            <li
              v-for="scope in requestedScopes"
              :key="scope"
              class="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <Icon
                icon="mdi:check-circle"
                class="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400"
              />
              <span>{{ friendlyScope(scope) }}</span>
            </li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="mt-7 flex gap-3">
          <button
            :disabled="submitting"
            class="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            @click="submit('deny')"
          >
            Deny
          </button>
          <button
            :disabled="submitting"
            class="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
            @click="submit('allow')"
          >
            {{ submitting ? 'Working…' : 'Allow' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Trust footer -->
    <p class="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
      Securely signing in with
      <NuxtLink to="/" class="font-medium text-zinc-500 hover:text-violet-600 dark:text-zinc-400">MyTrees.family</NuxtLink>
      ·
      <NuxtLink to="/privacy-policy" class="hover:text-violet-600">Privacy</NuxtLink>
      ·
      <NuxtLink to="/terms-of-service" class="hover:text-violet-600">Terms</NuxtLink>
    </p>
  </div>
</template>
