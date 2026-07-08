import { defineAsyncComponent } from 'vue'

export const componentTypeMap: Record<string, { component?: any; propKeyValue?: [string, string | null][] }> = {
  chip: { component: defineAsyncComponent(() => import('../../base/Chip.vue')) },
  image: {
    component: defineAsyncComponent(() => import('../../base/ImagePreview.vue')),
    propKeyValue: [
      ['thumbnailURL', 'thumbnail_url'],
      ['imageURL', 'url'],
    ],
  },
  location: {
    component: defineAsyncComponent(() => import('../../utils/MapView.vue')),
    propKeyValue: [
      ['lat', 'latitude'],
      ['lng', 'longitude'],
    ],
  },
  file: {
    component: defineAsyncComponent(() => import('../../utils/FileComponent.vue')),
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
