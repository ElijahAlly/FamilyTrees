<script setup lang="ts">
/**
 * /login is an alias for /signup — the existing signup flow handles both
 * new and returning users via the same email + OTP form. Preserving the
 * URL avoids breaking cross-app redirects from photos.mytrees.family and
 * cinderella.photography that use `/login?return_to=…`.
 */
const route = useRoute();
const router = useRouter();

onMounted(() => {
  router.replace({ path: '/signup', query: route.query });
});
</script>

<template>
  <div class="flex min-h-[100dvh] items-center justify-center bg-zinc-100 text-sm text-gray-500">
    Redirecting…
  </div>
</template>
