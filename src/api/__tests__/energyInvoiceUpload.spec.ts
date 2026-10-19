import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            post: vi.fn().mockResolvedValue({
                data: { message: 'queued', invoice: { id: 42 } },
            }),
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        })),
    },
}))

import { energyInvoicesApi } from '../index'

const http = vi.mocked(axios.create).mock.results[0]?.value as {
    post: ReturnType<typeof vi.fn>
}

describe('energyInvoicesApi.upload', () => {
    afterEach(() => vi.clearAllMocks())

    it('sends a base64 image with invoice metadata as JSON', async () => {
        await energyInvoicesApi.upload('data:image/jpeg;base64,c3ludGhldGlj', 12, '2026-09-22')

        expect(http.post).toHaveBeenCalledWith('/energy-invoices', {
            image_base64: 'data:image/jpeg;base64,c3ludGhldGlj',
            country_id: '12',
            invoice_date: '2026-09-22',
        })
    })

    it('continues supporting multipart file uploads', async () => {
        const image = new File(['synthetic'], 'receipt.jpg', { type: 'image/jpeg' })

        await energyInvoicesApi.upload(image, null, null)

        const [url, body] = vi.mocked(http.post).mock.calls[0]
        expect(url).toBe('/energy-invoices')
        expect(body).toBeInstanceOf(FormData)
        expect((body as FormData).get('image')).toBe(image)
    })
})
