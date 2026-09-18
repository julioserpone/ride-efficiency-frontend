/**
 * Presentation helpers shared by the dashboard widgets.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

/**
 * Numeric values arrive from the API as strings (Eloquent decimal casts),
 * so every helper accepts both and falls back to 0 for null/invalid input.
 */
export function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
        return 0
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value)

    return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrency(value: number | string | null | undefined): string {
    return currencyFormatter.format(toNumber(value))
}

export function formatNumber(value: number | string | null | undefined, decimals = 1): string {
    return toNumber(value).toFixed(decimals)
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Status color used across charts and tables: profitable / neutral / loss.
 */
export function profitVariant(value: number | string | null | undefined): 'profit' | 'neutral' | 'loss' {
    const amount = toNumber(value)

    if (amount > 0) {
        return 'profit'
    }

    if (amount < 0) {
        return 'loss'
    }

    return 'neutral'
}
