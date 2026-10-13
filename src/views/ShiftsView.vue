<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'

import { shiftsApi } from '@/api'
import type { DailyShift, ShiftInput, ShiftsSummary } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate, formatNumber, profitVariant, toNumber } from '@/lib/format'

const shifts = ref<DailyShift[]>([])
const summary = ref<ShiftsSummary | null>(null)
const page = ref(1)
const lastPage = ref(1)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const createDialogOpen = ref(false)
const closeShift = ref<DailyShift | null>(null)
const selectedShift = ref<DailyShift | null>(null)
const shiftDate = ref(localDate())
const shiftEarnings = ref<Array<{ rowId: number; provider_name: string; gross_amount: string }>>([])
const closeEarnings = ref<Array<{ rowId: number; provider_name: string; gross_amount: string }>>([])
let nextEarningRowId = 0
const shiftForm = ref({
    total_km_gps: '',
    total_minutes_connected: '',
    total_trips_completed: '',
    total_offers_scanned: '',
})
const closeForm = ref({
    total_km_gps: '',
    total_minutes_connected: '',
    total_trips_completed: '',
    total_offers_scanned: '',
})

function localDate(): string {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const response = await shiftsApi.list(page.value)
        shifts.value = response.shifts.data
        summary.value = response.summary
        page.value = response.shifts.current_page
        lastPage.value = response.shifts.last_page
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar los turnos.'
    } finally {
        isLoading.value = false
    }
}

onMounted(load)

const totalEarnings = computed(() =>
    shifts.value.reduce(
        (total, shift) =>
            total + (shift.earnings ?? []).reduce((sum, earning) => sum + toNumber(earning.gross_amount), 0),
        0,
    ),
)

function severity(shift: DailyShift): 'success' | 'warn' | 'danger' {
    const variant = profitVariant(shift.real_net_profit)

    if (variant === 'profit') return 'success'
    return variant === 'loss' ? 'danger' : 'warn'
}

function shiftLabel(shift: DailyShift): string {
    const variant = profitVariant(shift.real_net_profit)

    if (variant === 'profit') return 'Rentable'
    return variant === 'loss' ? 'Pérdida' : 'Neutral'
}

function openCreateShift(): void {
    formError.value = null
    shiftDate.value = localDate()
    shiftEarnings.value = []
    shiftForm.value = {
        total_km_gps: '',
        total_minutes_connected: '',
        total_trips_completed: '',
        total_offers_scanned: '',
    }
    createDialogOpen.value = true
}

function addEarningRow(): void {
    shiftEarnings.value.push({ rowId: nextEarningRowId++, provider_name: '', gross_amount: '' })
}

function removeEarningRow(rowId: number): void {
    shiftEarnings.value = shiftEarnings.value.filter((earning) => earning.rowId !== rowId)
}

function addCloseEarningRow(): void {
    closeEarnings.value.push({ rowId: nextEarningRowId++, provider_name: '', gross_amount: '' })
}

function removeCloseEarningRow(rowId: number): void {
    closeEarnings.value = closeEarnings.value.filter((earning) => earning.rowId !== rowId)
}

function closeShiftDialog(): void {
    createDialogOpen.value = false
    closeShift.value = null
}

function previousPage(): void {
    page.value -= 1
    load()
}

function nextPage(): void {
    page.value += 1
    load()
}

async function createShift(): Promise<void> {
    formError.value = null
    isSaving.value = true

    try {
        const payload: ShiftInput = {
            shift_date: shiftDate.value,
            total_km_gps: Number(shiftForm.value.total_km_gps || 0),
            total_minutes_connected: Number(shiftForm.value.total_minutes_connected || 0),
            total_trips_completed: Number(shiftForm.value.total_trips_completed || 0),
            total_offers_scanned: Number(shiftForm.value.total_offers_scanned || 0),
        }

        if (shiftEarnings.value.length > 0) {
            payload.earnings = shiftEarnings.value.map(({ provider_name, gross_amount }) => ({
                provider_name,
                gross_amount: Number(gross_amount),
            }))
        }

        await shiftsApi.create(payload)
        createDialogOpen.value = false
        page.value = 1
        await load()
    } catch (saveError) {
        formError.value = saveError instanceof Error ? saveError.message : 'No se pudo registrar el turno.'
    } finally {
        isSaving.value = false
    }
}

