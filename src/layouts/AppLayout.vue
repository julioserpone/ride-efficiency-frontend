<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const isCollapsed = ref(false)

const navigation = [
    { label: 'Resumen', icon: 'pi pi-chart-line', route: 'overview' },
    { label: 'Turnos', icon: 'pi pi-calendar', route: 'shifts' },
    { label: 'Recibos', icon: 'pi pi-receipt', route: 'invoices' },
]

const initials = computed(() => {
    const name = auth.user?.name ?? 'Ride Efficiency'

    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
})

async function handleLogout(): Promise<void> {
    await auth.logout()
    await router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex min-h-screen bg-canvas">
        <!-- Sidebar: 240px expanded, 64px collapsed. The active item is marked
             with a 3px emerald bar on the left, per the "Slate Focus" style. -->
        <aside
            class="sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-all duration-200"
            :class="isCollapsed ? 'w-16' : 'w-60'"
        >
            <div class="flex h-14 items-center gap-2 border-b border-line px-4">
                <span
                    class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-profit text-sm font-semibold text-white"
                >
                    RE
                </span>
                <span v-if="!isCollapsed" class="truncate text-sm font-semibold text-ink"> Ride Efficiency </span>
            </div>

            <nav class="flex flex-1 flex-col gap-1 p-2">
                <RouterLink
                    v-for="item in navigation"
                    :key="item.route"
                    :to="{ name: item.route }"
                    class="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                    active-class="bg-canvas font-medium text-ink"
                    :title="item.label"
                >
                    <span
                        v-if="$route.name === item.route"
                        class="absolute top-1.5 bottom-1.5 -left-2 w-[3px] rounded-full bg-profit"
                    />
                    <i :class="item.icon" class="text-base" />
                    <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
                </RouterLink>
            </nav>

            <div class="border-t border-line p-2">
                <button
                    type="button"
                    class="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                    @click="isCollapsed = !isCollapsed"
                >
                    <i :class="isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
                    <span v-if="!isCollapsed">Colapsar</span>
                </button>
            </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
            <header
                class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface px-6"
            >
                <div class="text-sm text-ink-muted">
                    {{ $route.meta.title ?? '' }}
                </div>

                <div class="flex items-center gap-3">
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

            <main class="mx-auto w-full max-w-7xl flex-1 p-6">
                <slot />
            </main>
        </div>
    </div>
</template>
