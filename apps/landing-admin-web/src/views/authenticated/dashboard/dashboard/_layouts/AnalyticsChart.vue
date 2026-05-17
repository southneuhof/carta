<script setup lang="ts">
import services from '@/utils/services';
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue';
import { inject } from 'vue';
import {Bar} from 'vue-chartjs'

  const props = defineProps({
    event_type: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    parseAs: {
      type: String,
    }
  })
  
  const filter = inject<any>('filter', {})
  const {data} = await services.get('dashboard', {event_type: props.event_type, start_month: filter.value.start_month, end_month: filter.value.end_month})
</script>

<template>
  <Card>
    <p class="text-sm font-semibold text-muted">{{ title }}</p>
    <div>
      <Bar
        :data="{
          labels: data.map((item: any) =>  parseAs ? $parse(parseAs, item.label) : item.label),
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