function openCloseShift(shift: DailyShift): void {
    closeShift.value = shift
    closeEarnings.value = []
    closeForm.value = {
        total_km_gps: shift.total_km_gps,
        total_minutes_connected: String(shift.total_minutes_connected),
        total_trips_completed: String(shift.total_trips_completed),
        total_offers_scanned: String(shift.total_offers_scanned),
    }
    formError.value = null
}

async function finalizeShift(): Promise<void> {
    if (!closeShift.value) return

    formError.value = null
    isSaving.value = true

    const payload: ShiftInput = {
        total_km_gps: Number(closeForm.value.total_km_gps),
        total_minutes_connected: Number(closeForm.value.total_minutes_connected),
        total_trips_completed: Number(closeForm.value.total_trips_completed),
        total_offers_scanned: Number(closeForm.value.total_offers_scanned),
    }

    if (closeEarnings.value.length > 0) {
        payload.earnings = closeEarnings.value.map(({ provider_name, gross_amount }) => ({
            provider_name,
            gross_amount: Number(gross_amount),
        }))
    }

    try {
        await shiftsApi.close(closeShift.value.id, payload)
        closeShift.value = null
        await load()
    } catch (saveError) {
        formError.value = saveError instanceof Error ? saveError.message : 'No se pudo finalizar el turno.'
    } finally {
        isSaving.value = false
    }
}

