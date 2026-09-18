<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'

import { shiftsApi } from '@/api'
import type { DailyShift, ShiftsSummary } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate, formatNumber, profitVariant, toNumber } from '@/lib/format'

const shifts = ref<DailyShift[]>([])
const summary = ref<ShiftsSummary | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const response = await shiftsApi.list()
        shifts.value = response.shifts.data
        summary.value = response.summary
    } catch {
        error.value = 'No se pudieron cargar los turnos.'
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

    if (variant === 'profit') {
        return 'success'
    }

    return variant === 'loss' ? 'danger' : 'warn'
}

function shiftLabel(shift: DailyShift): string {
    const variant = profitVariant(shift.real_net_profit)

    if (variant === 'profit') {
        return 'Rentable'
    }

    return variant === 'loss' ? 'Pérdida' : 'Neutral'
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Turnos</h1>
            <p class="mt-1 text-sm text-ink-muted">
                {{ summary?.total_shifts ?? 0 }} turnos · {{ formatCurrency(summary?.total_net_profit) }} acumulados ·
                {{ formatNumber(summary?.total_km_gps) }} km
            </p>
        </header>

        <div v-if="error" class="rounded-card border-line bg-surface p-4 text-sm text-loss">{{ error }}</div>

        <SectionCard title="Historial de turnos" :description="`Ingresos brutos: ${formatCurrency(totalEarnings)}`">
            <div v-if="isLoading" class="grid place-items-center py-20">
                <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
            </div>

            <DataTable v-else :value="shifts" data-key="id" size="small" scrollable responsive-layout="scroll">
                <Column field="shift_date" header="Fecha" style="min-width: 130px">
                    <template #body="{ data: row }">{{ formatDate(row.shift_date) }}</template>
                </Column>
                <Column header="Plataformas" style="min-width: 160px">
                    <template #body="{ data: row }">
                        <span class="text-ink-muted">
                            {{
                                (row.earnings ?? [])
                                    .map((e: { provider_name: string }) => e.provider_name)
                                    .join(', ') || '—'
                            }}
                        </span>
                    </template>
                </Column>
                <Column field="total_km_gps" header="Km" style="min-width: 90px">
                    <template #body="{ data: row }">
                        <span class="tabular">{{ formatNumber(row.total_km_gps) }}</span>
                    </template>
                </Column>
                <Column field="total_minutes_connected" header="Minutos" style="min-width: 100px">
                    <template #body="{ data: row }">
                        <span class="tabular">{{ row.total_minutes_connected }}</span>
                    </template>
                </Column>
                <Column field="applied_fuel_cost" header="Combustible" style="min-width: 120px">
                    <template #body="{ data: row }">
                        <span class="tabular">{{ formatCurrency(row.applied_fuel_cost) }}</span>
                    </template>
                </Column>
                <Column field="real_net_profit" header="Neto" style="min-width: 120px">
                    <template #body="{ data: row }">
                        <span class="tabular font-medium">{{ formatCurrency(row.real_net_profit) }}</span>
                    </template>
                </Column>
                <Column header="Estado" style="min-width: 110px">
                    <template #body="{ data: row }">
                        <Tag :severity="severity(row)" :value="shiftLabel(row)" class="text-xs" />
                    </template>
                </Column>
                <template #empty>
                    <p class="py-10 text-center text-sm text-ink-muted">Sin turnos registrados todavía.</p>
                </template>
            </DataTable>
        </SectionCard>
    </div>
</template>
