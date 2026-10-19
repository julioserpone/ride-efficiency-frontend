<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'

import { countriesApi, energyInvoicesApi } from '@/api'
import type { Country, EnergyInvoice, EnergyInvoiceStatus, EnergyProduct } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import {
    createInvoiceReviewForm,
    createInvoiceReviewPayload,
    newInvoiceItem,
    type InvoiceReviewForm,
} from '@/lib/invoiceReview'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

const invoices = ref<EnergyInvoice[]>([])
const countries = ref<Country[]>([])
const products = ref<EnergyProduct[]>([])
const page = ref(1)
const lastPage = ref(1)
const isLoading = ref(false)
const isUploading = ref(false)
const isSavingReview = ref(false)
const error = ref<string | null>(null)
const actionError = ref<string | null>(null)
const file = ref<File | null>(null)
const base64Image = ref<string | null>(null)
const uploadCountryId = ref<number | null>(null)
const uploadDate = ref('')
const reviewInvoice = ref<EnergyInvoice | null>(null)
const emptyReviewInvoice: EnergyInvoice = {
    id: 0,
    country_id: null,
    energy_product_id: null,
    image_path: '',
    total_amount_paid: null,
    energy_amount: null,
    energy_unit: null,
    currency_code: null,
    fuel_type: null,
    energy_type: null,
    unit_price: null,
    vendor_name: null,
    invoice_date: null,
    status: 'pending',
    created_at: '',
}
const reviewForm = ref<InvoiceReviewForm>(createInvoiceReviewForm(emptyReviewInvoice, null))

async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
        const response = await energyInvoicesApi.list(page.value)
        invoices.value = response.invoices.data
        page.value = response.invoices.current_page
        lastPage.value = response.invoices.last_page
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar los recibos.'
    } finally {
        isLoading.value = false
    }
}

async function loadCountries(): Promise<void> {
    try {
        countries.value = await countriesApi.list()
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudo cargar el catálogo de países.'
    }
}

onMounted(async () => {
    await Promise.all([load(), loadCountries()])
})

const selectedCountry = computed(() =>
    countries.value.find((country) => country.id === Number(reviewForm.value.country_id)),
)
const availableProducts = computed(() =>
    products.value.filter(
        (product) =>
            product.energy_type === reviewForm.value.energy_type &&
            product.energy_unit === reviewForm.value.energy_unit,
    ),
)
const energyUnits = computed(() =>
    reviewForm.value.energy_type === 'electric'
        ? [{ value: 'kwh', label: 'kWh' }]
        : [
              { value: 'gallons', label: 'Galones' },
              { value: 'litres', label: 'Litros' },
          ],
)

async function setSelectedFile(event: Event): Promise<void> {
    const input = event.target
    file.value = input instanceof HTMLInputElement ? (input.files?.[0] ?? null) : null
    base64Image.value = null
    if (file.value && file.value.size <= 10 * 1024 * 1024) {
        const reader = new FileReader()
        base64Image.value = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result)
                } else {
                    reject(new Error('No se pudo leer la imagen seleccionada.'))
                }
            }
            reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
            reader.readAsDataURL(file.value as File)
        })
    }
}

function updateReviewEnergyType(): void {
    reviewForm.value.energy_unit = reviewForm.value.energy_type === 'electric' ? 'kwh' : 'litres'
    reviewForm.value.energy_product_id = ''
}

function updateReviewCountry(): void {
    reviewForm.value.energy_product_id = ''
    loadProducts()
}

function removeInvoiceItem(index: number): void {
    reviewForm.value.items.splice(index, 1)
}

function previousPage(): void {
    page.value -= 1
    load()
}

function nextPage(): void {
    page.value += 1
    load()
}

const statusSeverity: Record<EnergyInvoiceStatus, 'warn' | 'info' | 'success' | 'danger'> = {
    pending: 'warn',
    processing: 'info',
    review_required: 'warn',
    completed: 'success',
    failed: 'danger',
}

function severityFor(status: EnergyInvoiceStatus): 'warn' | 'info' | 'success' | 'danger' {
    return statusSeverity[status]
}

