import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
                data: {
                    offers: {
                        data: [],
                        current_page: 1,
                        last_page: 1,
                        per_page: 15,
                        total: 0,
                    },
                },
            }),
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        })),
    },
}))

import { offersApi } from '../index'

const http = vi.mocked(axios.create).mock.results[0]?.value as {
    get: ReturnType<typeof vi.fn>
}

describe('offersApi.list', () => {
    afterEach(() => vi.clearAllMocks())

    it('sends filters, sorting and pagination as query params', async () => {
        await offersApi.list({
            platform: 'uber',
            status: 'accepted',
            date_from: '2026-01-01',
            date_to: '2026-01-31',
            sort: '-received_at',
            page: 2,
        })

        expect(http.get).toHaveBeenCalledWith('/ride-offers', {
            params: {
                platform: 'uber',
                status: 'accepted',
                date_from: '2026-01-01',
                date_to: '2026-01-31',
                sort: '-received_at',
                page: 2,
            },
        })
    })
})

describe('offersApi.show', () => {
    afterEach(() => vi.clearAllMocks())

    it('requests a single offer by id', async () => {
        http.get.mockResolvedValueOnce({ data: { offer: { id: 7 } } })

        const offer = await offersApi.show(7)

        expect(http.get).toHaveBeenCalledWith('/ride-offers/7')
        expect(offer).toEqual({ id: 7 })
    })
})

describe('offersApi.dailySummary', () => {
    afterEach(() => vi.clearAllMocks())

    it('requests the daily summary', async () => {
        http.get.mockResolvedValueOnce({ data: { summary: { offered: 1 } } })

        const summary = await offersApi.dailySummary()

        expect(http.get).toHaveBeenCalledWith('/ride-offers/summary/daily')
        expect(summary).toEqual({ offered: 1 })
    })
})
