export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/icon', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-01-01',
  telemetry: false,
  ssr: false,
  devServer: {
    port: 5173,
  },
  supabase: {
    redirect: false,
  },
  routeRules: {
    '/dashboard/**': { appLayout: 'dashboard' },
  },
});
