<script setup lang="ts">
import { parse } from '@/utils/common';
import services from '@/utils/services';
import { inject } from 'vue';
import {Bar} from 'vue-chartjs'
  
  const filter = inject<any>('filter', {})
  const {data} = await services.get('dashboard', {event_type: 'website_visit', start_month: filter.value.start_month, end_month: filter.value.end_month})
</script>

<template>
  <Card>
    <p class="text-sm font-semibold text-muted">Kunjungan Website</p>
    <div>
      <Bar
        :data="{
          labels: data.map((item: any) =>  parse('month', item.label)),
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