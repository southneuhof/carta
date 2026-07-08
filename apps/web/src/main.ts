import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configureParser, parse } from '@southneuhof/utilities/parse'
import { createFrameworkPlugin, createIsApiClient, installIsApiClient } from '@southneuhof/is-vue-framework'
import { frameworkBehaviors } from './framework/behaviors'
import { dictionary } from '@/configs/dictionary'
import App from './App.vue'
import router from './router'
import '@vuepic/vue-datepicker/dist/main.css'
import './assets/main.css'
import 'vue-sonner/style.css'
import 'remixicon/fonts/remixicon.css'
import { Chart } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import annotationPlugin from 'chartjs-plugin-annotation'
import { LinearScale, CategoryScale, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { FunnelController, TrapezoidElement } from 'chartjs-chart-funnel'
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css' // optional for styling

Chart.register(ChartDataLabels)
Chart.register(ArcElement, Tooltip, Legend, Title)

const myColorPalette = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#2ecc71', '#e67e22', '#1abc9c']

Chart.defaults.set('elements.line', { borderWidth: 1 })

Chart.defaults.set('plugins.datalabels', {
  display: (context: any) => {
    return context.dataset.data[context.dataIndex] !== 0 ? 'auto' : false
  },
  clip: false, // Prevent datalabels from overflowing outside the chart area
  clamp: true,
})

Chart.defaults.set({
  backgroundColor: myColorPalette,
  animation: false,
})

Chart.register(annotationPlugin)
Chart.register(FunnelController, TrapezoidElement, LinearScale, CategoryScale)

const app = createApp(App)
configureParser({ dictionary })
const apiUrl = (() => {
  const raw = import.meta.env.VITE_API_URL || ''
  return raw && !raw.endsWith('/') ? `${raw}/` : raw
})()

declare module 'vue' {
  export interface ComponentCustomProperties {
    $parse: (key: string, value: string | number, mode?: 'dictionary' | 'parser') => any
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  app.use(createPinia())
  app.use(router)
  app.use(
    createFrameworkPlugin({
      behaviors: frameworkBehaviors,
    }),
  )
  installIsApiClient(app, createIsApiClient(apiUrl))
  app.use(
    VueTippy,
    // optional
    {
      directive: 'tippy', // => v-tippy
      component: 'tippy', // => <tippy/>
      componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
      defaultProps: {
        placement: 'top',
        allowHTML: true,
      }, // => Global default options * see all props
    }
  )
  app.config.globalProperties.$parse = parse

  app.config.errorHandler = (err, vm, info) => {
    console.error('Global error handler :: ', err)
    // Handle the error (e.g., log it, show a notification, etc.)
  }

  await router.isReady()
  app.mount('#app')
})