async function showShift(shift: DailyShift): Promise<void> {
    error.value = null

    try {
        selectedShift.value = await shiftsApi.show(shift.id)
    } catch (detailError) {
        error.value = detailError instanceof Error ? detailError.message : 'No se pudo cargar el turno.'
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 class="text-xl font-semibold text-ink">Turnos</h1>
                <p class="mt-1 text-sm text-ink-muted">
                    {{ summary?.total_shifts ?? 0 }} turnos · {{ formatCurrency(summary?.total_net_profit) }} acumulados
                    · {{ formatNumber(summary?.total_km_gps) }} km
                </p>
            </div>
            <button
                type="button"
                class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
                @click="openCreateShift"
            >
                Registrar turno
            </button>
        </header>

        <div v-if="error" class="rounded-card border border-line bg-surface p-4 text-sm text-loss" role="alert">
            {{ error }}
        </div>

        <SectionCard
            title="Historial de turnos"
            :description="`Ingresos brutos registrados: ${formatCurrency(totalEarnings)}`"
        >
            <div v-if="isLoading" class="grid place-items-center py-20">
                <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
            </div>

            <template v-else>
                <DataTable :value="shifts" data-key="id" size="small" scrollable responsive-layout="scroll">
                    <Column field="shift_date" header="Fecha" style="min-width: 130px">
                        <template #body="{ data: row }">{{ formatDate(row.shift_date) }}</template>
                    </Column>
                    <Column header="Plataformas" style="min-width: 160px">
                        <template #body="{ data: row }">
                            <span class="text-ink-muted">
                                {{
                                    (row.earnings ?? [])
                                        .map((earning: { provider_name: string }) => earning.provider_name)
                                        .join(', ') || '—'
                                }}
                            </span>
                        </template>
                    </Column>
                    <Column field="total_km_gps" header="Km" style="min-width: 90px">
                        <template #body="{ data: row }"
                            ><span class="tabular">{{ formatNumber(row.total_km_gps) }}</span></template
                        >
                    </Column>
                    <Column field="total_minutes_connected" header="Minutos" style="min-width: 100px">
                        <template #body="{ data: row }"
                            ><span class="tabular">{{ row.total_minutes_connected }}</span></template
                        >
                    </Column>
                    <Column field="applied_fuel_cost" header="Combustible" style="min-width: 120px">
                        <template #body="{ data: row }"
                            ><span class="tabular">{{ formatCurrency(row.applied_fuel_cost) }}</span></template
                        >
                    </Column>
                    <Column field="real_net_profit" header="Neto" style="min-width: 120px">
                        <template #body="{ data: row }"
                            ><span class="tabular font-medium">{{
                                formatCurrency(row.real_net_profit)
                            }}</span></template
                        >
                    </Column>
                    <Column header="Estado" style="min-width: 110px">
                        <template #body="{ data: row }">
                            <Tag :severity="severity(row)" :value="shiftLabel(row)" class="text-xs" />
                        </template>
                    </Column>
                    <Column header="Acciones" style="min-width: 160px">
                        <template #body="{ data: row }">
                            <div class="flex gap-3">
                                <button
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="showShift(row)"
                                >
                                    Detalle
                                </button>
                                <button
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="openCloseShift(row)"
                                >
                                    Completar
                                </button>
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <p class="py-10 text-center text-sm text-ink-muted">Sin turnos registrados todavía.</p>
                    </template>
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
            </template>
        </SectionCard>

        <div
            v-if="createDialogOpen || closeShift"
            class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/40 p-4"
            role="presentation"
            @click.self="closeShiftDialog"
        >
            <section
                class="my-6 w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="closeShift ? 'close-shift-title' : 'create-shift-title'"
            >
                <template v-if="closeShift">
                    <h2 id="close-shift-title" class="text-base font-semibold text-ink">
                        Completar turno · {{ formatDate(closeShift.shift_date) }}
                    </h2>
                    <p class="mt-1 text-sm text-ink-muted">
                        Registra los valores finales. Solo agrega ingresos que aún no estén registrados.
                    </p>
                    <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="finalizeShift">
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Kilómetros GPS
                            <input
                                v-model="closeForm.total_km_gps"
                                type="number"
                                min="0"
                                step="any"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Minutos conectado
                            <input
                                v-model="closeForm.total_minutes_connected"
                                type="number"
                                min="0"
                                step="1"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Viajes completados
                            <input
                                v-model="closeForm.total_trips_completed"
                                type="number"
                                min="0"
                                step="1"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Ofertas revisadas
                            <input
                                v-model="closeForm.total_offers_scanned"
                                type="number"
                                min="0"
                                step="1"
                                required
                                class="field-control"
                            />
                        </label>
                        <div v-if="!closeShift.earnings?.length" class="sm:col-span-2">
                            <div class="mb-3 flex items-center justify-between gap-3">
                                <h3 class="text-xs font-semibold text-ink">Ingresos faltantes</h3>
                                <button
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="addCloseEarningRow"
                                >
                                    Añadir plataforma
                                </button>
                            </div>
                            <div
                                v-for="earning in closeEarnings"
                                :key="earning.rowId"
                                class="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                            >
                                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                    Plataforma
                                    <input
                                        v-model="earning.provider_name"
                                        type="text"
                                        maxlength="100"
                                        required
                                        class="field-control"
                                        placeholder="Uber, DiDi…"
                                    />
                                </label>
                                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                    Ingreso bruto
                                    <input
                                        v-model="earning.gross_amount"
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        class="field-control"
                                    />
                                </label>
                                <button
                                    type="button"
                                    class="self-end rounded-lg border border-line px-3 py-2 text-sm text-loss"
                                    :aria-label="`Quitar ${earning.provider_name || 'plataforma'}`"
                                    @click="removeCloseEarningRow(earning.rowId)"
                                >
                                    Quitar
                                </button>
                            </div>
                            <p v-if="closeEarnings.length === 0" class="text-xs text-ink-muted">
                                Puedes añadir los ingresos de este turno.
                            </p>
                        </div>
                        <p v-else class="text-xs text-ink-muted sm:col-span-2">
                            Los {{ closeShift.earnings.length }} ingresos ya guardados se conservarán sin duplicarse.
                        </p>
                        <p v-if="formError" class="text-sm text-loss sm:col-span-2" role="alert">{{ formError }}</p>
                        <div class="flex justify-end gap-2 sm:col-span-2">
                            <button
                                type="button"
                                class="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted"
                                @click="closeShift = null"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                                :disabled="isSaving"
                            >
                                {{ isSaving ? 'Calculando…' : 'Finalizar y calcular' }}
                            </button>
                        </div>
                    </form>
                </template>
                <template v-else>
                    <h2 id="create-shift-title" class="text-base font-semibold text-ink">Registrar turno</h2>
                    <p class="mt-1 text-sm text-ink-muted">
                        Añade los datos del turno y los ingresos por plataforma; la API calculará la rentabilidad.
                    </p>
                    <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="createShift">
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Fecha del turno
                            <input v-model="shiftDate" type="date" required class="field-control" />
                        </label>
                        <span />
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Kilómetros GPS
                            <input
                                v-model="shiftForm.total_km_gps"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Minutos conectado
                            <input
                                v-model="shiftForm.total_minutes_connected"
                                type="number"
                                min="0"
                                step="1"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Viajes completados
                            <input
                                v-model="shiftForm.total_trips_completed"
                                type="number"
                                min="0"
                                step="1"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Ofertas revisadas
                            <input
                                v-model="shiftForm.total_offers_scanned"
                                type="number"
                                min="0"
                                step="1"
                                class="field-control"
                            />
                        </label>
                        <div class="sm:col-span-2">
                            <div class="mb-3 flex items-center justify-between gap-3">
                                <h3 class="text-xs font-semibold text-ink">Ingresos por plataforma</h3>
                                <button
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="addEarningRow"
                                >
                                    Añadir plataforma
                                </button>
                            </div>
                            <div
                                v-for="earning in shiftEarnings"
                                :key="earning.rowId"
                                class="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                            >
                                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                    Plataforma
                                    <input
                                        v-model="earning.provider_name"
                                        type="text"
                                        maxlength="100"
                                        required
                                        class="field-control"
                                        placeholder="Uber, DiDi…"
                                    />
                                </label>
                                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                    Ingreso bruto
                                    <input
                                        v-model="earning.gross_amount"
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        class="field-control"
                                    />
                                </label>
                                <button
                                    type="button"
                                    class="self-end rounded-lg border border-line px-3 py-2 text-sm text-loss"
                                    :aria-label="`Quitar ${earning.provider_name || 'plataforma'}`"
                                    @click="removeEarningRow(earning.rowId)"
                                >
                                    Quitar
                                </button>
                            </div>
                            <p v-if="shiftEarnings.length === 0" class="text-xs text-ink-muted">
                                Puedes registrar los ingresos ahora o dejarlos vacíos.
                            </p>
                        </div>
                        <p v-if="formError" class="text-sm text-loss sm:col-span-2" role="alert">{{ formError }}</p>
                        <div class="flex justify-end gap-2 sm:col-span-2">
                            <button
                                type="button"
                                class="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted"
                                @click="createDialogOpen = false"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                                :disabled="isSaving"
                            >
                                {{ isSaving ? 'Guardando…' : 'Registrar turno' }}
                            </button>
                        </div>
                    </form>
                </template>
            </section>
        </div>

        <div
            v-if="selectedShift"
            class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/40 p-4"
            role="presentation"
            @click.self="selectedShift = null"
        >
            <section
                class="my-6 w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="shift-detail-title"
            >
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 id="shift-detail-title" class="text-base font-semibold text-ink">Detalle del turno</h2>
                        <p class="mt-1 text-sm text-ink-muted">{{ formatDate(selectedShift.shift_date) }}</p>
                    </div>
                    <button
                        type="button"
                        class="text-sm text-ink-muted"
                        aria-label="Cerrar detalle"
                        @click="selectedShift = null"
                    >
                        Cerrar
                    </button>
                </div>
                <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt class="text-xs text-ink-muted">Ganancia neta</dt>
                        <dd class="tabular mt-1 font-medium">{{ formatCurrency(selectedShift.real_net_profit) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Ingresos brutos</dt>
                        <dd class="tabular mt-1">
                            {{
                                formatCurrency(
                                    selectedShift.earnings?.reduce(
                                        (sum, earning) => sum + toNumber(earning.gross_amount),
                                        0,
                                    ),
                                )
                            }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Combustible</dt>
                        <dd class="tabular mt-1">{{ formatCurrency(selectedShift.applied_fuel_cost) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Depreciación</dt>
                        <dd class="tabular mt-1">{{ formatCurrency(selectedShift.estimated_depreciation) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Kilómetros</dt>
                        <dd class="tabular mt-1">{{ formatNumber(selectedShift.total_km_gps) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Viajes</dt>
                        <dd class="tabular mt-1">{{ selectedShift.total_trips_completed }}</dd>
                    </div>
                </dl>
                <div class="mt-5 border-t border-line pt-4">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Ingresos por plataforma
                    </h3>
                    <ul class="mt-2 space-y-2 text-sm">
                        <li
                            v-for="earning in selectedShift.earnings ?? []"
                            :key="earning.id"
                            class="flex justify-between gap-3"
                        >
                            <span>{{ earning.provider_name }}</span
                            ><span class="tabular">{{ formatCurrency(earning.gross_amount) }}</span>
                        </li>
                        <li v-if="!selectedShift.earnings?.length" class="text-ink-muted">Sin ingresos desglosados.</li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>
