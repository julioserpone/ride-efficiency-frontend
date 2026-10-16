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

export type EnergyUnit = 'gallons' | 'litres' | 'kwh'

export interface InvoiceVendor {
    id: number
    country_id: number | null
    tax_id: string | null
    tax_id_normalized: string | null
    legal_name: string | null
    commercial_name: string | null
    address: string | null
}

export interface EnergyInvoiceItem {
    id?: number
    energy_invoice_id?: number
    energy_product_id?: number | null
    line_number?: number
    product_description: string | null
    item_code: string | null
    quantity: string | number | null
    quantity_unit: EnergyUnit | null
    unit_price: string | number | null
    unit_price_without_subsidy: string | number | null
    subsidy_amount: string | number | null
    subtotal_amount: string | number | null
    tax_rate: string | number | null
    tax_amount: string | number | null
    total_amount: string | number | null
    total_amount_without_subsidy: string | number | null
    energy_product?: EnergyProduct | null
}

export interface EnergyInvoice {
    id: number
    country_id: number | null
    vendor_id?: number | null
    energy_product_id: number | null
    image_path: string
    total_amount_paid: string | null
    energy_amount: string | null
    energy_unit: EnergyUnit | null
    currency_code: string | null
    fuel_type: string | null
    energy_type: string | null
    unit_price: string | null
    vendor_name: string | null
    vendor_tax_id?: string | null
    vendor_address?: string | null
    station_name?: string | null
    station_brand?: string | null
    customer_name?: string | null
    customer_tax_id?: string | null
    customer_email?: string | null
    payment_method?: string | null
    vehicle_plate?: string | null
    invoice_number?: string | null
    authorization_number?: string | null
    subtotal_amount?: string | null
    tax_amount?: string | null
    tax_rate?: string | null
    total_amount_without_subsidy?: string | null
    vendor?: InvoiceVendor | null
    items?: EnergyInvoiceItem[]
    invoice_date: string | null
    status: EnergyInvoiceStatus
    created_at: string
}

export interface EnergyInvoiceReviewPayload {
    country_id: number
    energy_type: string
    energy_unit: EnergyUnit
    energy_amount: number
    unit_price: number
    total_amount_paid?: number | null
    energy_product_id?: number | null
    fuel_type?: string | null
    tax_rate?: number | null
    invoice_date?: string | null
    vendor_name?: string | null
    vendor_tax_id?: string | null
    vendor_address?: string | null
    vendor_commercial_name?: string | null
    station_name?: string | null
    station_brand?: string | null
    customer_name?: string | null
    customer_tax_id?: string | null
    customer_email?: string | null
    payment_method?: string | null
    vehicle_plate?: string | null
    invoice_number?: string | null
    authorization_number?: string | null
    subtotal_amount?: number | null
    tax_amount?: number | null
    total_amount_without_subsidy?: number | null
    items?: Array<Omit<EnergyInvoiceItem, 'energy_invoice_id' | 'energy_product' | 'id' | 'line_number'>>
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
