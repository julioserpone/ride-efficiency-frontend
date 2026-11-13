import { createRouter, createWebHistory } from 'vue-router'

import { clearStoredToken, getStoredToken } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: { layout: 'blank', public: true },
        },
        {
            path: '/',
            name: 'overview',
            component: () => import('@/views/OverviewView.vue'),
            meta: { title: 'Resumen' },
        },
        {
            path: '/shifts',
            name: 'shifts',
            component: () => import('@/views/ShiftsView.vue'),
            meta: { title: 'Turnos' },
        },
        {
            path: '/invoices',
            name: 'invoices',
            component: () => import('@/views/InvoicesView.vue'),
            meta: { title: 'Energía y recibos' },
        },
        {
            path: '/vehicles',
            name: 'vehicles',
            component: () => import('@/views/FleetView.vue'),
            props: { focus: 'vehicles' },
            meta: { title: 'Vehículos' },
        },
        {
            path: '/trips',
            name: 'trips',
            component: () => import('@/views/FleetView.vue'),
            props: { focus: 'trips' },
            meta: { title: 'Viajes' },
        },
        {
            path: '/fleet',
            redirect: { name: 'vehicles' },
        },
        {
            path: '/offers',
            name: 'offers',
            component: () => import('@/views/OffersView.vue'),
            meta: { title: 'Ofertas' },
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: { name: 'overview' },
        },
    ],
})

router.beforeEach(async (to) => {
    const hasToken = getStoredToken() !== null

    if (to.meta.public !== true && !hasToken) {
        return { name: 'login' }
    }

    if (to.meta.public === true && hasToken) {
        return { name: 'overview' }
    }

    if (to.meta.public !== true && hasToken) {
        const auth = useAuthStore()

        if (auth.user === null) {
            try {
                await auth.loadCurrentUser()
            } catch {
                auth.token = null
                auth.user = null
                clearStoredToken()
                return { name: 'login' }
            }
        }
    }

    return true
})

export default router
