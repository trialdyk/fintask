<template>
  <UApp :toaster="{ position: 'top-right' }">
    <ClientOnly>
      <SpacetimeDBProvider v-if="connectionBuilder" :connection-builder="connectionBuilder">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </SpacetimeDBProvider>
      <template #fallback>
        <div class="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p class="text-sm font-medium text-slate-500">Connecting to Server...</p>
        </div>
      </template>
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider } from 'spacetimedb/vue';
import { DbConnection, type ErrorContext } from '../src/module_bindings';

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Fintask` : 'Fintask';
  },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ]
});

const config = useRuntimeConfig();
const HOST = config.public.spacetimeHost as string;
const DB_NAME = config.public.spacetimeDbName as string;
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  console.log(
    'Connected to SpacetimeDB with identity:',
    identity.toHexString()
  );

  // Subscribe to tables needed across the app
  conn.subscriptionBuilder()
    .onApplied(() => {
      console.log('SpacetimeDB data loaded');
    })
    .subscribe([
      'SELECT * FROM task',
      'SELECT * FROM task_category',
      'SELECT * FROM transaction',
      'SELECT * FROM transaction_category',
      'SELECT * FROM transaction_subcategory',
      'SELECT * FROM wallet'
    ]);
};

const onDisconnect = () => {
  console.log('Disconnected from SpacetimeDB');
};

const onConnectError = (_ctx: ErrorContext, err: Error) => {
  console.log('Error connecting to SpacetimeDB:', err);
};

const connectionBuilder = import.meta.client
  ? DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError)
  : undefined;
</script>
