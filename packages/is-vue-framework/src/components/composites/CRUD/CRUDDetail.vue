<script setup lang="ts">
import { provide, ref } from 'vue'
import { buildDetailConfig, type ModelConfig } from '@southneuhof/is-data-model'
import Detail from '../Detail.vue'
import { useRoute, useRouter } from 'vue-router'
import { defaultOnExport } from '@southneuhof/is-vue-framework/behaviors/crudDetail'
import { useVueToPrint } from 'vue-to-print'
import { parse } from '@southneuhof/is-vue-framework/utils/parse'
import { defaultDetailConfig } from '@southneuhof/is-vue-framework/adapters/defaults'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'

const props = defineProps<{
  config: ModelConfig
  permissions: CRUDPermissions
}>()

const [route, router] = [useRoute(), useRouter()]

const detailConfig: DetailConfig = {
  ...buildDetailConfig(props.config, {
    fieldsAlias: defaultDetailConfig.fieldsAlias,
    fieldsParse: defaultDetailConfig.fieldsParse,
    fieldsProxy: defaultDetailConfig.fieldsProxy,
    fieldsType: defaultDetailConfig.fieldsType,
  }),
  dataID: String(route.query[`${props.config.name}_id`]),
}

// const exportConfig: CRUDDetailProps['export'] & Partial<CRUDDetailProps> = {
//   routeName: props.config.detail?.export?.routeName || props.config.model || props.config.getAPI || props.config.name || String(route.name),
//   model: props.config.model || props.config.getAPI || props.config.name || String(route.name),
//   allow: props.config.detail?.export?.allow,
//   fieldsAlias: detailConfig.fieldsAlias,
//   fieldsDictionary: detailConfig.fieldsDictionary,
//   fieldsParse: detailConfig.fieldsParse,
//   fieldsProxy: detailConfig.fieldsProxy,
//   fieldsType: detailConfig.fieldsType,
//   fieldsUnit: detailConfig.fieldsUnit,
//   layout: props.config.detail?.export?.layout
// }

const activeData = ref()
const detailExportRef = ref()

function loadActiveData(data: any) {
  activeData.value = data
}

provide('onDataLoaded', loadActiveData)
provide('data', activeData)

const { handlePrint } = useVueToPrint({
  content: detailExportRef,
  documentTitle: `${props.config.title || route.meta.title}-${parse('datetime', new Date().toJSON())}`,
  pageStyle: `
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
    }

    .flex {
      display: flex;
    }

    .flex-col {
      flex-direction: column;
    }

    .flex-row {
      flex-direction: row;
    }

    .items-center {
      align-items: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .font-semibold {
      font-weight: 600;
    }

    .w-\\[1\\%\\] {
      width: 1%;
    }

    .max-w-\\[300px\\] {
      max-width: 300px;
    }

    .whitespace-nowrap {
      white-space: nowrap;
    }

    .px-4 {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .py-2 {
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }

    .text-start {
      text-align: start;
    }

    p {
      margin: 0;
    }

    .gap-6 {
      gap: 1.5rem;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    .gap-4 {
      gap: 1rem;
    }

    td, th {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }

    th {
      opacity: 33%;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-xl {
      font-size: 1.25rem;
      line-height: 1.75rem;
    }

    .italic {
      font-style: italic;
    }

    .text-sm {
      font-size: 0.875rem /* 14px */;
      line-height: 1.25rem /* 20px */;
    }

    .gap-1 {
      gap: 0.25rem /* 4px */;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    img {
      page-break-before: auto;
      page-break-after: auto;
      page-break-inside: avoid;
    }
    
    .h-fit {
      height: fit-content;
    }

    .min-w-max {
      min-width: max-content;
    }

    .w-fit {
      width: fit-content;
    }

    .rounded-lg {
      border-radius: 0.5rem;
    }

    .px-2 {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    .py-1 {
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }

    .text-center {
      text-align: center;
    }

    .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .whitespace-pre-line {
      white-space: pre-line;
    }

    .font-normal {
      font-weight: 400;
    }
  `,
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <slot v-if="$slots['detail-header']" name="detail-header"></slot>
    <Card v-else class="flex flex-row items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-4">
        <Button
          @click="() => ($route.query['redirected'] == 'true' ? $router.back() : $router.push({ query: { ...$route.query, [`${config.name}_view`]: 'list' } }))"
          kind="icon" variant="standard"
          size="square"
          class="max-w-fit"
        >
          <template #icon>
            <Icon name="arrow-left" />
          </template>
        </Button>
        <div class="min-w-max text-xl">Detail {{ config.title || $route.meta.title }}</div>
      </div>
      <div v-if="activeData" class="flex flex-row items-center gap-2">
        <template v-if="detailConfig.export?.allow">
          <Button
            v-if="typeof detailConfig.export.allow === 'boolean' ? detailConfig.export.allow : ((detailConfig.export as any).allow as any)(activeData)"
            @click="() => handlePrint()"
            variant="tonal"
            color="success"
            >Download Bukti Kerja<Icon name="download"></Icon
          ></Button>
        </template>
        <slot v-if="$slots['detail-header-action'] && activeData" name="detail-header-action" v-bind="{ data: activeData }" />
      </div>
    </Card>
    <Transition name="vfade" mode="out-in">
      <Suspense :timeout="0">
        <template #fallback>
          <div class="flex items-center justify-center">
            <Spinner />
          </div>
        </template>
        <slot v-if="$slots['detail-view']" name="detail-view" />
        <Card
          v-else
          :class="{ 'grid grid-cols-2 gap-8': !!$slots['detail-side-right'] || !!$slots['detail-side-left'], '!grid-cols-3': !!$slots['detail-side-right'] && !!$slots['detail-side-left'] }"
        >
          <slot v-if="$slots['detail-inner-header'] && activeData" name="detail-inner-header" v-bind="{ data: activeData }" />
          <div v-if="$slots['detail-side-left'] && activeData" class="left h-full w-full">
            <slot name="detail-side-left" v-bind="{ data: activeData }" />
          </div>
          <div class="flex flex-col gap-4">
            <slot v-if="$slots['detail-above'] && activeData" name="detail-above" v-bind="{ data: activeData }" />
            <hr v-if="$slots['detail-above'] && activeData" />
            <Suspense v-if="$slots['detail-main']">
              <slot name="detail-main"></slot>
            </Suspense>
            <Detail v-else v-bind="(detailConfig as any)" :onDataLoaded="(data: any) => activeData = data">
              <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
                <slot v-if="slotname.slice(0, 7) === 'detail-'" :name="slotname" v-bind="(data as any)"></slot>
              </template>
            </Detail>
            <slot v-if="$slots['detail-inner-under'] && activeData" name="detail-inner-under" v-bind="{ data: activeData }" />
          </div>
          <div v-if="$slots['detail-side-right'] && activeData" class="right h-full w-full">
            <slot name="detail-side-right" v-bind="{ data: activeData }" />
          </div>
          <div v-if="$slots['detail-inner-below'] && activeData" class="col-span-2">
            <slot name="detail-inner-below" v-bind="{ data: activeData }" />
          </div>
        </Card>
      </Suspense>
    </Transition>
    <div v-if="$slots['detail-under']">
      <Suspense v-if="activeData">
        <slot name="detail-under" v-bind="{ data: activeData }"></slot>
      </Suspense>
    </div>
  </div></template>
