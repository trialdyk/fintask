<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage, useColorMode } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'
import { useAppConfig } from '#imports'
import type { DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const authStore = useAuthStore()
const colorMode = useColorMode()
const appConfig = useAppConfig()
import { useTable } from 'spacetimedb/vue'
import { tables } from '../../src/module_bindings'

const [tasks] = useTable(tables.Task)
const incompleteTasksCount = computed(() => {
    return tasks.value ? tasks.value.filter(t => !t.isCompleted).length : 0
})

// Computed variables for Auth
const user = computed(() => {
    if (!authStore.oidcUser) {
        return {
            name: 'Guest',
            avatar: { src: undefined, alt: 'Guest' },
        }
    }
    return {
        name: authStore.oidcUser.profile.name || authStore.oidcUser.profile.preferred_username || 'Pengguna Fintask',
        avatar: {
            src: authStore.oidcUser.profile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authStore.oidcUser.profile.email || 'fintask'}`,
            alt: authStore.oidcUser.profile.name || 'Pengguna Fintask',
        },
    }
})

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

// Color mapping for chips
const colorMap: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
    slate: '#64748b',
    gray: '#6b7280',
    zinc: '#71717a',
    neutral: '#737373',
    stone: '#78716c',
    'old-neutral': '#737373'
}

// Helper to manually close popovers/tooltips on route change
const closePopovers = () => {
  document.dispatchEvent(new Event('mousedown'))
  document.dispatchEvent(new Event('mouseup'))
}

// Check current routes
const isInTransactionRoute = computed(() => route.path.startsWith('/dashboard/transactions'))
const isInTaskRoute = computed(() => route.path.startsWith('/dashboard/tasks'))
const isInSettingsRoute = computed(() => route.path.startsWith('/dashboard/settings'))

const collapsed = useLocalStorage('fintask_sidebar_collapsed', false)

// Sidebar navigation items
const navigation = computed(() => [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Transaksi',
    icon: 'i-heroicons-banknotes',
    to: '/dashboard/transactions',
    active: isInTransactionRoute.value,
  },
  {
    label: 'Statistik',
    icon: 'i-heroicons-chart-bar-square',
    to: '/dashboard/statistics'
  },
  {
    label: 'Tugas Harian',
    icon: 'i-heroicons-clipboard-document-check',
    to: '/dashboard/tasks',
    active: isInTaskRoute.value,
    badge: incompleteTasksCount.value > 0 ? String(incompleteTasksCount.value) : undefined
  },
  {
    label: 'Pengaturan',
    icon: 'i-heroicons-cog-8-tooth',
    active: isInSettingsRoute.value,
    defaultOpen: !collapsed.value && isInSettingsRoute.value,
    onSelect: () => { if (collapsed.value) closePopovers() },
    children: [
      {
        label: 'Dompet & Saldo',
        icon: 'i-heroicons-wallet',
        to: '/dashboard/settings/wallets'
      },
      {
        label: 'Kategori Keuangan',
        icon: 'i-heroicons-rectangle-group',
        to: '/dashboard/settings/transaction-categories'
      },
      {
        label: 'Kategori Tugas',
        icon: 'i-heroicons-tag',
        to: '/dashboard/settings/task-category'
      },
    ]
  }
])

// Profile Dropdown Menu Items
const profileMenuItems = computed<DropdownMenuItem[][]>(() => {
    const sections: DropdownMenuItem[][] = []

    // User label
    sections.push([{
        type: 'label',
        label: user.value.name,
        avatar: user.value.avatar,
    }])

    // Profil link
    sections.push([{
        label: 'Profil',
        icon: 'i-lucide-user',
        to: '/dashboard/settings/profile',
    }])

    // Theme section
    sections.push([{
        label: 'Tema',
        icon: 'i-lucide-palette',
        children: [{
            label: 'Primary',
            slot: 'chip',
            chip: appConfig.ui.colors.primary,
            content: {
                align: 'center',
                collisionPadding: 16,
            },
            children: colors.map(color => ({
                label: color,
                chip: color,
                slot: 'chip',
                checked: appConfig.ui.colors.primary === color,
                type: 'checkbox',
                onSelect: (e: Event) => {
                    e.preventDefault()
                    appConfig.ui.colors.primary = color
                },
            })),
        }, {
            label: 'Neutral',
            slot: 'chip',
            chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
            content: {
                align: 'end',
                collisionPadding: 16,
            },
            children: neutrals.map(color => ({
                label: color,
                chip: color === 'neutral' ? 'old-neutral' : color,
                slot: 'chip',
                type: 'checkbox',
                checked: appConfig.ui.colors.neutral === color,
                onSelect: (e: Event) => {
                    e.preventDefault()
                    appConfig.ui.colors.neutral = color
                },
            })),
        }],
    }, {
        label: 'Tampilan',
        icon: 'i-lucide-sun-moon',
        children: [{
            label: 'Light',
            icon: 'i-lucide-sun',
            type: 'checkbox',
            checked: colorMode.value === 'light',
            onSelect(e: Event) {
                e.preventDefault();
                (colorMode as any).preference = 'light'
            },
        }, {
            label: 'Dark',
            icon: 'i-lucide-moon',
            type: 'checkbox',
            checked: colorMode.value === 'dark',
            onSelect(e: Event) {
                e.preventDefault();
                (colorMode as any).preference = 'dark'
            },
        }],
    }])

    // Logout
    sections.push([{
        label: 'Keluar',
        icon: 'i-lucide-log-out',
        color: 'error',
        onSelect: async () => {
            await authStore.logout()
        },
    }])

    return sections
})
</script>

<template>
  <UDashboardGroup>
    <!-- Sidebar (always dark) -->
    <UDashboardSidebar collapsible v-model:collapsed="collapsed" class="dark sidebar-force-dark">
      <template #header>
        <NuxtLink to="/dashboard" class="flex items-center gap-2 px-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
              <path d="M8 15l2 2 4-4" stroke-width="2.5" class="text-emerald-400" />
            </svg>
          </div>
          <span v-if="!collapsed" class="text-xl font-bold text-white">Fintask</span>
        </NuxtLink>
      </template>

      <!-- Nuxt UI handles orientation and collapsed props -->
      <UNavigationMenu :items="navigation" :collapsed="collapsed" orientation="vertical" tooltip popover />

      <template #footer>
        <div class="mt-auto w-full pt-4 space-y-2">
            <USeparator />
            
            <UDropdownMenu
                :items="profileMenuItems"
                :content="{ align: 'center', collisionPadding: 12 }"
                :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
            >
                <UButton
                    :avatar="user.avatar as any"
                    :label="collapsed ? undefined : user.name"
                    :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
                    color="neutral"
                    variant="ghost"
                    block
                    :square="collapsed"
                    class="data-[state=open]:bg-elevated"
                    :ui="{ trailingIcon: 'text-dimmed' }"
                />

                <template #chip-leading="{ item }">
                    <div class="inline-flex items-center justify-center shrink-0 size-5">
                        <span
                            class="rounded-full ring-1 ring-white/20 size-2.5"
                            :style="{ backgroundColor: colorMap[(item as any).chip] }"
                        />
                    </div>
                </template>
            </UDropdownMenu>
        </div>
      </template>
    </UDashboardSidebar>

    <!-- Main Content Panel -->
    <UDashboardPanel grow class="bg-white dark:bg-slate-950">
      <!-- Navbar -->
      <UDashboardNavbar>
        <template #left>

          <UButton
            :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            variant="ghost"
            color="neutral"
            @click="collapsed = !collapsed"
            class="hidden lg:flex"
          />
        </template>
      </UDashboardNavbar>

      <!-- Page Content -->
      <div class="p-6 overflow-y-scroll" :class="{ 'table-black-text-global': true }">
        <slot />
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
