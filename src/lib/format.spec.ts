import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDate, formatNumber, profitVariant, toNumber } from './format'

describe('toNumber', () => {
    it('parses the decimal strings returned by the API', () => {
        expect(toNumber('125.50')).toBe(125.5)
    })

    it('falls back to zero for null and invalid input', () => {
        expect(toNumber(null)).toBe(0)
        expect(toNumber(undefined)).toBe(0)
        expect(toNumber('not-a-number')).toBe(0)
    })
})

describe('formatCurrency', () => {
    it('formats a decimal string as USD', () => {
        expect(formatCurrency('125.50')).toBe('$125.50')
    })

    it('formats missing values as zero', () => {
        expect(formatCurrency(null)).toBe('$0.00')
    })
})

describe('formatNumber', () => {
    it('keeps one decimal by default', () => {
        expect(formatNumber('5951.12')).toBe('5951.1')
    })
})

describe('formatDate', () => {
    it('renders an ISO date in a short format', () => {
        expect(formatDate('2026-08-05')).toMatch(/2026/)
    })

    it('renders a dash for missing dates', () => {
        expect(formatDate(null)).toBe('—')
    })
})

describe('profitVariant', () => {
    it('maps positive values to profit', () => {
        expect(profitVariant('120.00')).toBe('profit')
    })

    it('maps negative values to loss', () => {
        expect(profitVariant('-15.00')).toBe('loss')
    })

    it('maps zero to neutral', () => {
        expect(profitVariant('0.00')).toBe('neutral')
    })
})
