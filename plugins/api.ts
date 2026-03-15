export default defineNuxtPlugin(() => {
    const getToken = () => {
        if (import.meta.server) return null;
        return localStorage.getItem('mft-auth-token');
    };

    globalThis.$fetch = $fetch.create({
        onRequest({ options }: { options: { headers?: HeadersInit | Record<string, string> } }) {
            const token = getToken();
            if (token) {
                options.headers = options.headers || {};
                if (Array.isArray(options.headers)) {
                    options.headers.push(['Authorization', `Bearer ${token}`]);
                } else if (options.headers instanceof Headers) {
                    options.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                }
            }
        },
    }) as typeof $fetch;
});
