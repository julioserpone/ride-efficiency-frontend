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

export interface Country {
    id: number
    code: string
    name: string
    currency_code: string
    currency_symbol: string
}

export interface CountryListResponse {
    countries: Country[]
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

export interface ShiftMutationResponse {
    message: string
    shift: DailyShift
}

export interface ShiftInput {
    shift_date?: string
    total_km_gps?: number
    total_minutes_connected?: number
    total_trips_completed?: number
    total_offers_scanned?: number
    applied_fuel_cost?: number
    estimated_depreciation?: number
    earnings?: Array<{ provider_name: string; gross_amount: number }>
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

export type EnergyInvoiceStatus = 'pending' | 'processing' | 'review_required' | 'completed' | 'failed'

export interface EnergyInvoice {
    id: number
    country_id: number | null
    energy_product_id: number | null
    image_path: string
    total_amount_paid: string | null
    energy_amount: string | null
    energy_unit: 'gallons' | 'litres' | 'kwh' | null
    currency_code: string | null
    fuel_type: string | null
    energy_type: string | null
    unit_price: string | null
    vendor_name: string | null
    invoice_date: string | null
    status: EnergyInvoiceStatus
    created_at: string
}

export interface EnergyInvoicesResponse {
    invoices: Paginated<EnergyInvoice>
}

export interface EnergyInvoiceMutationResponse {
    message: string
    invoice: EnergyInvoice
}

export interface EnergyProduct {
    id: number
    code: string
    name: string
    energy_type: string
    energy_unit: string
}

export interface EnergyProductsResponse {
    country: Pick<Country, 'code' | 'name'>
    products: EnergyProduct[]
}

export interface Vehicle {
    id: number
    country_id: number
    name: string
    energy_type: string
    energy_unit: string
    energy_economy: string
    commission_rate: string | null
    is_active: boolean
    country: Country
}

export interface VehiclesResponse {
    vehicles: Paginated<Vehicle>
}

export interface VehicleMutationResponse {
    message: string
    vehicle: Vehicle
}

export interface RideTrip {
    id: number
    vehicle_id: number
    daily_shift_id: number | null
    platform_name: string
    currency_code: string
    gross_fare: string
    distance_km: string
    deadhead_distance_km: string
    duration_minutes: number | null
    commission_rate: string
    energy_price_per_unit: string
    energy_cost: string
    commission_cost: string
    depreciation_cost: string
    other_costs: string
    net_profit: string
    break_even_fare: string
    verdict: string
    created_at: string
    vehicle?: Vehicle
}

export interface RideTripsResponse {
    trips: Paginated<RideTrip>
}

export interface RideTripMutationResponse {
    message: string
    trip: RideTrip
}

export interface RideTripDetailResponse {
    trip: RideTrip
}
