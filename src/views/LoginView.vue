<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)

async function handleSubmit(): Promise<void> {
    errorMessage.value = null

    try {
        await auth.login(email.value, password.value)
        await router.push({ name: 'overview' })
    } catch {
        errorMessage.value = 'Credenciales inválidas. Verifica tu correo y contraseña.'
    }
}
</script>

<template>
    <div class="w-full max-w-sm rounded-card border-line bg-surface p-8">
        <div class="mb-6 flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-profit text-sm font-semibold text-white">
                RE
            </span>
            <div>
                <h1 class="text-base font-semibold text-ink">Ride Efficiency</h1>
                <p class="text-xs text-ink-muted">Panel de rentabilidad</p>
            </div>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-1.5">
                <label for="email" class="text-xs font-medium text-ink-muted">Correo electrónico</label>
                <InputText
                    id="email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    placeholder="tu@correo.com"
                    required
                    fluid
                />
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="password" class="text-xs font-medium text-ink-muted">Contraseña</label>
                <InputText
                    id="password"
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="••"
                    required
                    fluid
                />
            </div>

            <Message v-if="errorMessage" severity="error" :closable="false" class="text-xs">
                {{ errorMessage }}
            </Message>

            <Button type="submit" label="Entrar" :loading="auth.isLoading" class="mt-1 w-full" />
        </form>
    </div>
</template>
