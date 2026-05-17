<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  color: {
    type: String as PropType<'DARK' | 'LIGHT'>,
    required: true,
  },
})

const colorMap: any = {
  DARK: ['#262635', '#17171C', '#404059'],
  LIGHT: ['#9E4E4E', '#7D1E1E', '#963434'],
}
</script>

<template>
  <div class="absolute -z-50 h-[100%] w-full object-cover object-top lg:object-center">
    <svg width="100%" height="50vh" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_3402_282800)">
        <rect width="1500" height="110%" transform="matrix(-1 0 0 1 1500 0)" :fill="colorMap[props.color][0]" />
        <rect x="-23.4928" y="822.153" width="1003.78" height="138.307" transform="rotate(-44.1994 -23.4928 822.153)" :fill="colorMap[props.color][1]" />
        <path d="M-181.022 568.854L133.362 245.869L411.075 245.87L-40.2391 706.723L-181.022 568.854Z" :fill="colorMap[props.color][1]" />
        <rect x="-163.643" y="300.004" width="325.765" height="197.048" transform="rotate(-45.5992 -163.643 300.004)" :fill="colorMap[props.color][2]" />
        <circle cx="1083.86" cy="9.5" r="456.5" :fill="colorMap[props.color][1]" />
        <circle cx="1083.86" cy="9.5" r="321.5" :fill="colorMap[props.color][2]" />
        <path d="M349.362 61L411.362 0V123H288.362L349.362 61Z" :fill="colorMap[props.color][2]" />
        <path d="M349.362 184L411.362 123V246H288.362L349.362 184Z" :fill="colorMap[props.color][1]" />
        <path d="M472.362 61L534.362 0V123H411.362L472.362 61Z" :fill="colorMap[props.color][1]" />
        <path d="M472.362 184L534.362 123V246H411.362L472.362 184Z" :fill="colorMap[props.color][2]" />
        <circle cx="114.362" cy="123" r="123" :fill="colorMap[props.color][1]" />
      </g>
      <defs>
        <clipPath id="clip0_3402_282800">
          <rect width="1500" height="110%" fill="white" />
        </clipPath>
      </defs>
    </svg>
  </div>
</template>
