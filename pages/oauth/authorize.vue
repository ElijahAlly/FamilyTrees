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
  <div class="flex min-h-[100dvh] items-center justify-center bg-zinc-100 px-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div v-if="error" class="text-red-600">
        <h1 class="text-xl font-bold">Something's off</h1>
        <p class="mt-2 text-sm">{{ error }}</p>
      </div>
      <div v-else-if="!sessionReady">
        <p class="text-sm text-gray-500">Checking your session…</p>
      </div>
      <div v-else>
        <h1 class="text-xl font-bold text-gray-900">
          <span class="text-gray-500">{{ clientName ?? params.client_id }}</span> wants to
          access your mytrees.family account
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Signed in as <strong>{{ auth.userEmail }}</strong>
        </p>

        <ul class="mt-5 space-y-2">
          <li
            v-for="scope in requestedScopes"
            :key="scope"
            class="flex items-start gap-2 text-sm"
          >
            <span class="mt-0.5 text-green-500">✓</span>
            <span>{{ friendlyScope(scope) }}</span>
          </li>
        </ul>

        <div class="mt-6 flex gap-2">
          <button
            :disabled="submitting"
            class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            @click="submit('deny')"
          >
            Deny
          </button>
          <button
            :disabled="submitting"
            class="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            @click="submit('allow')"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
