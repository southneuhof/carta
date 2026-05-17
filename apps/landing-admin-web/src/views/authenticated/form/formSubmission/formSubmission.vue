<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import services from '@/utils/services';
import { onMounted, ref } from 'vue';
import formTypeModel from '@client/data-model/models/formType.model'
import formSubmissionModel from '@client/data-model/models/formSubmission.model'

const formType = ref()
const activeTabIndex = ref()

const customFieldType = new Set(['file'])
const customFieldParse = new Set(['date'])

onMounted(() => {
  services.list(formTypeModel.name).then(res => {
    console.log(res.data)
    formType.value = res.data.map((formType: any) => ({
      ...formType,
      viewConfig: {
        fields: [...formType.fields.map((field: any, index: number) => field.id), 'submitted_at'],
        fieldsAlias: {
          ...Object.fromEntries(formType.fields.map((field: any, index: number) => ([field.id, field.label]))),
          submitted_at: 'Dikirim'
        },
        fieldsType: {
          ...Object.fromEntries(formType.fields.map((field: any, index: number) => ([field.id, {type: customFieldType.has(field.type) ? field.type : undefined}])))
        },
        fieldsParse: {
          ...Object.fromEntries(formType.fields.map((field: any, index: number) => ([field.id, customFieldParse.has(field.type) ? field.type : undefined]))),
          submitted_at: 'date'
        }
      },
    }))
  })
})
</script>

<template>
  <div>
    <div v-if="formType?.length" class="flex flex-col gap-4">
      <div :class="!$route.query[`${formSubmissionModel.name}_view`] || $route.query[`${formSubmissionModel.name}_view`] === 'list' ? '' : 'hidden'">
        <Tabs :config="formType" v-model="activeTabIndex"/>
      </div>
      <CRUDComposite
        v-if="activeTabIndex != null"
        :key="activeTabIndex"
        :config="{
          ...formSubmissionModel,
          view: {
            ...formSubmissionModel.view,
            fieldsParse: {
              ...(formSubmissionModel.view?.fieldsParse ?? {}),
              submitted_at: 'datetime'
            },
            list: {
              ...formSubmissionModel.view?.list,
              ...formType[activeTabIndex].viewConfig,
              searchParameters: {
                form_type_id: formType[activeTabIndex].id
              }
            },
            detail: {
              ...formSubmissionModel.view?.detail,
              ...formType[activeTabIndex].viewConfig,
            },
          },
        }"
      >
        <!-- <template #detail-under="{data}">
          <ArticleDetailUnder :data="data"/>
        </template> -->
      </CRUDComposite>
    </div>
    <p v-else class="text-muted">Tidak ada formulir yang dapat anda akses.</p>
  </div>
</template>
