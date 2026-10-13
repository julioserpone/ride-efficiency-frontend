<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'

import { countriesApi, rideTripsApi, shiftsApi, vehiclesApi } from '@/api'
import type { Country, DailyShift, RideTrip, Vehicle } from '@/api/types'
import SectionCard from '@/components/SectionCard.vue'
import { formatCurrency, formatDate, formatNumber, toNumber } from '@/lib/format'

const countries = ref<Country[]>([])
const vehicles = ref<Vehicle[]>([])
const trips = ref<RideTrip[]>([])
const shifts = ref<DailyShift[]>([])
const selectedTrip = ref<RideTrip | null>(null)
const vehiclePage = ref(1)
const vehicleLastPage = ref(1)
const tripPage = ref(1)
const tripLastPage = ref(1)
const isLoading = ref(false)
const isCreatingVehicle = ref(false)
const isCreatingTrip = ref(false)
const error = ref<string | null>(null)
const vehicleMessage = ref<string | null>(null)
const tripMessage = ref<string | null>(null)
const energyTypes = [
    { value: 'regular_gasoline', label: 'Gasolina regular' },
    { value: 'premium_gasoline', label: 'Gasolina premium' },
    { value: 'diesel', label: 'Diésel' },
    { value: 'ethanol', label: 'Etanol' },
    { value: 'lpg', label: 'GLP' },
    { value: 'cng', label: 'GNC' },
    { value: 'electric', label: 'Electricidad' },
]

const vehicleForm = ref({
    country_id: '',
    name: '',
    energy_type: 'regular_gasoline',
    energy_unit: 'gallons',
    energy_economy: '',
    commission_rate: '',
})

const tripForm = ref({
    vehicle_id: '',
    platform_name: '',
    gross_fare: '',
    distance_km: '',
    deadhead_distance_km: '',
    duration_minutes: '',
    commission_rate: '',
    other_costs_per_trip: '',
    energy_price_per_unit: '',
    daily_shift_id: '',
})

const vehicleEnergyUnits = computed(() =>
    vehicleForm.value.energy_type === 'electric'
        ? [{ value: 'kwh', label: 'kWh por 100 km' }]
        : [
              { value: 'gallons', label: 'km por galón' },
              { value: 'litres', label: 'km por litro' },
          ],
)

const selectedVehicle = computed(() =>
    vehicles.value.find((vehicle) => vehicle.id === Number(tripForm.value.vehicle_id)),
)
const selectedCountry = computed(() =>
    countries.value.find((country) => country.id === Number(vehicleForm.value.country_id)),
)
const tripCurrency = computed(() => selectedVehicle.value?.country.currency_code ?? 'USD')

function updateVehicleEnergyType(): void {
    vehicleForm.value.energy_unit = vehicleForm.value.energy_type === 'electric' ? 'kwh' : 'litres'
}

function previousVehiclePage(): void {
    vehiclePage.value -= 1
    loadVehicles()
}

function nextVehiclePage(): void {
    vehiclePage.value += 1
    loadVehicles()
}

function previousTripPage(): void {
    tripPage.value -= 1
    loadTrips()
}

function nextTripPage(): void {
    tripPage.value += 1
    loadTrips()
}

onMounted(async () => {
    isLoading.value = true
    error.value = null

    const results = await Promise.allSettled([
        countriesApi.list(),
        vehiclesApi.list(vehiclePage.value),
        rideTripsApi.list(tripPage.value),
        shiftsApi.list(),
    ])

    const errors: string[] = []
    const [countryResult, vehicleResult, tripResult, shiftResult] = results

    if (countryResult.status === 'fulfilled') countries.value = countryResult.value
    else errors.push('países')

    if (vehicleResult.status === 'fulfilled') {
        vehicles.value = vehicleResult.value.vehicles.data
        vehicleLastPage.value = vehicleResult.value.vehicles.last_page
    } else errors.push('vehículos')

    if (tripResult.status === 'fulfilled') {
        trips.value = tripResult.value.trips.data
        tripLastPage.value = tripResult.value.trips.last_page
    } else errors.push('viajes')

    if (shiftResult.status === 'fulfilled') shifts.value = shiftResult.value.shifts.data
    else errors.push('turnos')

    if (errors.length > 0) {
        error.value = `No se pudieron cargar: ${errors.join(', ')}.`
    }

    isLoading.value = false
})

async function loadVehicles(): Promise<void> {
    try {
        const response = await vehiclesApi.list(vehiclePage.value)
        vehicles.value = response.vehicles.data
        vehicleLastPage.value = response.vehicles.last_page
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar los vehículos.'
    }
}

async function loadTrips(): Promise<void> {
    try {
        const response = await rideTripsApi.list(tripPage.value)
        trips.value = response.trips.data
        tripLastPage.value = response.trips.last_page
    } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : 'No se pudieron cargar los viajes.'
    }
}

