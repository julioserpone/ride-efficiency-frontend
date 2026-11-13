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

const selectedOffer = ref<RideOffer | null>(null)
const isDetailLoading = ref(false)
const detailError = ref<string | null>(null)

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

async function openDetail(id: number): Promise<void> {
    isDetailLoading.value = true
    detailError.value = null
    selectedOffer.value = null

    try {
        selectedOffer.value = await offersApi.show(id)
    } catch (detailLoadError) {
        detailError.value =
            detailLoadError instanceof Error ? detailLoadError.message : 'No se pudo cargar el detalle de la oferta.'
    } finally {
        isDetailLoading.value = false
    }
}

function closeDetail(): void {
    selectedOffer.value = null
    detailError.value = null
}

const hasVerdictDrift = (offer: RideOffer): boolean =>
    (offer.client_verdict !== null || offer.server_verdict !== null) && offer.client_verdict !== offer.server_verdict

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
                <Column header="Acciones">
                    <template #body="{ data }">
                        <button
                            type="button"
                            class="text-xs font-medium text-brand hover:underline"
                            @click="openDetail(data.id)"
                        >
                            Ver detalle
                        </button>
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

        <div
            v-if="selectedOffer || isDetailLoading || detailError"
            class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/40 p-4"
            role="presentation"
            @click.self="closeDetail"
        >
            <section
                class="my-6 w-full max-w-3xl rounded-xl border border-line bg-surface p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="offer-detail-title"
            >
                <div class="flex items-start justify-between gap-4">
                    <h2 id="offer-detail-title" class="text-base font-semibold text-ink">Detalle de oferta</h2>
                    <button type="button" class="text-sm text-ink-muted hover:text-ink" @click="closeDetail">
                        Cerrar
                    </button>
                </div>

                <div v-if="isDetailLoading" class="grid place-items-center py-12">
                    <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
                </div>

                <p v-else-if="detailError" class="mt-4 text-sm text-loss" role="alert">{{ detailError }}</p>

                <template v-else-if="selectedOffer">
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <p class="text-xs text-ink-muted">Plataforma</p>
                            <p class="font-medium capitalize">{{ selectedOffer.platform }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Estado</p>
                            <p class="font-medium">{{ statusLabel[selectedOffer.status] ?? selectedOffer.status }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Tarifa ofrecida</p>
                            <p class="font-medium">
                                {{ formatCurrency(selectedOffer.offered_fare, selectedOffer.currency_code) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Recargo (surge)</p>
                            <p class="font-medium">
                                {{ formatCurrency(selectedOffer.surge_amount, selectedOffer.currency_code) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Propina</p>
                            <p class="font-medium">
                                {{ formatCurrency(selectedOffer.tip_amount, selectedOffer.currency_code) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Peaje</p>
                            <p class="font-medium">
                                {{ formatCurrency(selectedOffer.toll_amount, selectedOffer.currency_code) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Distancia estimada</p>
                            <p class="font-medium">{{ selectedOffer.estimated_distance_km }} km</p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Duración estimada</p>
                            <p class="font-medium">
                                {{
                                    selectedOffer.estimated_duration_minutes !== null
                                        ? `${selectedOffer.estimated_duration_minutes} min`
                                        : '—'
                                }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Distancia al recogida</p>
                            <p class="font-medium">
                                {{
                                    selectedOffer.pickup_distance_km !== null
                                        ? `${selectedOffer.pickup_distance_km} km`
                                        : '—'
                                }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-ink-muted">Recibida</p>
                            <p class="font-medium">{{ formatDate(selectedOffer.received_at) }}</p>
                        </div>
                        <div v-if="selectedOffer.decided_at">
                            <p class="text-xs text-ink-muted">Decidida</p>
                            <p class="font-medium">{{ formatDate(selectedOffer.decided_at) }}</p>
                        </div>
                        <div v-if="selectedOffer.completed_at">
                            <p class="text-xs text-ink-muted">Completada</p>
                            <p class="font-medium">{{ formatDate(selectedOffer.completed_at) }}</p>
                        </div>
                        <div v-if="selectedOffer.cancelled_at">
                            <p class="text-xs text-ink-muted">Cancelada</p>
                            <p class="font-medium">{{ formatDate(selectedOffer.cancelled_at) }}</p>
                        </div>
                    </div>

                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div v-if="selectedOffer.service_type">
                            <p class="text-xs text-ink-muted">Tipo de viaje</p>
                            <p class="font-medium">{{ selectedOffer.service_type }}</p>
                        </div>
                        <div v-if="selectedOffer.trip_availability">
                            <p class="text-xs text-ink-muted">Disponibilidad</p>
                            <p class="font-medium">{{ selectedOffer.trip_availability }}</p>
                        </div>
                        <div v-if="selectedOffer.rider_identifier">
                            <p class="text-xs text-ink-muted">Identificación del usuario</p>
                            <p class="font-medium">{{ selectedOffer.rider_identifier }}</p>
                        </div>
                        <div v-if="selectedOffer.rider_rating !== null && selectedOffer.rider_rating !== undefined">
                            <p class="text-xs text-ink-muted">Calificación del usuario</p>
                            <p class="font-medium">{{ selectedOffer.rider_rating.toFixed(1) }} / 5.0</p>
                        </div>
                        <div
                            v-if="
                                selectedOffer.rider_trip_count !== null && selectedOffer.rider_trip_count !== undefined
                            "
                        >
                            <p class="text-xs text-ink-muted">Viajes del usuario</p>
                            <p class="font-medium">{{ selectedOffer.rider_trip_count }}</p>
                        </div>
                        <div
                            v-if="
                                selectedOffer.pickup_duration_minutes !== null &&
                                selectedOffer.pickup_duration_minutes !== undefined
                            "
                        >
                            <p class="text-xs text-ink-muted">Tiempo al punto de partida</p>
                            <p class="font-medium">{{ selectedOffer.pickup_duration_minutes }} min</p>
                        </div>
                        <div v-if="selectedOffer.pickup_address">
                            <p class="text-xs text-ink-muted">Punto de partida</p>
                            <p class="font-medium">{{ selectedOffer.pickup_address }}</p>
                        </div>
                        <div
                            v-if="
                                selectedOffer.destination_duration_minutes !== null &&
                                selectedOffer.destination_duration_minutes !== undefined
                            "
                        >
                            <p class="text-xs text-ink-muted">Tiempo al destino</p>
                            <p class="font-medium">{{ selectedOffer.destination_duration_minutes }} min</p>
                        </div>
                        <div v-if="selectedOffer.destination_address">
                            <p class="text-xs text-ink-muted">Destino</p>
                            <p class="font-medium">{{ selectedOffer.destination_address }}</p>
                        </div>
                        <div v-if="selectedOffer.payment_method">
                            <p class="text-xs text-ink-muted">Forma de pago</p>
                            <p class="font-medium">{{ selectedOffer.payment_method }}</p>
                        </div>
                    </div>

                    <div class="mt-6 grid gap-4 sm:grid-cols-2">
                        <div class="rounded-card border border-line p-4">
                            <p class="text-sm font-semibold text-ink">Veredicto cliente</p>
                            <p class="mt-1">
                                <Tag
                                    :value="selectedOffer.client_verdict ?? '—'"
                                    :severity="verdictSeverity(selectedOffer.client_verdict)"
                                />
                            </p>
                            <p class="mt-2 text-xs text-ink-muted">
                                Ganancia neta estimada:
                                {{
                                    selectedOffer.client_net_profit_estimate !== null
                                        ? formatCurrency(
                                              selectedOffer.client_net_profit_estimate,
                                              selectedOffer.currency_code,
                                          )
                                        : '—'
                                }}
                            </p>
                            <p class="text-xs text-ink-muted">
                                Tarifa de equilibrio:
                                {{
                                    selectedOffer.client_break_even_fare !== null
                                        ? formatCurrency(
                                              selectedOffer.client_break_even_fare,
                                              selectedOffer.currency_code,
                                          )
                                        : '—'
                                }}
                            </p>
                        </div>
                        <div class="rounded-card border border-line p-4">
                            <p class="text-sm font-semibold text-ink">Veredicto servidor</p>
                            <p class="mt-1">
                                <Tag
                                    :value="selectedOffer.server_verdict ?? '—'"
                                    :severity="verdictSeverity(selectedOffer.server_verdict)"
                                />
                            </p>
                            <p class="mt-2 text-xs text-ink-muted">
                                Ganancia neta estimada:
                                {{
                                    selectedOffer.server_net_profit_estimate !== null
                                        ? formatCurrency(
                                              selectedOffer.server_net_profit_estimate,
                                              selectedOffer.currency_code,
                                          )
                                        : '—'
                                }}
                            </p>
                            <p class="text-xs text-ink-muted">
                                Tarifa de equilibrio:
                                {{
                                    selectedOffer.server_break_even_fare !== null
                                        ? formatCurrency(
                                              selectedOffer.server_break_even_fare,
                                              selectedOffer.currency_code,
                                          )
                                        : '—'
                                }}
                            </p>
                        </div>
                    </div>

                    <div
                        v-if="hasVerdictDrift(selectedOffer)"
                        class="mt-4 rounded-card border border-neutral bg-neutral/10 p-4 text-sm"
                    >
                        <p class="font-medium">Deriva detectada</p>
                        <p class="text-xs text-ink-muted">
                            El veredicto o la ganancia estimada difieren entre el cliente y el servidor.
                        </p>
                    </div>

                    <p v-if="selectedOffer.cancellation_reason" class="mt-4 text-sm text-ink-muted">
                        Motivo de cancelación: {{ selectedOffer.cancellation_reason }}
                    </p>
                    <p v-if="selectedOffer.calculation_version" class="mt-2 text-xs text-ink-muted">
                        Versión de cálculo: {{ selectedOffer.calculation_version }}
                    </p>
                </template>
            </section>
        </div>
    </div>
</template>
