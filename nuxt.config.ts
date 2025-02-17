import glsl from 'vite-plugin-glsl';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineNuxtConfig } from 'nuxt/config';

declare module '@nuxt/schema' {
  interface NuxtConfig {
    colorMode?: {
      classSuffix?: string
      preference?: string
      fallback?: string
    }
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { 
    enabled: false
  },
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
    '@tresjs/nuxt',
  ],
  plugins: [
    '~/plugins/ui.ts',
    '~/plugins/console.client'
  ],
  // tres: {
  //   devtools: true,
    // glsl: true, // for shaders
  // },
  typescript: {
    strict: true,
    typeCheck: true
  },
  vue: {
    compilerOptions: {
      // hmr: false, // disables hot reloading after changing a file (sometimes lol)
      isCustomElement: (tag: string) =>
        tag.startsWith('Tres') ||
        ['OrbitControls'].includes(tag)
    }
  },
  vite: {
    plugins: [
      glsl(),
      visualizer({
        open: false,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ],
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
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
    }
  },
  // piniaPersistedstate: {
  //   cookieOptions: {
  //     sameSite: 'strict',
  //   },
  //   storage: 'localStorage'
  // },
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
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in'
    }
  },
})
