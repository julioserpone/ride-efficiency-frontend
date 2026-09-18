<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import { computed, onMounted } from 'vue'

import KmEfficiencyChart from '@/components/KmEfficiencyChart.vue'
import ProfitTrendChart from '@/components/ProfitTrendChart.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import { useDashboardData } from '@/composables/useDashboardData'
import { formatCurrency, formatDate, formatNumber, profitVariant, toNumber } from '@/lib/format'
import type { DailyShift } from '@/api/types'

const { data, isLoading, error, load } = useDashboardData()

onMounted(load)

const weeklyLabels = computed(() => data.value.weekly.map((entry) => entry.week_start))
const weeklyProfit = computed(() => data.value.weekly.map((entry) => toNumber(entry.total_net_profit)))
const weeklyFuel = computed(() => data.value.weekly.map((entry) => toNumber(entry.total_fuel_cost)))
const monthlyLabels = computed(() => data.value.monthly.map((entry) => entry.month_start))
const monthlyKm = computed(() => data.value.monthly.map((entry) => toNumber(entry.total_km)))

const recentShifts = computed(() => data.value.recentShifts.slice(0, 8))

function rowClass(shift: DailyShift): string {
    return profitVariant(shift.real_net_profit) === 'loss' ? 'text-loss' : ''
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 class="text-xl font-semibold text-ink">Resumen</h1>
                <p class="mt-1 text-sm text-ink-muted">
                    Rentabilidad acumulada de tus turnos, kilómetros y gasto de combustible.
                </p>
            </div>
            <div class="text-sm text-ink-muted">
                Mes actual:
                <span class="tabular font-medium text-ink">
                    {{ formatCurrency(data.currentMonthProfit) }}
                </span>
            </div>
        </header>

        <div v-if="error" class="rounded-card border-line bg-surface p-4 text-sm text-loss">
            {{ error }}
        </div>

        <div v-if="isLoading" class="grid place-items-center py-24">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        </div>

        <template v-else>
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Ganancia neta total"
                    :value="formatCurrency(data.totals?.total_net_profit)"
                    :hint="`${data.totals?.total_shifts ?? 0} turnos registrados`"
                    icon="pi pi-dollar"
                />
                <StatCard
                    label="Kilómetros totales"
                    :value="`${formatNumber(data.totals?.total_km)} km`"
                    :hint="`${formatNumber(data.efficiency?.avg_km_per_shift)} km por turno`"
                    icon="pi pi-car"
                />
                <StatCard
                    label="Costo combustible"
                    :value="formatCurrency(data.totals?.total_fuel_cost)"
                    :hint="`${formatCurrency(data.efficiency?.fuel_cost_per_km)} por km`"
                    icon="pi pi-bolt"
                />
                <StatCard
                    label="Ganancia por hora"
                    :value="formatCurrency(data.efficiency?.profit_per_hour)"
                    :hint="`${formatCurrency(data.efficiency?.profit_per_km)} por km`"
                    icon="pi pi-clock"
                />
            </section>

            <SectionCard
                title="Tendencia semanal"
                description="Ganancia neta y costo de combustible de las últimas 8 semanas"
            >
                <ProfitTrendChart
                    v-if="weeklyLabels.length"
                    :labels="weeklyLabels"
                    :net-profit="weeklyProfit"
                    :fuel-cost="weeklyFuel"
                />
                <p v-else class="py-12 text-center text-sm text-ink-muted">
                    Aún no hay turnos suficientes para graficar tendencias.
                </p>
            </SectionCard>

            <div class="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <SectionCard title="Últimos turnos" description="Los 8 movimientos más recientes">
                    <DataTable
                        :value="recentShifts"
                        :row-class="rowClass"
                        data-key="id"
                        size="small"
                        scrollable
                        responsive-layout="scroll"
                    >
                        <Column field="shift_date" header="Fecha" style="min-width: 130px">
                            <template #body="{ data: row }">{{ formatDate(row.shift_date) }}</template>
                        </Column>
                        <Column field="total_km_gps" header="Km" style="min-width: 90px">
                            <template #body="{ data: row }">
                                <span class="tabular">{{ formatNumber(row.total_km_gps) }}</span>
                            </template>
                        </Column>
                        <Column field="real_net_profit" header="Ganancia" style="min-width: 120px">
                            <template #body="{ data: row }">
                                <span class="tabular font-medium">{{ formatCurrency(row.real_net_profit) }}</span>
                            </template>
                        </Column>
                        <Column header="Por km" style="min-width: 110px">
                            <template #body="{ data: row }">
                                <span class="tabular text-ink-muted">
                                    {{
                                        formatCurrency(
                                            toNumber(row.real_net_profit) / Math.max(toNumber(row.total_km_gps), 1),
                                        )
                                    }}
                                </span>
                            </template>
                        </Column>
                        <template #empty>
                            <p class="py-10 text-center text-sm text-ink-muted">Sin turnos registrados todavía.</p>
                        </template>
                    </DataTable>
                </SectionCard>

                <SectionCard title="Kilómetros mensuales" description="Últimos 6 meses">
                    <KmEfficiencyChart v-if="monthlyLabels.length" :labels="monthlyLabels" :total-km="monthlyKm" />
                    <p v-else class="py-12 text-center text-sm text-ink-muted">Sin datos mensuales.</p>
                </SectionCard>
            </div>
        </template>
    </div>
</template>
