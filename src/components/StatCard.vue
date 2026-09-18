<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        label: string
        value: string
        hint?: string
        trend?: number | null
        icon?: string
    }>(),
    {
        hint: undefined,
        trend: null,
        icon: undefined,
    },
)

const trendVariant = computed(() => {
    if (props.trend === null) {
        return 'neutral'
    }

    return props.trend >= 0 ? 'profit' : 'loss'
})

const trendLabel = computed(() => {
    if (props.trend === null) {
        return null
    }

    const sign = props.trend >= 0 ? '+' : ''

    return `${sign}${props.trend.toFixed(1)}%`
})
</script>

<template>
    <!-- Flat card: small muted label on top, large number in the centre. -->
    <article class="rounded-card border-line bg-surface p-5">
        <header class="flex items-start justify-between gap-3">
            <p class="text-xs font-medium tracking-wide text-ink-muted uppercase">{{ label }}</p>
            <i v-if="icon" :class="icon" class="text-sm text-ink-muted" />
        </header>

        <p class="tabular mt-3 text-3xl font-semibold text-ink">{{ value }}</p>

        <footer class="mt-2 flex items-center gap-2 text-xs">
            <span
                v-if="trendLabel"
                class="inline-flex items-center gap-1 font-medium"
                :class="{
                    'text-profit': trendVariant === 'profit',
                    'text-loss': trendVariant === 'loss',
                    'text-neutral': trendVariant === 'neutral',
                }"
            >
                <i :class="trendVariant === 'profit' ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'" />
                {{ trendLabel }}
            </span>
            <span v-if="hint" class="text-ink-muted">{{ hint }}</span>
        </footer>
    </article>
</template>
