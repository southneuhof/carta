<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import services from '@/utils/services';
import { inject } from 'vue';
import {Bar} from 'vue-chartjs'
  
  const filter = inject<any>('filter', {})
  const {data} = await services.get('dashboard', {event_type: 'page_view', start_month: filter.value.start_month, end_month: filter.value.end_month})
</script>

<template>
  <Card>
    <p class="text-sm font-semibold text-muted">Kunjungan Halaman</p>
    <div>
      <Bar
        :data="{
          labels: data.map((item: any) =>  item.label),
          datasets: [
            {
              data: data.map((item: any) => item.value),
            }
          ]
        }"
        :height="200"
        :options="{
          maintainAspectRatio: false,
          plugins: {
            legend: {display: false},
            datalabels: {
              anchor: 'end',
              align: 'bottom',
              color: 'black',
            }
          },
          scales: {
            y: {
              ticks: {
                stepSize: 1
              }
            }
          }
        }"
      >
      </Bar>
    </div>
  </Card>
</template>