function labelFor(status: EnergyInvoiceStatus): string {
    return statusLabel[status]
}

const statusLabel: Record<EnergyInvoiceStatus, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    review_required: 'Requiere revisión',
    completed: 'Procesado',
    failed: 'Falló',
}

async function uploadInvoice(): Promise<void> {
    if (!file.value) {
        actionError.value = 'Selecciona una imagen o PDF para continuar.'
        return
    }

    actionError.value = null
    isUploading.value = true

    try {
        if (base64Image.value === null) {
            throw new Error('No se pudo preparar la imagen para el envío.')
        }

        await energyInvoicesApi.upload(base64Image.value, uploadCountryId.value, uploadDate.value || null)
        file.value = null
        base64Image.value = null
        uploadDate.value = ''
        page.value = 1
        await load()
    } catch (uploadError) {
        actionError.value = uploadError instanceof Error ? uploadError.message : 'No se pudo subir el recibo.'
    } finally {
        isUploading.value = false
    }
}

async function openReview(invoice: EnergyInvoice): Promise<void> {
    actionError.value = null
    error.value = null

    try {
        const details = await energyInvoicesApi.show(invoice.id)
        reviewInvoice.value = details
        reviewForm.value = createInvoiceReviewForm(details, uploadCountryId.value)
        await loadProducts()
    } catch (reviewError) {
        error.value = reviewError instanceof Error ? reviewError.message : 'No se pudo abrir el recibo.'
    }
}

async function loadProducts(): Promise<void> {
    products.value = []

    if (!selectedCountry.value) {
        return
    }

    try {
        const response = await countriesApi.energyProducts(selectedCountry.value.code)
        products.value = response.products
    } catch (productsError) {
        actionError.value =
            productsError instanceof Error ? productsError.message : 'No se pudo cargar el catálogo de energía.'
    }
}

async function saveReview(): Promise<void> {
    if (!reviewInvoice.value) {
        return
    }

    actionError.value = null
    isSavingReview.value = true

    try {
        await energyInvoicesApi.review(reviewInvoice.value.id, createInvoiceReviewPayload(reviewForm.value))
        reviewInvoice.value = null
        await load()
    } catch (saveError) {
        actionError.value = saveError instanceof Error ? saveError.message : 'No se pudo guardar la revisión.'
    } finally {
        isSavingReview.value = false
    }
}

