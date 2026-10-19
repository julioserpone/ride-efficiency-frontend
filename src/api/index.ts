import { http } from './client'
import type {
    CountryListResponse,
    EfficiencyResponse,
    EnergyInvoice,
    EnergyInvoiceMutationResponse,
    EnergyInvoiceReviewPayload,
    EnergyInvoicesResponse,
    EnergyProductsResponse,
    IssueTokenResponse,
    MonthlyResponse,
    RideTripDetailResponse,
    RideTripMutationResponse,
    RideTripsResponse,
    ShiftInput,
    ShiftMutationResponse,
    ShiftsResponse,
    SummaryResponse,
    Vehicle,
    VehicleMutationResponse,
    VehiclesResponse,
    WeeklyResponse,
} from './types'

export const authApi = {
    async issueToken(email: string, password: string, deviceName = '-dashboard') {
        const { data } = await http.post<IssueTokenResponse>('/auth/token', {
            email,
            password,
            device_name: deviceName,
        })

        return data
    },

    async revokeToken() {
        await http.delete('/auth/token')
    },

    async currentUser() {
        const { data } = await http.get<{ user: IssueTokenResponse['user'] }>('/auth/user')

        return data.user
    },
}

export const shiftsApi = {
    async list(page = 1) {
        const { data } = await http.get<ShiftsResponse>('/shifts', { params: { page } })

        return data
    },

    async show(id: number) {
        const { data } = await http.get<{ shift: ShiftsResponse['shifts']['data'][number] }>(`/shifts/${id}`)

        return data.shift
    },

    async create(payload: ShiftInput) {
        const { data } = await http.post<ShiftMutationResponse>('/shifts', payload)

        return data
    },

    async close(id: number, payload: ShiftInput) {
        const { data } = await http.post<ShiftMutationResponse>(`/shifts/${id}/close`, payload)

        return data
    },
}

export const countriesApi = {
    async list() {
        const { data } = await http.get<CountryListResponse>('/countries')

        return data.countries
    },

    async energyProducts(countryCode: string) {
        const { data } = await http.get<EnergyProductsResponse>(
            `/countries/${encodeURIComponent(countryCode)}/energy-products`,
        )

        return data
    },
}

export const statsApi = {
    async summary() {
        const { data } = await http.get<SummaryResponse>('/stats/summary')

        return data
    },

    async weekly() {
        const { data } = await http.get<WeeklyResponse>('/stats/weekly')

        return data
    },

    async monthly() {
        const { data } = await http.get<MonthlyResponse>('/stats/monthly')

        return data
    },

    async efficiency() {
        const { data } = await http.get<EfficiencyResponse>('/stats/efficiency')

        return data
    },
}

export const energyInvoicesApi = {
    async list(page = 1) {
        const { data } = await http.get<EnergyInvoicesResponse>('/energy-invoices', { params: { page } })

        return data
    },

    async upload(
        image: File | string,
        countryId: number | null,
        invoiceDate: string | null,
    ): Promise<EnergyInvoiceMutationResponse> {
        let payload: FormData | { image_base64: string; country_id?: string; invoice_date?: string }

        if (image instanceof File) {
            const formData = new FormData()
            formData.append('image', image)
            payload = formData
        } else {
            payload = { image_base64: image }
        }

        if (countryId !== null) {
            if (payload instanceof FormData) {
                payload.append('country_id', String(countryId))
            } else {
                payload.country_id = String(countryId)
            }
        }

        if (invoiceDate) {
            if (payload instanceof FormData) {
                payload.append('invoice_date', invoiceDate)
            } else {
                payload.invoice_date = invoiceDate
            }
        }

        const { data } = await http.post<EnergyInvoiceMutationResponse>('/energy-invoices', payload)

        return data
    },

    async show(id: number) {
        const { data } = await http.get<{ invoice: EnergyInvoice }>(`/energy-invoices/${id}`)

        return data.invoice
    },

    async review(id: number, payload: EnergyInvoiceReviewPayload) {
        const { data } = await http.patch<EnergyInvoiceMutationResponse>(`/energy-invoices/${id}/review`, payload)

        return data
    },

    async remove(id: number) {
        await http.delete(`/energy-invoices/${id}`)
    },
}

export const vehiclesApi = {
    async list(page = 1) {
        const { data } = await http.get<VehiclesResponse>('/vehicles', { params: { page } })

        return data
    },

    async create(
        payload: Pick<Vehicle, 'country_id' | 'name' | 'energy_type' | 'energy_unit'> & {
            energy_economy: number
            commission_rate?: number | null
        },
    ) {
        const { data } = await http.post<VehicleMutationResponse>('/vehicles', payload)

        return data
    },
}

export const rideTripsApi = {
    async list(page = 1) {
        const { data } = await http.get<RideTripsResponse>('/ride-trips', { params: { page } })

        return data
    },

    async create(vehicleId: number, payload: Record<string, string | number | null>) {
        const { data } = await http.post<RideTripMutationResponse>(`/vehicles/${vehicleId}/trips`, payload)

        return data
    },

    async show(id: number) {
        const { data } = await http.get<RideTripDetailResponse>(`/ride-trips/${id}`)

        return data.trip
    },
}
