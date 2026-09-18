/**
 * Domain types mirroring the JSON shapes returned by ride-efficiency-api.
 * Keep these in sync with the API — the response shapes are stable and
 * shared with the React Native mobile app.
 */

export interface ApiUser {
    id: number
    name: string
    email: string
}

export interface IssueTokenResponse {
    token: string
    token_type: string
    user: ApiUser
}

export interface DailyEarning {
    id: number
    daily_shift_id: number
    provider_name: string
    gross_amount: string
    tips_amount?: string | null
}

export interface DailyShift {
    id: number
    shift_date: string
    total_km_gps: string
    total_minutes_connected: number
    total_trips_completed: number
    total_offers_scanned: number
    applied_fuel_cost: string
    estimated_depreciation: string
    real_net_profit: string
    earnings?: DailyEarning[]
}

export interface ShiftsSummary {
    total_shifts: number
    total_net_profit: number
    total_km_gps: number
    total_trips_completed: number
}

export interface Paginated<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export interface ShiftsResponse {
    summary: ShiftsSummary
    shifts: Paginated<DailyShift>
}

export interface StatsTotals {
    total_shifts: number | null
    total_net_profit: number | string | null
    total_km: number | string | null
    total_fuel_cost: number | string | null
    total_depreciation: number | string | null
    total_trips: number | string | null
    avg_daily_profit: number | string | null
    avg_daily_km: number | string | null
}

export interface ShiftExtremes {
    id: number
    shift_date: string
    real_net_profit: string
    total_trips_completed: number
    total_km_gps: string
}

export interface SummaryResponse {
    totals: StatsTotals
    best_shift: ShiftExtremes | null
    worst_shift: ShiftExtremes | null
    current_month_profit: number
}

export interface EfficiencyResponse {
    efficiency: {
        profit_per_km: number
        profit_per_hour: number
        fuel_cost_per_km: number
        avg_km_per_shift: number
        avg_minutes_per_shift: number
    }
}

export interface WeeklyEntry {
    week_start: string
    total_shifts: number
    total_net_profit: number
    total_km: number
    total_fuel_cost: number
    total_depreciation: number
    total_trips: number
    avg_daily_profit: number
}

export interface WeeklyResponse {
    weekly: WeeklyEntry[]
}

export interface MonthlyEntry {
    month_start: string
    total_shifts: number
    total_net_profit: number
    total_km: number
    total_fuel_cost: number
    total_depreciation: number
    total_trips: number
    avg_daily_profit: number
}

export interface MonthlyResponse {
    monthly: MonthlyEntry[]
}

export type FuelInvoiceStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface FuelInvoice {
    id: number
    image_path: string
    status: FuelInvoiceStatus
    invoice_date: string | null
    total_amount: string | null
    liters: string | null
    created_at: string
}

export interface FuelInvoicesResponse {
    invoices: Paginated<FuelInvoice>
}
