import { http } from './client'
import type {
    EfficiencyResponse,
    FuelInvoicesResponse,
    IssueTokenResponse,
    MonthlyResponse,
    ShiftsResponse,
    SummaryResponse,
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
}

export const shiftsApi = {
    async list(page = 1) {
        const { data } = await http.get<ShiftsResponse>('/shifts', { params: { page } })

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

export const fuelInvoicesApi = {
    async list() {
        const { data } = await http.get<FuelInvoicesResponse>('/fuel-invoices')

        return data
    },
}