async function createVehicle(): Promise<void> {
    vehicleMessage.value = null
    error.value = null
    isCreatingVehicle.value = true

    try {
        const response = await vehiclesApi.create({
            country_id: Number(vehicleForm.value.country_id),
            name: vehicleForm.value.name,
            energy_type: vehicleForm.value.energy_type,
            energy_unit: vehicleForm.value.energy_unit,
            energy_economy: Number(vehicleForm.value.energy_economy),
            commission_rate: vehicleForm.value.commission_rate ? Number(vehicleForm.value.commission_rate) : null,
        })
        vehicleMessage.value = `${response.vehicle.name} quedó registrado.`
        vehicleForm.value.name = ''
        vehicleForm.value.energy_economy = ''
        vehicleForm.value.commission_rate = ''
        vehiclePage.value = 1
        await loadVehicles()
    } catch (createError) {
        vehicleMessage.value = createError instanceof Error ? createError.message : 'No se pudo crear el vehículo.'
    } finally {
        isCreatingVehicle.value = false
    }
}

async function createTrip(): Promise<void> {
    tripMessage.value = null
    error.value = null
    isCreatingTrip.value = true

    const payload: Record<string, string | number | null> = {
        platform_name: tripForm.value.platform_name,
        gross_fare: Number(tripForm.value.gross_fare),
        distance_km: Number(tripForm.value.distance_km),
    }
    const optionalNumbers: Array<[keyof typeof tripForm.value, string]> = [
        ['deadhead_distance_km', 'deadhead_distance_km'],
        ['duration_minutes', 'duration_minutes'],
        ['commission_rate', 'commission_rate'],
        ['other_costs_per_trip', 'other_costs_per_trip'],
        ['energy_price_per_unit', 'energy_price_per_unit'],
        ['daily_shift_id', 'daily_shift_id'],
    ]

    for (const [formKey, apiKey] of optionalNumbers) {
        const value = tripForm.value[formKey]
        if (value !== '' && value !== 'vehicle_id' && value !== 'platform_name') {
            payload[apiKey] = Number(value)
        }
    }

    try {
        const response = await rideTripsApi.create(Number(tripForm.value.vehicle_id), payload)
        selectedTrip.value = response.trip
        tripMessage.value = `Viaje registrado · utilidad neta ${formatCurrency(response.trip.net_profit, response.trip.currency_code)}.`
        tripForm.value.platform_name = ''
        tripForm.value.gross_fare = ''
        tripForm.value.distance_km = ''
        tripForm.value.deadhead_distance_km = ''
        tripForm.value.duration_minutes = ''
        tripForm.value.commission_rate = ''
        tripForm.value.other_costs_per_trip = ''
        tripForm.value.energy_price_per_unit = ''
        tripForm.value.daily_shift_id = ''
        tripPage.value = 1
        await loadTrips()
    } catch (createError) {
        tripMessage.value = createError instanceof Error ? createError.message : 'No se pudo calcular el viaje.'
    } finally {
        isCreatingTrip.value = false
    }
}

async function showTrip(trip: RideTrip): Promise<void> {
    error.value = null

    try {
        selectedTrip.value = await rideTripsApi.show(trip.id)
    } catch (detailError) {
        error.value = detailError instanceof Error ? detailError.message : 'No se pudo cargar el detalle del viaje.'
    }
}

