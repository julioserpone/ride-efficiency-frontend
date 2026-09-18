import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api'
import { clearStoredToken, getStoredToken, storeToken } from '@/api/client'
import type { ApiUser } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<ApiUser | null>(null)
    const token = ref<string | null>(getStoredToken())
    const isLoading = ref(false)

    const isAuthenticated = computed(() => token.value !== null)

    async function login(email: string, password: string): Promise<void> {
        isLoading.value = true

        try {
            const response = await authApi.issueToken(email, password)

            storeToken(response.token)
            token.value = response.token
            user.value = response.user
        } finally {
            isLoading.value = false
        }
    }

    async function logout(): Promise<void> {
        try {
            await authApi.revokeToken()
        } finally {
            clearStoredToken()
            token.value = null
            user.value = null
        }
    }

    return { user, token, isLoading, isAuthenticated, login, logout }
})