async function deleteInvoice(invoice: EnergyInvoice): Promise<void> {
    if (!window.confirm('¿Eliminar este recibo? Esta acción no se puede deshacer.')) {
        return
    }

    error.value = null

    try {
        await energyInvoicesApi.remove(invoice.id)
        if (invoices.value.length === 1 && page.value > 1) {
            page.value -= 1
        }
        await load()
    } catch (deleteError) {
        error.value = deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el recibo.'
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Energía y recibos</h1>
            <p class="mt-1 text-sm text-ink-muted">
                Sube facturas de combustible o carga eléctrica, revisa el OCR y conserva los precios por unidad.
            </p>
        </header>

        <div v-if="error" class="rounded-card border border-line bg-surface p-4 text-sm text-loss" role="alert">
            {{ error }}
        </div>

        <SectionCard
            title="Subir recibo"
            description="La imagen se codifica en Base64 para enviarse al API · JPG, PNG o PDF · máximo 10 MB"
        >
            <form class="grid gap-4 md:grid-cols-2" @submit.prevent="uploadInvoice">
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Archivo
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        required
                        class="field-control field-control--file text-sm"
                        @change="setSelectedFile"
                    />
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    País de compra (opcional)
                    <select v-model.number="uploadCountryId" class="field-control">
                        <option :value="null">Usar país de mi perfil</option>
                        <option v-for="country in countries" :key="country.id" :value="country.id">
                            {{ country.name }}
                        </option>
                    </select>
                </label>
                <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                    Fecha de factura (opcional)
                    <input v-model="uploadDate" type="date" class="field-control" />
                </label>
                <div class="flex items-end">
                    <button
                        type="submit"
                        class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                        :disabled="isUploading"
                    >
                        {{ isUploading ? 'Subiendo…' : 'Subir y procesar' }}
                    </button>
                </div>
            </form>
            <p v-if="actionError" class="mt-4 text-sm text-loss" role="alert">{{ actionError }}</p>
        </SectionCard>

        <SectionCard
            title="Historial de recibos"
            description="El OCR puede necesitar confirmación manual para usar el precio en cálculos."
        >
            <div v-if="isLoading" class="grid place-items-center py-20">
                <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
            </div>

            <template v-else>
                <DataTable :value="invoices" data-key="id" size="small" scrollable responsive-layout="scroll">
                    <Column field="invoice_date" header="Fecha" style="min-width: 125px">
                        <template #body="{ data: row }">{{ formatDate(row.invoice_date) }}</template>
                    </Column>
                    <Column field="vendor_name" header="Proveedor" style="min-width: 145px">
                        <template #body="{ data: row }">
                            <span>{{
                                row.vendor?.commercial_name ??
                                row.vendor?.legal_name ??
                                row.vendor_name ??
                                row.fuel_type ??
                                '—'
                            }}</span>
                            <small v-if="row.vendor?.tax_id ?? row.vendor_tax_id" class="block text-ink-muted">
                                ID: {{ row.vendor?.tax_id ?? row.vendor_tax_id }}
                            </small>
                        </template>
                    </Column>
                    <Column field="total_amount_paid" header="Total" style="min-width: 110px">
                        <template #body="{ data: row }">
                            <span class="tabular">
                                {{
                                    row.total_amount_paid
                                        ? formatCurrency(row.total_amount_paid, row.currency_code ?? undefined)
                                        : '—'
                                }}
                            </span>
                        </template>
                    </Column>
                    <Column field="energy_amount" header="Cantidad" style="min-width: 110px">
                        <template #body="{ data: row }">
                            <span class="tabular">
                                {{
                                    row.energy_amount
                                        ? `${formatNumber(row.energy_amount)} ${row.energy_unit ?? ''}`
                                        : '—'
                                }}
                            </span>
                        </template>
                    </Column>
                    <Column field="unit_price" header="Precio unidad" style="min-width: 120px">
                        <template #body="{ data: row }">
                            <span class="tabular">
                                {{
                                    row.unit_price
                                        ? formatCurrency(row.unit_price, row.currency_code ?? undefined)
                                        : '—'
                                }}
                            </span>
                        </template>
                    </Column>
                    <Column field="status" header="Estado" style="min-width: 150px">
                        <template #body="{ data: row }">
                            <Tag :severity="severityFor(row.status)" :value="labelFor(row.status)" class="text-xs" />
                        </template>
                    </Column>
                    <Column field="created_at" header="Cargado" style="min-width: 140px">
                        <template #body="{ data: row }">
                            <span class="text-ink-muted">{{ formatDate(row.created_at) }}</span>
                        </template>
                    </Column>
                    <Column header="Acciones" style="min-width: 165px">
                        <template #body="{ data: row }">
                            <div class="flex items-center gap-3">
                                <button
                                    v-if="row.status === 'review_required'"
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="openReview(row)"
                                >
                                    Revisar
                                </button>
                                <button
                                    v-else
                                    type="button"
                                    class="text-xs font-medium text-brand hover:underline"
                                    @click="openReview(row)"
                                >
                                    Ver detalle
                                </button>
                                <button
                                    type="button"
                                    class="text-xs font-medium text-loss hover:underline"
                                    @click="deleteInvoice(row)"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <p class="py-10 text-center text-sm text-ink-muted">Todavía no hay recibos registrados.</p>
                    </template>
                </DataTable>

                <div v-if="lastPage > 1" class="mt-4 flex items-center justify-between text-sm text-ink-muted">
                    <span>Página {{ page }} de {{ lastPage }}</span>
                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
                            :disabled="page <= 1"
                            @click="previousPage"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            class="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
                            :disabled="page >= lastPage"
                            @click="nextPage"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </template>
        </SectionCard>

        <div
            v-if="reviewInvoice"
            class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/40 p-4"
            role="presentation"
            @click.self="reviewInvoice = null"
        >
            <section
                class="my-6 w-full max-w-2xl rounded-xl border border-line bg-surface p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
            >
                <h2 id="review-title" class="text-base font-semibold text-ink">
                    {{ reviewInvoice.status === 'review_required' ? 'Revisar datos del recibo' : 'Detalle del recibo' }}
                </h2>
                <p class="mt-1 text-sm text-ink-muted">
                    Confirma los datos extraídos y los productos de la factura. El cliente indicado en el comprobante no
                    se asume como el conductor.
                </p>

                <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="saveReview">
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        País
                        <select
                            v-model="reviewForm.country_id"
                            class="field-control"
                            required
                            @change="updateReviewCountry"
                        >
                            <option value="" disabled>Seleccionar país</option>
                            <option v-for="country in countries" :key="country.id" :value="String(country.id)">
                                {{ country.name }}
                            </option>
                        </select>
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Tipo de energía
                        <select
                            v-model="reviewForm.energy_type"
                            class="field-control"
                            required
                            @change="updateReviewEnergyType"
                        >
                            <option value="regular_gasoline">Gasolina regular</option>
                            <option value="premium_gasoline">Gasolina premium</option>
                            <option value="diesel">Diésel</option>
                            <option value="ethanol">Etanol</option>
                            <option value="lpg">GLP</option>
                            <option value="cng">GNC</option>
                            <option value="electric">Electricidad</option>
                        </select>
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Unidad
                        <select v-model="reviewForm.energy_unit" class="field-control" required>
                            <option v-for="unit in energyUnits" :key="unit.value" :value="unit.value">
                                {{ unit.label }}
                            </option>
                        </select>
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Producto (opcional)
                        <select v-model="reviewForm.energy_product_id" class="field-control">
                            <option value="">Sin producto específico</option>
                            <option v-for="product in availableProducts" :key="product.id" :value="String(product.id)">
                                {{ product.name }}
                            </option>
                        </select>
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Cantidad de energía
                        <input
                            v-model="reviewForm.energy_amount"
                            type="number"
                            min="0.001"
                            step="any"
                            required
                            class="field-control"
                        />
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Precio por unidad
                        <input
                            v-model="reviewForm.unit_price"
                            type="number"
                            min="0.0001"
                            step="any"
                            required
                            class="field-control"
                        />
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Total pagado (opcional)
                        <input
                            v-model="reviewForm.total_amount_paid"
                            type="number"
                            min="0"
                            step="any"
                            class="field-control"
                        />
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                        Fecha de factura
                        <input v-model="reviewForm.invoice_date" type="date" class="field-control" />
                    </label>
                    <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                        Nombre del producto principal (opcional)
                        <input v-model="reviewForm.fuel_type" type="text" maxlength="120" class="field-control" />
                    </label>

                    <fieldset class="grid gap-4 rounded-lg border-line p-4 sm:col-span-2 sm:grid-cols-2">
                        <legend class="px-1 text-sm font-semibold text-ink">Proveedor y estación</legend>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Razón social / proveedor
                            <input v-model="reviewForm.vendor_name" maxlength="255" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Nombre comercial
                            <input v-model="reviewForm.vendor_commercial_name" maxlength="255" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Identificación fiscal
                            <input v-model="reviewForm.vendor_tax_id" maxlength="64" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Dirección del proveedor
                            <input v-model="reviewForm.vendor_address" maxlength="255" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Estación
                            <input v-model="reviewForm.station_name" maxlength="120" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Marca de estación
                            <input v-model="reviewForm.station_brand" maxlength="120" class="field-control" />
                        </label>
                    </fieldset>

                    <fieldset class="grid gap-4 rounded-lg border-line p-4 sm:col-span-2 sm:grid-cols-2">
                        <legend class="px-1 text-sm font-semibold text-ink">Datos del comprobante</legend>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Cliente facturado
                            <input v-model="reviewForm.customer_name" maxlength="255" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Identificación del cliente
                            <input v-model="reviewForm.customer_tax_id" maxlength="64" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Correo del cliente
                            <input
                                v-model="reviewForm.customer_email"
                                type="email"
                                maxlength="255"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Forma de pago
                            <input v-model="reviewForm.payment_method" maxlength="80" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Placa del vehículo
                            <input v-model="reviewForm.vehicle_plate" maxlength="32" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Número de factura
                            <input v-model="reviewForm.invoice_number" maxlength="64" class="field-control" />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                            Número de autorización
                            <input v-model="reviewForm.authorization_number" maxlength="64" class="field-control" />
                        </label>
                    </fieldset>

                    <fieldset class="grid gap-4 rounded-lg border-line p-4 sm:col-span-2 sm:grid-cols-2">
                        <legend class="px-1 text-sm font-semibold text-ink">Totales del comprobante</legend>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Subtotal
                            <input
                                v-model="reviewForm.subtotal_amount"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Impuesto
                            <input
                                v-model="reviewForm.tax_amount"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Tasa de impuesto (%)
                            <input
                                v-model="reviewForm.tax_rate"
                                type="number"
                                min="0"
                                max="100"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Total sin subsidio
                            <input
                                v-model="reviewForm.total_amount_without_subsidy"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                    </fieldset>

                    <fieldset class="grid gap-4 rounded-lg border-line p-4 sm:col-span-2">
                        <legend class="px-1 text-sm font-semibold text-ink">Productos / líneas</legend>
                        <article
                            v-for="(item, index) in reviewForm.items"
                            :key="index"
                            class="grid gap-3 rounded-lg bg-canvas p-3 sm:grid-cols-2"
                        >
                            <h3 class="text-sm font-medium text-ink sm:col-span-2">Producto {{ index + 1 }}</h3>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Descripción
                                <input v-model="item.product_description" maxlength="255" class="field-control" />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Código
                                <input v-model="item.item_code" maxlength="64" class="field-control" />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Cantidad
                                <input v-model="item.quantity" type="number" min="0" step="any" class="field-control" />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Unidad
                                <select v-model="item.quantity_unit" class="field-control">
                                    <option value="">Sin unidad</option>
                                    <option value="gallons">Galones</option>
                                    <option value="litres">Litros</option>
                                    <option value="kwh">kWh</option>
                                </select>
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Precio unitario
                                <input
                                    v-model="item.unit_price"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Precio sin subsidio
                                <input
                                    v-model="item.unit_price_without_subsidy"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Subsidio
                                <input
                                    v-model="item.subsidy_amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Subtotal
                                <input
                                    v-model="item.subtotal_amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Impuesto
                                <input
                                    v-model="item.tax_amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Total
                                <input
                                    v-model="item.total_amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Total sin subsidio
                                <input
                                    v-model="item.total_amount_without_subsidy"
                                    type="number"
                                    min="0"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                                Tasa de impuesto (%)
                                <input
                                    v-model="item.tax_rate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    class="field-control"
                                />
                            </label>
                            <button
                                type="button"
                                class="min-h-11 justify-self-start text-xs font-medium text-loss hover:underline"
                                @click="removeInvoiceItem(index)"
                            >
                                Quitar producto {{ index + 1 }}
                            </button>
                        </article>
                        <p v-if="reviewForm.items.length === 0" class="text-sm text-ink-muted">
                            No hay líneas de producto reconocidas.
                        </p>
                        <button
                            type="button"
                            class="min-h-11 justify-self-start rounded-lg border-line px-3 text-sm font-medium text-brand"
                            @click="reviewForm.items.push(newInvoiceItem())"
                        >
                            Agregar producto
                        </button>
                    </fieldset>

                    <p v-if="actionError" class="text-sm text-loss sm:col-span-2" role="alert">{{ actionError }}</p>

                    <div class="flex justify-end gap-2 sm:col-span-2">
                        <button
                            type="button"
                            class="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted"
                            @click="reviewInvoice = null"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                            :disabled="isSavingReview"
                        >
                            {{ isSavingReview ? 'Guardando…' : 'Guardar revisión' }}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    </div>
</template>
