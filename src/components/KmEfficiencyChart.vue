<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import { toNumber } from '@/lib/format'

const props = defineProps<{
    labels: string[]
    totalKm: number[]
}>()

const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit',
    },
    colors: ['#10b981'],
    plotOptions: {
        bar: { columnWidth: '46%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    dataLabels: { enabled: false },
    grid: {
        borderColor: '#e2e8f0',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8 },
    },
    xaxis: {
        categories: props.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#64748b', fontSize: '11px' } },
    },
    yaxis: {
        labels: {
            style: { colors: '#64748b', fontSize: '11px' },
            formatter: (value: number) => `${value.toFixed(0)} km`,
        },
    },
    tooltip: {
        y: { formatter: (value: number) => `${value.toFixed(1)} km` },
    },
}))

const series = computed(() => [{ name: 'Kilómetros', data: props.totalKm.map(toNumber) }])
</script>

<template>
    <apexchart type="bar" height="280" :options="chartOptions" :series="series" />
</template>
