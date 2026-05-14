import { defineAsyncComponent } from 'vue'

export const componentTypeMap: Record<string, { component?: any; propKeyValue?: [string, string | null][] }> = {
  chip: { component: defineAsyncComponent(() => import('../../base/Chip.vue')) },
  image: {
    component: defineAsyncComponent(() => import('../../base/ImagePreview.vue')),
    propKeyValue: [
      ['thumbnail', 'tumbnail_url'],
      ['url', 'url'],
    ],
  },
  location: {
    component: defineAsyncComponent(() => import('../../base/MapView.vue')),
    propKeyValue: [
      ['lat', 'latitude'],
      ['lng', 'longitude'],
    ],
  },
  file: {
    component: defineAsyncComponent(() => import('../../base/FileComponent.vue')),
    propKeyValue: [
      ['url', 'url'],
      ['filename', 'filename'],
    ],
  },
  lookup: {
    propKeyValue: [['preview', null]],
  },
}

export const parsedTypes = ['date', 'datetime', 'currency', 'number', 'unit', 'default']
