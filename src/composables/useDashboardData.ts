import { ref } from 'vue'

import { shiftsApi, statsApi } from '@/api'
import type {
    DailyShift,
    EfficiencyResponse,
    MonthlyEntry,
    ShiftExtremes,
    ShiftsSummary,
    StatsTotals,
    WeeklyEntry,
} from '@/api/types'

export interface DashboardData {
    totals: StatsTotals | null
    currentMonthProfit: number
    bestShift: ShiftExtremes | null
    summary: ShiftsSummary | null
    efficiency: EfficiencyResponse['efficiency'] | null
    weekly: WeeklyEntry[]
    monthly: MonthlyEntry[]
    recentShifts: DailyShift[]
}

/**
 * Aggregates every endpoint the overview needs into a single load, so the
 * screen renders once instead of progressively reflowing.
 */
export function useDashboardData() {
    const data = ref<DashboardData>({
        totals: null,
        currentMonthProfit: 0,
        bestShift: null,
        summary: null,
        efficiency: null,
        weekly: [],
        monthly: [],
        recentShifts: [],
    })

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    async function load(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            const [summary, weekly, monthly, efficiency, shifts] = await Promise.all([
                statsApi.summary(),
                statsApi.weekly(),
                statsApi.monthly(),
                statsApi.efficiency(),
                shiftsApi.list(),
            ])

            data.value = {
                totals: summary.totals,
                currentMonthProfit: summary.current_month_profit,
                bestShift: summary.best_shift,
                summary: shifts.summary,
                efficiency: efficiency.efficiency,
                weekly: weekly.weekly,
                monthly: monthly.monthly,
                recentShifts: shifts.shifts.data,
            }
        } catch {
            error.value = 'No se pudieron cargar los datos. Revisa la conexión con la API.'
        } finally {
            isLoading.value = false
        }
    }

    return { data, isLoading, error, load }
}
