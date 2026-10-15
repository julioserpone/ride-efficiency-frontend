import type { EnergyInvoice, EnergyInvoiceItem, EnergyInvoiceReviewPayload } from '@/api/types'

export interface InvoiceReviewForm {
    country_id: string
    energy_type: string
    energy_unit: 'gallons' | 'litres' | 'kwh'
    hasInvoiceItems: boolean
    energy_amount: string
    unit_price: string
    total_amount_paid: string
    energy_product_id: string
    fuel_type: string
    invoice_date: string
    vendor_name: string
    vendor_tax_id: string
    vendor_address: string
    vendor_commercial_name: string
    station_name: string
    station_brand: string
    customer_name: string
    customer_tax_id: string
    customer_email: string
    payment_method: string
    vehicle_plate: string
    invoice_number: string
    authorization_number: string
    subtotal_amount: string
    tax_amount: string
    tax_rate: string
    total_amount_without_subsidy: string
    items: InvoiceItemForm[]
}

export interface InvoiceItemForm {
    product_description: string
    item_code: string
    quantity: string
    quantity_unit: EnergyReviewUnit | ''
    unit_price: string
    unit_price_without_subsidy: string
    subsidy_amount: string
    subtotal_amount: string
    tax_rate: string
    tax_amount: string
    total_amount: string
    total_amount_without_subsidy: string
}

export type EnergyReviewUnit = 'gallons' | 'litres' | 'kwh'

const invoiceFields = [
    'vendor_name',
    'vendor_tax_id',
    'vendor_address',
    'station_name',
    'station_brand',
    'customer_name',
    'customer_tax_id',
    'customer_email',
    'payment_method',
    'vehicle_plate',
    'invoice_number',
    'authorization_number',
    'subtotal_amount',
    'tax_amount',
    'tax_rate',
    'total_amount_without_subsidy',
] as const
function optionalNumber(value: string): number | null {
    return value.trim() === '' ? null : Number(value)
}

function itemToForm(item: EnergyInvoiceItem): InvoiceItemForm {
    return {
        product_description: item.product_description ?? '',
        item_code: item.item_code ?? '',
        quantity: item.quantity == null ? '' : String(item.quantity),
        quantity_unit: item.quantity_unit ?? '',
        unit_price: item.unit_price == null ? '' : String(item.unit_price),
        unit_price_without_subsidy:
            item.unit_price_without_subsidy == null ? '' : String(item.unit_price_without_subsidy),
        subsidy_amount: item.subsidy_amount == null ? '' : String(item.subsidy_amount),
        subtotal_amount: item.subtotal_amount == null ? '' : String(item.subtotal_amount),
        tax_rate: item.tax_rate == null ? '' : String(item.tax_rate),
        tax_amount: item.tax_amount == null ? '' : String(item.tax_amount),
        total_amount: item.total_amount == null ? '' : String(item.total_amount),
        total_amount_without_subsidy:
            item.total_amount_without_subsidy == null ? '' : String(item.total_amount_without_subsidy),
    }
}

export function createInvoiceReviewForm(invoice: EnergyInvoice, fallbackCountryId: number | null): InvoiceReviewForm {
    return {
        country_id: String(invoice.country_id ?? fallbackCountryId ?? ''),
        energy_type: invoice.energy_type ?? 'regular_gasoline',
        energy_unit: invoice.energy_unit ?? 'gallons',
        energy_amount: invoice.energy_amount ?? '',
        unit_price: invoice.unit_price ?? '',
        total_amount_paid: invoice.total_amount_paid ?? '',
        energy_product_id: invoice.energy_product_id ? String(invoice.energy_product_id) : '',
        fuel_type: invoice.fuel_type ?? '',
        invoice_date: invoice.invoice_date?.slice(0, 10) ?? '',
        hasInvoiceItems: invoice.items !== undefined,
        vendor_name: invoice.vendor_name ?? invoice.vendor?.legal_name ?? '',
        vendor_tax_id: invoice.vendor_tax_id ?? invoice.vendor?.tax_id ?? '',
        vendor_address: invoice.vendor_address ?? invoice.vendor?.address ?? '',
        vendor_commercial_name: invoice.vendor?.commercial_name ?? '',
        station_name: invoice.station_name ?? '',
        station_brand: invoice.station_brand ?? '',
        customer_name: invoice.customer_name ?? '',
        customer_tax_id: invoice.customer_tax_id ?? '',
        customer_email: invoice.customer_email ?? '',
        payment_method: invoice.payment_method ?? '',
        vehicle_plate: invoice.vehicle_plate ?? '',
        invoice_number: invoice.invoice_number ?? '',
        authorization_number: invoice.authorization_number ?? '',
        subtotal_amount: invoice.subtotal_amount ?? '',
        tax_amount: invoice.tax_amount ?? '',
        tax_rate: invoice.tax_rate ?? '',
        total_amount_without_subsidy: invoice.total_amount_without_subsidy ?? '',
        items: (invoice.items ?? []).map(itemToForm),
    }
}

export function createInvoiceReviewPayload(form: InvoiceReviewForm): EnergyInvoiceReviewPayload {
    const payload: EnergyInvoiceReviewPayload = {
        country_id: Number(form.country_id),
        energy_type: form.energy_type,
        energy_unit: form.energy_unit,
        energy_amount: Number(form.energy_amount),
        unit_price: Number(form.unit_price),
        total_amount_paid: optionalNumber(form.total_amount_paid),
        energy_product_id: form.energy_product_id ? Number(form.energy_product_id) : null,
        fuel_type: form.fuel_type.trim() || null,
        invoice_date: form.invoice_date || null,
    }

    for (const field of invoiceFields) {
        const value = form[field].trim()
        if (value !== '') {
            if (
                field === 'subtotal_amount' ||
                field === 'tax_amount' ||
                field === 'tax_rate' ||
                field === 'total_amount_without_subsidy'
            ) {
                payload[field] = Number(value)
            } else {
                payload[field] = value
            }
        }
    }

    if (form.vendor_commercial_name.trim() !== '') {
        payload.vendor_commercial_name = form.vendor_commercial_name.trim()
    }

    if (form.hasInvoiceItems) {
        payload.items = form.items.map((item) => ({
            product_description: item.product_description.trim() || null,
            item_code: item.item_code.trim() || null,
            quantity: optionalNumber(item.quantity),
            quantity_unit: item.quantity_unit || null,
            unit_price: optionalNumber(item.unit_price),
            unit_price_without_subsidy: optionalNumber(item.unit_price_without_subsidy),
            subsidy_amount: optionalNumber(item.subsidy_amount),
            subtotal_amount: optionalNumber(item.subtotal_amount),
            tax_rate: optionalNumber(item.tax_rate),
            tax_amount: optionalNumber(item.tax_amount),
            total_amount: optionalNumber(item.total_amount),
            total_amount_without_subsidy: optionalNumber(item.total_amount_without_subsidy),
        }))
    }

    return payload
}

export function newInvoiceItem(): InvoiceItemForm {
    return {
        product_description: '',
        item_code: '',
        quantity: '',
        quantity_unit: '',
        unit_price: '',
        unit_price_without_subsidy: '',
        subsidy_amount: '',
        subtotal_amount: '',
        tax_rate: '',
        tax_amount: '',
        total_amount: '',
        total_amount_without_subsidy: '',
    }
}
