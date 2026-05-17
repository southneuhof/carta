<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { languages } from '@/utils/common'
import { keyManager } from '@/stores/keyManager'
import { toast } from 'vue-sonner'
import { computed, ref, type PropType } from 'vue'

type AnyRecord = Record<string, any>

const props = defineProps({
  data: { type: Object as PropType<AnyRecord>, required: true },
  fields: { type: Array as PropType<string[]>, required: true },
  targetAPI: { type: String, required: true },
  getAPI: { type: String },
  identifier: { type: String, required: true },
  onSuccess: { type: Function as PropType<() => void> },
})

const activeTabIndex = ref(0)
const activeLanguage = computed(() => languages[activeTabIndex.value])
const searchParameters = computed(() => ({
  [props.identifier]: props.data.id,
  language: activeLanguage.value.code,
}))
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs :config="languages" v-model="activeTabIndex" />
    <Form
      :key="activeTabIndex"
      :fields="fields"
      formType="update"
      :getAPI="getAPI ?? targetAPI"
      :targetAPI="targetAPI"
      :searchParameters="searchParameters"
      :onSuccess="() => {
        toast.success('Berhasil mengubah data!')
        onSuccess ? onSuccess() : keyManager().triggerChange(String($route.name))
      }"
    />
  </div>
</template>
