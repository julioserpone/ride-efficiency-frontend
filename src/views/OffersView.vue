<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'

import { offersApi } from '@/api'
import type { OfferFunnel, RideOffer } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate } from '@/lib/format'

const offers = ref<RideOffer[]>([])
const funnel = ref<OfferFunnel | null>(null)
const page = ref(1)
const lastPage = ref(1)
const isLoading = ref(false)
const error = ref<string | null>(null)

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const [listResponse, summary] = await Promise.all([
            offersApi.list({ page: page.value }),
            offersApi.dailySummary(),
        ])
        offers.value = listResponse.offers.data
        page.value = listResponse.offers.current_page
        lastPage.value = listResponse.offers.last_page
        funnel.value = summary
    } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar las ofertas.'
    } finally {
        isLoading.value = false
    }
}

function verdictSeverity(verdict: string | null): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (verdict) {
        case 'accept':
            return 'success'
        case 'marginal':
            return 'warn'
        case 'reject':
            return 'danger'
        default:
            return 'secondary'
    }
}

onMounted(load)
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Ofertas</h1>
            <p class="mt-1 text-sm text-ink-muted">
                Historial y embudo de ofertas capturadas.
            </p>
        </header>

        <div v-if="error" class="rounded-card border-line bg-surface p-4 text-sm text-loss">
            {{ error }}
        </div>

        <SectionCard v-if="funnel" title="Embudo diario">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><span class="text-xs text-ink-muted">Recibidas</span><div class="text-lg font-semibold">{{ funnel.offered }}</div></div>
                <div><span class="text-xs text-ink-muted">Aceptadas</span><div class="text-lg font-semibold">{{ funnel.accepted }}</div></div>
                <div><span class="text-xs text-ink-muted">Completadas</span><div class="text-lg font-semibold">{{ funnel.completed }}</div></div>
                <div><span class="text-xs text-ink-muted">Rechazadas</span><div class="text-lg font-semibold">{{ funnel.rejected }}</div></div>
            </div>
        </SectionCard>

        <div v-if="isLoading" class="grid place-items-center py-24">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        </div>

        <SectionCard v-else title="Ofertas recientes">
            <DataTable :value="offers" stripedRows size="small">
                <Column field="platform" header="Plataforma" />
                <Column header="Tarifa">
                    <template #body="{ data }">
                        {{ formatCurrency(data.offered_fare) }}
                    </template>
                </Column>
                <Column header="Distancia">
                    <template #body="{ data }">
                        {{ data.estimated_distance_km }} km
                    </template>
                </Column>
                <Column header="Veredicto">
                    <template #body="{ data }">
                        <Tag :value="data.client_verdict ?? '—'" :severity="verdictSeverity(data.client_verdict)" />
                    </template>
                </Column>
                <Column header="Recibida">
                    <template #body="{ data }">
                        {{ formatDate(data.received_at) }}
                    </template>
                </Column>
            </DataTable>
        </SectionCard>
    </div>
</template>
EOF
echo "done"