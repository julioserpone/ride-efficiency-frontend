<script setup lang="ts">
defineProps<{
    title: string
    description?: string
}>()
</script>

<template>
    <section class="rounded-card border-line bg-surface">
        <header class="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
            <div>
                <h2 class="text-sm font-semibold text-ink">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-xs text-ink-muted">{{ description }}</p>
            </div>
            <slot name="actions" />
        </header>

        <div class="p-5">
            <slot />
        </div>
    </section>
</template>
