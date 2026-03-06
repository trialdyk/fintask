export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-01-01',
  telemetry: false,
  devServer: {
    port: 5173,
  },
  runtimeConfig: {
    public: {
      spacetimeHost: process.env.VITE_SPACETIMEDB_HOST || 'localhost',
      spacetimeDbName: process.env.VITE_SPACETIMEDB_DB_NAME || 'nuxt-fintask-vzofg',
      spacetimeClientId: process.env.VITE_SPACETIME_CLIENT_ID,
    }
  },
  routeRules: {
    '/dashboard/**': { appLayout: 'dashboard' },
  }
});