function formatProfit(trip: RideTrip): string {
    return formatCurrency(trip.net_profit, trip.currency_code)
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <header>
            <h1 class="text-xl font-semibold text-ink">Vehículos y viajes</h1>
            <p class="mt-1 text-sm text-ink-muted">
                Configura el consumo de cada vehículo y calcula la utilidad real por viaje y plataforma.
            </p>
        </header>

        <div v-if="error" class="rounded-card border border-line bg-surface p-4 text-sm text-loss" role="alert">
            {{ error }}
        </div>

        <div v-if="isLoading" class="grid place-items-center py-10">
            <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="4" />
        </div>

        <template v-else>
            <div class="grid gap-6 xl:grid-cols-2">
                <SectionCard
                    title="Registrar vehículo"
                    description="El consumo debe expresarse en la unidad de energía seleccionada."
                >
                    <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="createVehicle">
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                            País
                            <select v-model="vehicleForm.country_id" class="field-control" required>
                                <option value="" disabled>Seleccionar país</option>
                                <option v-for="country in countries" :key="country.id" :value="String(country.id)">
                                    {{ country.name }} · {{ country.currency_code }}
                                </option>
                            </select>
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                            Nombre del vehículo
                            <input
                                v-model="vehicleForm.name"
                                type="text"
                                maxlength="100"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Energía
                            <select
                                v-model="vehicleForm.energy_type"
                                class="field-control"
                                @change="updateVehicleEnergyType"
                            >
                                <option v-for="type in energyTypes" :key="type.value" :value="type.value">
                                    {{ type.label }}
                                </option>
                            </select>
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Unidad
                            <select v-model="vehicleForm.energy_unit" class="field-control">
                                <option v-for="unit in vehicleEnergyUnits" :key="unit.value" :value="unit.value">
                                    {{ unit.label }}
                                </option>
                            </select>
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            {{
                                vehicleForm.energy_unit === 'kwh'
                                    ? 'Kilómetros por kWh'
                                    : `Kilómetros por ${vehicleForm.energy_unit === 'gallons' ? 'galón' : 'litro'}`
                            }}
                            <input
                                v-model="vehicleForm.energy_economy"
                                type="number"
                                min="0.0001"
                                max="1000"
                                step="any"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Comisión de plataforma (% opcional)
                            <input
                                v-model="vehicleForm.commission_rate"
                                type="number"
                                min="0"
                                max="100"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <p v-if="vehicleMessage" class="text-sm text-ink-muted sm:col-span-2" role="status">
                            {{ vehicleMessage }}
                        </p>
                        <button
                            type="submit"
                            class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
                            :disabled="isCreatingVehicle || !selectedCountry"
                        >
                            {{ isCreatingVehicle ? 'Guardando…' : 'Guardar vehículo' }}
                        </button>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Calcular viaje"
                    description="Si hay una factura completada compatible, el API usa su precio por defecto."
                >
                    <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="createTrip">
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                            Vehículo
                            <select v-model="tripForm.vehicle_id" class="field-control" required>
                                <option value="" disabled>Seleccionar vehículo</option>
                                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="String(vehicle.id)">
                                    {{ vehicle.name }} · {{ vehicle.country.name }}
                                </option>
                            </select>
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Plataforma
                            <input
                                v-model="tripForm.platform_name"
                                type="text"
                                maxlength="100"
                                required
                                class="field-control"
                                placeholder="Uber, DiDi…"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Ingreso bruto ({{ tripCurrency }})
                            <input
                                v-model="tripForm.gross_fare"
                                type="number"
                                min="0"
                                step="any"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Distancia con pasajero (km)
                            <input
                                v-model="tripForm.distance_km"
                                type="number"
                                min="0.001"
                                step="any"
                                required
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Distancia sin pasajero (km)
                            <input
                                v-model="tripForm.deadhead_distance_km"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Duración (minutos)
                            <input
                                v-model="tripForm.duration_minutes"
                                type="number"
                                min="0"
                                step="1"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Comisión (% opcional)
                            <input
                                v-model="tripForm.commission_rate"
                                type="number"
                                min="0"
                                max="100"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Otros costos ({{ tripCurrency }})
                            <input
                                v-model="tripForm.other_costs_per_trip"
                                type="number"
                                min="0"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                            Precio de energía por unidad (opcional)
                            <input
                                v-model="tripForm.energy_price_per_unit"
                                type="number"
                                min="0.0001"
                                step="any"
                                class="field-control"
                            />
                        </label>
                        <label class="flex flex-col gap-1.5 text-xs font-medium text-ink-muted sm:col-span-2">
                            Asociar a turno (opcional)
                            <select v-model="tripForm.daily_shift_id" class="field-control">
                                <option value="">Sin asociar</option>
                                <option v-for="shift in shifts" :key="shift.id" :value="String(shift.id)">
                                    {{ formatDate(shift.shift_date) }}
                                </option>
                            </select>
                        </label>
                        <p v-if="tripMessage" class="text-sm text-ink-muted sm:col-span-2" role="status">
                            {{ tripMessage }}
                        </p>
                        <button
                            type="submit"
                            class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
                            :disabled="isCreatingTrip || vehicles.length === 0"
                        >
                            {{ isCreatingTrip ? 'Calculando…' : 'Calcular rentabilidad' }}
                        </button>
                    </form>
                </SectionCard>
            </div>

            <SectionCard title="Vehículos" description="Perfiles activos registrados">
                <DataTable :value="vehicles" data-key="id" size="small" scrollable responsive-layout="scroll">
                    <Column field="name" header="Vehículo" style="min-width: 150px" />
                    <Column header="País" style="min-width: 140px">
                        <template #body="{ data: row }"
                            >{{ row.country.name }} ({{ row.country.currency_code }})</template
                        >
                    </Column>
                    <Column header="Energía" style="min-width: 150px">
                        <template #body="{ data: row }"
                            >{{ row.energy_type.replaceAll('_', ' ') }} · {{ row.energy_unit }}</template
                        >
                    </Column>
                    <Column header="Consumo" style="min-width: 125px">
                        <template #body="{ data: row }">
                            <span class="tabular"
                                >{{ formatNumber(row.energy_economy) }}
                                {{
                                    row.energy_unit === 'kwh'
                                        ? 'km/kWh'
                                        : `km/${row.energy_unit === 'gallons' ? 'gal' : 'L'}`
                                }}</span
                            >
                        </template>
                    </Column>
                    <template #empty>
                        <p class="py-8 text-center text-sm text-ink-muted">Todavía no hay vehículos registrados.</p>
                    </template>
                </DataTable>
                <div v-if="vehicleLastPage > 1" class="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
                        :disabled="vehiclePage <= 1"
                        @click="previousVehiclePage"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
                        :disabled="vehiclePage >= vehicleLastPage"
                        @click="nextVehiclePage"
                    >
                        Siguiente
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Viajes calculados" description="Detalle del cálculo disponible en cada fila">
                <DataTable :value="trips" data-key="id" size="small" scrollable responsive-layout="scroll">
                    <Column field="created_at" header="Fecha" style="min-width: 140px">
                        <template #body="{ data: row }">{{ formatDate(row.created_at) }}</template>
                    </Column>
                    <Column field="platform_name" header="Plataforma" style="min-width: 130px" />
                    <Column header="Vehículo" style="min-width: 140px">
                        <template #body="{ data: row }">{{ row.vehicle?.name ?? `#${row.vehicle_id}` }}</template>
                    </Column>
                    <Column field="distance_km" header="Km" style="min-width: 85px">
                        <template #body="{ data: row }">{{ formatNumber(row.distance_km) }}</template>
                    </Column>
                    <Column header="Neto" style="min-width: 120px">
                        <template #body="{ data: row }">
                            <span
                                class="tabular font-medium"
                                :class="toNumber(row.net_profit) < 0 ? 'text-loss' : 'text-profit'"
                            >
                                {{ formatProfit(row) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="verdict" header="Veredicto" style="min-width: 110px">
                        <template #body="{ data: row }">
                            <Tag
                                :severity="
                                    row.verdict === 'accept'
                                        ? 'success'
                                        : row.verdict === 'marginal'
                                          ? 'warn'
                                          : 'danger'
                                "
                                :value="row.verdict"
                                class="text-xs"
                            />
                        </template>
                    </Column>
                    <Column header="Detalle" style="min-width: 95px">
                        <template #body="{ data: row }">
                            <button
                                type="button"
                                class="text-xs font-medium text-brand hover:underline"
                                @click="showTrip(row)"
                            >
                                Ver detalle
                            </button>
                        </template>
                    </Column>
                    <template #empty>
                        <p class="py-8 text-center text-sm text-ink-muted">Todavía no hay viajes calculados.</p>
                    </template>
                </DataTable>
                <div v-if="tripLastPage > 1" class="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
                        :disabled="tripPage <= 1"
                        @click="previousTripPage"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        class="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
                        :disabled="tripPage >= tripLastPage"
                        @click="nextTripPage"
                    >
                        Siguiente
                    </button>
                </div>
            </SectionCard>
        </template>

        <div
            v-if="selectedTrip"
            class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/40 p-4"
            role="presentation"
            @click.self="selectedTrip = null"
        >
            <section
                class="my-6 w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="trip-detail-title"
            >
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 id="trip-detail-title" class="text-base font-semibold text-ink">Rentabilidad del viaje</h2>
                        <p class="mt-1 text-sm text-ink-muted">
                            {{ selectedTrip.platform_name }} · {{ selectedTrip.vehicle?.name ?? 'Vehículo' }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="text-sm text-ink-muted"
                        aria-label="Cerrar detalle"
                        @click="selectedTrip = null"
                    >
                        Cerrar
                    </button>
                </div>
                <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt class="text-xs text-ink-muted">Ingreso bruto</dt>
                        <dd class="tabular mt-1 font-medium">
                            {{ formatCurrency(selectedTrip.gross_fare, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Utilidad neta</dt>
                        <dd class="tabular mt-1 font-medium text-profit">{{ formatProfit(selectedTrip) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Energía</dt>
                        <dd class="tabular mt-1">
                            {{ formatCurrency(selectedTrip.energy_cost, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Comisión</dt>
                        <dd class="tabular mt-1">
                            {{ formatCurrency(selectedTrip.commission_cost, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Depreciación</dt>
                        <dd class="tabular mt-1">
                            {{ formatCurrency(selectedTrip.depreciation_cost, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Otros costos</dt>
                        <dd class="tabular mt-1">
                            {{ formatCurrency(selectedTrip.other_costs, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Punto de equilibrio</dt>
                        <dd class="tabular mt-1">
                            {{ formatCurrency(selectedTrip.break_even_fare, selectedTrip.currency_code) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-ink-muted">Veredicto</dt>
                        <dd class="mt-1 capitalize">{{ selectedTrip.verdict }}</dd>
                    </div>
                </dl>
            </section>
        </div>
    </div>
</template>
