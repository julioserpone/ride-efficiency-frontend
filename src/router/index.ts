import { createRouter, createWebHistory } from 'vue-router'

import { getStoredToken } from '@/api/client'

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
            meta: { title: 'Recibos' },
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: { name: 'overview' },
        },
    ],
})

router.beforeEach((to) => {
    const hasToken = getStoredToken() !== null

    if (to.meta.public !== true && !hasToken) {
        return { name: 'login' }
    }

    if (to.meta.public === true && hasToken) {
        return { name: 'overview' }
    }

    return true
})

export default router
