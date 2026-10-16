import { describe, expect, it } from 'vitest'

import type { EnergyInvoice } from '@/api/types'

import { createInvoiceReviewForm, createInvoiceReviewPayload } from './invoiceReview'

function sampleInvoice(overrides: Partial<EnergyInvoice> = {}): EnergyInvoice {
    return {
        id: 10,
        country_id: 1,
        energy_product_id: null,
        image_path: 'energy-invoices/sample.jpg',
        total_amount_paid: '30.00',
        energy_amount: '6.250',
        energy_unit: 'gallons',
        currency_code: 'USD',
        fuel_type: 'Premium',
        energy_type: 'premium_gasoline',
        unit_price: '4.1700',
        vendor_name: 'Proveedor Legal',
        vendor_tax_id: '123456789',
        vendor_address: 'Calle de prueba',
        station_name: 'Centro',
        station_brand: 'Marca',
        customer_name: 'Cliente de prueba',
        customer_tax_id: '987654321',
        customer_email: 'cliente@example.test',
        payment_method: 'Efectivo',
        vehicle_plate: 'ABC123',
        invoice_number: '001-002-0001',
        authorization_number: 'AUT-123',
        subtotal_amount: '26.09',
        tax_amount: '3.91',
        tax_rate: '15.00',
        total_amount_without_subsidy: '29.99',
        invoice_date: '2026-10-09 12:30:00',
        status: 'review_required',
        created_at: '2026-10-10T12:00:00Z',
        vendor: {
            id: 4,
            country_id: 1,
            tax_id: '123456789',
            tax_id_normalized: '123456789',
            legal_name: 'Proveedor Legal',
            commercial_name: 'Nombre comercial',
            address: 'Calle de prueba',
        },
        items: [
            {
                energy_product_id: 2,
                line_number: 1,
                product_description: 'Gasolina premium',
                item_code: '0103',
                quantity: '6.2500',
                quantity_unit: 'gallons',
                unit_price: '4.1700',
                unit_price_without_subsidy: '4.1700',
                subsidy_amount: '0.00',
                subtotal_amount: '26.09',
                tax_rate: '15.00',
                tax_amount: '3.91',
                total_amount: '30.00',
                total_amount_without_subsidy: '29.99',
            },
        ],
        ...overrides,
    }
}

describe('invoice review mapping', () => {
    it('hydrates supplier, invoice and item fields from the API shape', () => {
        const form = createInvoiceReviewForm(sampleInvoice(), null)

        expect(form.vendor_commercial_name).toBe('Nombre comercial')
        expect(form.customer_name).toBe('Cliente de prueba')
        expect(form.invoice_date).toBe('2026-10-09')
        expect(form.items).toHaveLength(1)
        expect(form.items[0].quantity).toBe('6.2500')
    })

    it('serializes reviewed supplier and invoice lines without mixing invoice totals', () => {
        const form = createInvoiceReviewForm(sampleInvoice(), null)
        form.vendor_name = 'Proveedor corregido'
        form.customer_name = 'Cliente corregido'
        form.items[0].quantity = '6.5'

        const payload = createInvoiceReviewPayload(form)

        expect(payload.vendor_name).toBe('Proveedor corregido')
        expect(payload.customer_name).toBe('Cliente corregido')
        expect(payload.subtotal_amount).toBe(26.09)
        expect(payload.total_amount_paid).toBe(30)
        expect(payload.items?.[0]).toMatchObject({
            product_description: 'Gasolina premium',
            quantity: 6.5,
            quantity_unit: 'gallons',
            subtotal_amount: 26.09,
        })
        expect(payload.items?.[0]).not.toHaveProperty('line_number')
    })

    it('serializes an explicit empty item list when the user removes all detected rows', () => {
        const form = createInvoiceReviewForm(sampleInvoice({ country_id: null, items: [] }), 2)
        form.vendor_name = ''
        form.items = []

        const payload = createInvoiceReviewPayload(form)

        expect(payload.country_id).toBe(2)
        expect(payload).not.toHaveProperty('vendor_name')
        expect(payload.items).toEqual([])
    })
})
