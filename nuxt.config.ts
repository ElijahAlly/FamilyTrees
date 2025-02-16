import glsl from 'vite-plugin-glsl';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { 
    enabled: true
  },
  hooks: process.env.NODE_ENV === 'development' ? {
    'prepare:types': async () => {
      const { generateAutoStyles } = await import('./scripts/generate-auto-styles')
      await generateAutoStyles()
    }
  } : undefined,
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@formkit/auto-animate',
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    'radix-vue/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/robots',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxt/icon',
    '@tresjs/nuxt'
  ],
  plugins: [
    '~/plugins/ui',
    process.env.NODE_ENV === 'development' ? '~/plugins/auto-style' : undefined,
    '~/plugins/console.client'
  ].filter((plugin): plugin is string => Boolean(plugin)),
  tres: {
    devtools: true,
    // glsl: true, // for shaders
  },
  vue: {
    compilerOptions: {
      hmr: false, // disables hot reloading after changing a file (sometimes lol) // * auto-style
      isCustomElement: (tag: string) =>
        tag.startsWith('Tres') ||
        ['OrbitControls'].includes(tag),
    }
  },
  vite: {
    plugins: [glsl()],
    define: {
      __VUE_PROD_DEVTOOLS__: true,
    },
    build: {
      sourcemap: true
    },
    // vue: {
    //   template: {
    //     compilerOptions: {
    //       nodeTransforms: [
    //         (node) => {
    //           console.log('Node transform:', node)
    //         }
    //       ]
    //     }
    //   }
    // }
  },
  experimental: {
    componentIslands: true,
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
    }
  },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    // redirect: false, // maybe `true`
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/trees/*'],
      exclude: ['/'],
      cookieRedirect: false,
    }
  },
  piniaPersistedstate: {
    cookieOptions: {
      sameSite: 'strict',
    },
    storage: 'localStorage'
  },
  colorMode: {
    classSuffix: '-mode',
    preference: 'light',
    fallback: 'light',
  },
  app: {
    head: {
      title: 'MyTrees.family',
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#8b5cf6' },
      ],
      meta: [
        { name: 'description', content: 'View your family trees, and discover your lineage.' },
        { name: 'msapplication-TileColor', content: '#8b5cf6' },
        { name: 'theme-color', content: '#ffffff' },
      ],
    },
  },
})