<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'

import { fuelInvoicesApi } from '@/api'
import type { FuelInvoice, FuelInvoiceStatus } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate } from '@/lib/format'

const invoices = ref<FuelInvoice[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const response = await fuelInvoicesApi.list()
        invoices.value = response.invoices.data
    } catch {
        error.value = 'No se pudieron cargar los recibos.'
    } finally {
        isLoading.value = false
    }
}

onMounted(load)

const statusSeverity: Record<FuelInvoiceStatus, 'warn' | 'info' | 'success' | 'danger'> = {
    pending: 'warn',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
}

const statusLabel: Record<FuelInvoiceStatus, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Procesado',
    failed: 'Falló',
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Recibos de combustible</h1>
            <p class="mt-1 text-sm text-ink-muted">
                Las imágenes se suben desde la app móvil y el OCR extrae el monto y los litros.
            </p>
        </header>

        <div v-if="error" class="rounded-card border-line bg-surface p-4 text-sm text-loss">{{ error }}</div>

        <SectionCard title="Recibos" description="Estado de procesamiento OCR">
            <div v-if="isLoading" class="grid place-items-center py-20">
                <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
            </div>

            <DataTable v-else :value="invoices" data-key="id" size="small" scrollable responsive-layout="scroll">
                <Column field="invoice_date" header="Fecha factura" style="min-width: 140px">
                    <template #body="{ data: row }">{{ formatDate(row.invoice_date) }}</template>
                </Column>
                <Column field="total_amount" header="Monto" style="min-width: 110px">
                    <template #body="{ data: row }">
                        <span class="tabular">{{ row.total_amount ? formatCurrency(row.total_amount) : '—' }}</span>
                    </template>
                </Column>
                <Column field="liters" header="Litros" style="min-width: 90px">
                    <template #body="{ data: row }">
                        <span class="tabular">{{ row.liters ?? '—' }}</span>
                    </template>
                </Column>
                <Column field="status" header="Estado" style="min-width: 130px">
                    <template #body="{ data: row }">
                        <Tag
                            :severity="statusSeverity[row.status as FuelInvoiceStatus]"
                            :value="statusLabel[row.status as FuelInvoiceStatus]"
                            class="text-xs"
                        />
                    </template>
                </Column>
                <Column field="created_at" header="Subido" style="min-width: 140px">
                    <template #body="{ data: row }">
                        <span class="text-ink-muted">{{ formatDate(row.created_at) }}</span>
                    </template>
                </Column>
                <template #empty>
                    <p class="py-10 text-center text-sm text-ink-muted">Sin recibos registrados todavía.</p>
                </template>
            </DataTable>
        </SectionCard>
    </div>
</template>
