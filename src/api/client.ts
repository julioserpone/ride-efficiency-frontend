import axios, { type AxiosInstance } from 'axios'

const TOKEN_STORAGE_KEY = 'ride_efficiency_token'

export const apiBaseUrl: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost/api/v1'

/**
 * The bearer token is kept in localStorage so a page reload does not force
 * a new login. It is revoked server-side on logout.
 */
export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const http: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        Accept: 'application/json',
    },
})

http.interceptors.request.use((config) => {
    const token = getStoredToken()

    if (token !== null) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

/**
 * On a 401 the token is stale or revoked — drop it so the router guard
 * sends the user back to the login screen.
 */
http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearStoredToken()
        }

        return Promise.reject(error)
    },
)
