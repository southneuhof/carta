import services from '@/utils/services'
import { defineComponent } from 'vue'
import ImagePreview from '@southneuhof/is-vue-framework/components/base/ImagePreview.vue'
import {h} from 'vue'
import { commonFieldTypes } from './commonFieldTypes'

export async function getData(getAPI: string, searchParameters?: Record<string, any>) {
  const {data, meta: {totalPages, totalRecords}} = await services.list(getAPI, searchParameters)
  return { data, totalPage: totalPages, total: totalRecords }
}

export function onDataLoaded() {
  return
}

export const fieldTypes: Record<string, any> = {
  ...commonFieldTypes
}
