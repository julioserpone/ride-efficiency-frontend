<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import { formatCurrency, toNumber } from '@/lib/format'

const props = defineProps<{
    labels: string[]
    netProfit: number[]
    fuelCost: number[]
}>()

/**
 * Restrained chart styling: no grid weight, thin axis, tabular tooltips.
 * Emerald is reserved for profit, amber for fuel cost.
 */
const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: { speed: 300 },
    },
    colors: ['#10b981', '#f59e0b'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 0.4, opacityFrom: 0.18, opacityTo: 0.02, stops: [0, 90, 100] },
    },
    grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 0,
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
            formatter: (value: number) => formatCurrency(value),
        },
    },
    legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        markers: { size: 6 },
        labels: { colors: '#64748b' },
    },
    tooltip: {
        y: { formatter: (value: number) => formatCurrency(value) },
    },
}))

const series = computed(() => [
    { name: 'Ganancia neta', data: props.netProfit.map(toNumber) },
    { name: 'Combustible', data: props.fuelCost.map(toNumber) },
])
</script>

<template>
    <apexchart type="area" height="280" :options="chartOptions" :series="series" />
</template>
