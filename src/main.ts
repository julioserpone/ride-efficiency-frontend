import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

import App from './App.vue'
import router from './router'

import './assets/main.css'

const Harbor = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#f0f7f6',
            100: '#e7f2f0',
            200: '#cfe5e2',
            300: '#a8cfca',
            400: '#6da79f',
            500: '#336b67',
            600: '#2d605c',
            700: '#275753',
            800: '#1e4643',
            900: '#173a38',
            950: '#0d2826',
        },
    },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Harbor,
        options: {
            darkModeSelector: false,
            cssLayer: false,
        },
    },
    ripple: false,
})
app.use(ToastService)
app.use(VueApexCharts)

app.mount('#app')
