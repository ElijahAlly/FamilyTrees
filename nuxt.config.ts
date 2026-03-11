import glsl from 'vite-plugin-glsl';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineNuxtConfig } from 'nuxt/config';

// declare module '@nuxt/schema' {
//   interface NuxtConfig {
//     colorMode?: {
//       classSuffix?: string
//       preference?: string
//       fallback?: string
//     }
//   }
// }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // srcDir: 'src',
  compatibilityDate: '2024-04-03',
  devtools: { 
    enabled: false,
    // Timeline enables the inspection of when composable being executed and the route changes.
    timeline: {
      enabled: false
    }
  },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@formkit/auto-animate',
    '@nuxt/image',
    'radix-vue/nuxt',
    '@nuxtjs/robots',
    '@nuxt/icon',
    '@tresjs/nuxt',
  ],
  plugins: [
    '~/plugins/ui.ts',
    '~/plugins/console.client.ts'
  ],
  // tres: {
  //   devtools: true,
    // glsl: true, // for shaders
  // },
  // piniaPluginPersistedstate: {
  //   key: 'mft-%id',
  //   storage: 'localStorage',
  //   cookieOptions: {
  //     sameSite: 'scrict',
  //   },
  //   debug: false,
  // },
  typescript: {
    strict: true,
    typeCheck: false,
    shim: true
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
      script: [
        {
          innerHTML: `
            (function() {
              const theme = localStorage.getItem('ft-theme') || 'light';
              if (theme === 'dark') {
                document.documentElement.style.backgroundColor = '#18181b';
                document.documentElement.classList.add('dark-mode');
              } else {
                document.documentElement.style.backgroundColor = '#d4d4d8';
                document.documentElement.classList.add('light-mode');
              }
            })()
          `,
        },
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
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
