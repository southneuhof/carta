import { defineAsyncComponent } from 'vue'

export function composeInputTemplateSheet() {
  throw new Error('[vue-framework] composeInputTemplateSheet is not implemented yet. Pass custom implementation explicitly.')
}

export const bulkCreateFormProps: any = {
  fields: ['data'],
  fieldsAlias: { data: 'File' },
  inputConfig: {
    data: {
      type: 'custom',
      component: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/composites/CRUD/_layouts/SpreadsheetReader.vue')),
      props: { required: true },
    },
  },
}
