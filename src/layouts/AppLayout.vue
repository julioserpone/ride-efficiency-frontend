<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getStoredToken } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mobileBreakpoint = '(max-width: 767px)'
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia(mobileBreakpoint).matches)
const isCollapsed = ref(false)
const isSidebarOpen = ref(!isMobile.value)
const profileError = ref<string | null>(null)
let mobileMediaQuery: MediaQueryList | null = null

const navigation = [
    { label: 'Resumen', icon: 'pi pi-chart-line', route: 'overview' },
    { label: 'Turnos', icon: 'pi pi-calendar', route: 'shifts' },
    { label: 'Energía y recibos', icon: 'pi pi-receipt', route: 'invoices' },
    { label: 'Vehículos y viajes', icon: 'pi pi-car', route: 'fleet' },
]

function updateViewport(event: MediaQueryListEvent | MediaQueryList): void {
    isMobile.value = event.matches

    if (event.matches) {
        isSidebarOpen.value = false
    }
}

function closeSidebarOnMobile(): void {
    if (isMobile.value) {
        isSidebarOpen.value = false
    }
}

onMounted(async () => {
    mobileMediaQuery = window.matchMedia(mobileBreakpoint)
    updateViewport(mobileMediaQuery)
    mobileMediaQuery.addEventListener('change', updateViewport)

    if (auth.user === null && auth.isAuthenticated) {
        try {
            await auth.loadCurrentUser()
        } catch (error) {
            profileError.value = error instanceof Error ? error.message : 'No se pudo cargar el perfil.'

            if (getStoredToken() === null) {
                await router.replace({ name: 'login' })
            }
        }
    }
})

onBeforeUnmount(() => {
    mobileMediaQuery?.removeEventListener('change', updateViewport)
})

const initials = computed(() => {
    const name = auth.user?.name ?? 'Ride Efficiency'

    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
})

async function handleLogout(): Promise<void> {
    closeSidebarOnMobile()
    await auth.logout()
    await router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex min-h-screen bg-canvas">
        <aside
            class="flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-all duration-200"
            :aria-hidden="isMobile && !isSidebarOpen"
            :inert="isMobile && !isSidebarOpen"
            :class="[
                isMobile
                    ? [
                          'fixed inset-y-0 left-0 z-40 w-72 shadow-xl',
                          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                      ]
                    : ['sticky top-0', isCollapsed ? 'w-16' : 'w-60'],
            ]"
        >
            <div class="flex h-14 items-center gap-2 border-b border-line px-4">
                <span
                    class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-semibold text-white"
                >
                    RE
                </span>
                <span v-if="isMobile || !isCollapsed" class="truncate text-sm font-semibold text-ink">
                    Ride Efficiency
                </span>
                <button
                    v-if="isMobile"
                    type="button"
                    class="ml-auto grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
                    aria-label="Cerrar menú"
                    @click="closeSidebarOnMobile"
                >
                    <i class="pi pi-times" />
                </button>
            </div>

            <nav class="flex flex-1 flex-col gap-1 p-2">
                <RouterLink
                    v-for="item in navigation"
                    :key="item.route"
                    :to="{ name: item.route }"
                    class="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                    active-class="bg-canvas font-medium text-ink"
                    :title="item.label"
                    @click="closeSidebarOnMobile"
                >
                    <span
                        v-if="$route.name === item.route"
                        class="absolute top-1.5 bottom-1.5 -left-2 w-[3px] rounded-full bg-brand"
                    />
                    <i :class="item.icon" class="text-base" />
                    <span v-if="isMobile || !isCollapsed" class="truncate">{{ item.label }}</span>
                </RouterLink>
            </nav>

            <div v-if="!isMobile" class="border-t border-line p-2">
                <button
                    type="button"
                    class="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                    :aria-label="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
                    @click="isCollapsed = !isCollapsed"
                >
                    <i :class="isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
                    <span v-if="!isCollapsed">Colapsar</span>
                </button>
            </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
            <button
                v-if="isMobile && isSidebarOpen"
                type="button"
                class="fixed inset-0 z-30 bg-ink/35"
                aria-label="Cerrar menú"
                @click="closeSidebarOnMobile"
            />
            <header
                class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6"
            >
                <div class="flex min-w-0 items-center gap-3">
                    <button
                        v-if="isMobile"
                        type="button"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
                        aria-label="Abrir menú"
                        :aria-expanded="isSidebarOpen"
                        @click="isSidebarOpen = !isSidebarOpen"
                    >
                        <i :class="isSidebarOpen ? 'pi pi-times' : 'pi pi-bars'" />
                    </button>
                    <div class="truncate text-sm text-ink-muted">
                        {{ $route.meta.title ?? '' }}
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <span v-if="profileError" class="hidden text-xs text-loss sm:inline" role="status">
                        {{ profileError }}
                    </span>
                    <span class="hidden text-sm text-ink sm:inline">{{ auth.user?.name ?? 'Invitado' }}</span>
                    <span
                        class="grid h-8 w-8 place-items-center rounded-full border-line text-xs font-medium text-ink-muted"
                    >
                        {{ initials }}
                    </span>
                    <button
                        type="button"
                        class="rounded-lg border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                        @click="handleLogout"
                    >
                        Salir
                    </button>
                </div>
            </header>

            <main class="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
                <slot />
            </main>
        </div>
    </div>
</template>
