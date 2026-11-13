<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { computed, onMounted, ref, watch } from 'vue'

import { offersApi } from '@/api'
import type { OfferFunnel, RideOffer } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate } from '@/lib/format'

const offers = ref<RideOffer[]>([])
const funnel = ref<OfferFunnel | null>(null)
const page = ref(1)
const lastPage = ref(1)
const isLoading = ref(false)
const error = ref<string | null>(null)

const platformFilter = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const sortBy = ref('received_at')
const sortDir = ref<'asc' | 'desc'>('desc')

const statusOptions = ['', 'offered', 'evaluated', 'accepted', 'rejected', 'expired', 'completed', 'cancelled']

const statusLabel: Record<string, string> = {
    offered: 'Ofrecida',
    evaluated: 'Evaluada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Expirada',
    completed: 'Completada',
    cancelled: 'Cancelada',
}
const sortOptions = [
    { value: 'received_at', label: 'Fecha recibida' },
    { value: 'offered_fare', label: 'Tarifa ofrecida' },
    { value: 'status', label: 'Estado' },
    { value: 'platform', label: 'Plataforma' },
]

const hasActiveFilters = computed(() =>
    Boolean(platformFilter.value || statusFilter.value || dateFrom.value || dateTo.value),
)

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const [listResponse, summary] = await Promise.all([
            offersApi.list({
                platform: platformFilter.value || undefined,
                status: statusFilter.value || undefined,
                date_from: dateFrom.value || undefined,
                date_to: dateTo.value || undefined,
                sort: `${sortDir.value === 'desc' ? '-' : ''}${sortBy.value}`,
                page: page.value,
            }),
            offersApi.dailySummary(),
        ])
        offers.value = listResponse.offers.data
        page.value = listResponse.offers.current_page
        lastPage.value = listResponse.offers.last_page
        funnel.value = summary
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar las ofertas.'
    } finally {
        isLoading.value = false
    }
}

function resetAndLoad(): void {
    page.value = 1
    load()
}

function previousPage(): void {
    if (page.value <= 1) {
        return
    }
    page.value -= 1
    load()
}

function nextPage(): void {
    if (page.value >= lastPage.value) {
        return
    }
    page.value += 1
    load()
}

function clearFilters(): void {
    platformFilter.value = ''
    statusFilter.value = ''
    dateFrom.value = ''
    dateTo.value = ''
    sortBy.value = 'received_at'
    sortDir.value = 'desc'
    resetAndLoad()
}

function verdictSeverity(verdict: string | null): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (verdict) {
        case 'accept':
            return 'success'
        case 'marginal':
            return 'warn'
        case 'reject':
            return 'danger'
        default:
            return 'secondary'
    }
}

watch([platformFilter, statusFilter, dateFrom, dateTo, sortBy, sortDir], () => {
    resetAndLoad()
})

onMounted(load)
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Ofertas</h1>
            <p class="mt-1 text-sm text-ink-muted">Historial, filtros y embudo de ofertas capturadas.</p>
        </header>

        <div v-if="error" class="rounded-card border-line bg-surface p-4 text-sm text-loss" role="alert">
            {{ error }}
        </div>

        <SectionCard title="Filtros" description="Filtra por plataforma, estado y fecha, y ordena los resultados.">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Plataforma
                    <select v-model="platformFilter" class="field-control">
                        <option value="">Todas</option>
                        <option value="uber">Uber</option>
                        <option value="didi">DiDi</option>
                        <option value="indrive">InDrive</option>
                    </select>
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Estado
                    <select v-model="statusFilter" class="field-control">
                        <option value="">Todos</option>
                        <option v-for="status in statusOptions.filter(Boolean)" :key="status" :value="status">
                            {{ statusLabel[status] ?? status }}
                        </option>
                    </select>
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Desde
                    <input v-model="dateFrom" type="date" class="field-control" />
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Hasta
                    <input v-model="dateTo" type="date" class="field-control" />
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Ordenar por
                    <select v-model="sortBy" class="field-control">
                        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Dirección
                    <select v-model="sortDir" class="field-control">
                        <option value="desc">Descendente</option>
                        <option value="asc">Ascendente</option>
                    </select>
                </label>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <p v-if="hasActiveFilters" class="text-xs text-ink-muted">Filtros activos aplicados.</p>
                <p v-else class="text-xs text-ink-muted">Sin filtros activos.</p>
                <button
                    type="button"
                    class="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
                    :disabled="!hasActiveFilters"
                    @click="clearFilters"
                >
                    Limpiar
                </button>
            </div>
        </SectionCard>

        <SectionCard v-if="funnel" title="Embudo diario">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                    <span class="text-xs text-ink-muted">Recibidas</span>
                    <div class="text-lg font-semibold">{{ funnel.offered }}</div>
                </div>
                <div>
                    <span class="text-xs text-ink-muted">Aceptadas</span>
                    <div class="text-lg font-semibold">{{ funnel.accepted }}</div>
                </div>
                <div>
                    <span class="text-xs text-ink-muted">Completadas</span>
                    <div class="text-lg font-semibold">{{ funnel.completed }}</div>
                </div>
                <div>
                    <span class="text-xs text-ink-muted">Rechazadas</span>
                    <div class="text-lg font-semibold">{{ funnel.rejected }}</div>
                </div>
            </div>
        </SectionCard>

        <div v-if="isLoading" class="grid place-items-center py-24">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        </div>

        <SectionCard v-else title="Ofertas recientes">
            <DataTable :value="offers" stripedRows size="small" data-key="id">
                <template #empty>
                    <p class="py-10 text-center text-sm text-ink-muted">
                        No hay ofertas para los filtros seleccionados.
                    </p>
                </template>
                <Column field="platform" header="Plataforma" />
                <Column header="Tarifa">
                    <template #body="{ data }">
                        {{ formatCurrency(data.offered_fare) }}
                    </template>
                </Column>
                <Column header="Distancia">
                    <template #body="{ data }"> {{ data.estimated_distance_km }} km </template>
                </Column>
                <Column header="Veredicto">
                    <template #body="{ data }">
                        <Tag :value="data.client_verdict ?? '—'" :severity="verdictSeverity(data.client_verdict)" />
                    </template>
                </Column>
                <Column header="Recibida">
                    <template #body="{ data }">
                        {{ formatDate(data.received_at) }}
                    </template>
                </Column>
            </DataTable>

            <div v-if="lastPage > 1" class="mt-4 flex items-center justify-between text-sm text-ink-muted">
                <span>Página {{ page }} de {{ lastPage }}</span>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
                        :disabled="page <= 1"
                        @click="previousPage"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
                        :disabled="page >= lastPage"
                        @click="nextPage"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </SectionCard>
    </div>
</template>
