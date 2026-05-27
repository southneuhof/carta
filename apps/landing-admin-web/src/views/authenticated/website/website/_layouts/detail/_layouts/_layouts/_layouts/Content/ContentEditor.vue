<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import { getSmallestChildObject } from '@/utils/common';
import services from '@/utils/services';
import { computed, inject, onMounted, ref, type PropType } from 'vue';
import type { SupportedSectionSlotEditor } from '@/features/sections/schemaAdapter';
import { resolveSlotEditorConfig } from '@/features/sections/slotEditorConfig';
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue';
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue';
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue';
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue';

  const props = defineProps({
    contentID: {
      type: String,
      required: true
    },
    slotConfig: {
      type: Object as PropType<SupportedSectionSlotEditor | undefined>,
      required: false
    },
    name: {
      type: String,
      default: 'Content'
    }
  })

  const isOpen = ref(false)
  const contentData = ref()
  const loading = ref(true)
  onMounted(() => {
    services.detail('content', props.contentID).then(res => {
      contentData.value = res.data
      loading.value = false
    })
  })
  const pageTranslation = inject<Record<string, any>>('pageTranslation')
  const sectionData = inject<any>('sectionData', {})

  const rootSectionData = computed(() => {
    let current = sectionData as any
    while (current?.parentSectionData) current = current.parentSectionData
    return current ?? null
  })
  const resolvedSlotConfig = computed(() =>
    resolveSlotEditorConfig(props.slotConfig, {
      slot: {
        key: props.slotConfig?.key ?? '',
        type: (props.slotConfig?.type === 'resource' ? 'content' : (props.slotConfig?.type ?? 'content')),
        order: props.slotConfig?.order ?? 0,
        many: props.slotConfig?.many ?? false,
      },
      sectionData,
      parentSectionData: sectionData?.parentSectionData ?? null,
      rootSectionData: rootSectionData.value,
    }),
  )
  const fields = computed(() => resolvedSlotConfig.value?.fields ?? [])
  const fieldsAlias = computed(() => (resolvedSlotConfig.value as any)?.fieldAliases ?? (resolvedSlotConfig.value as any)?.fieldsAlias ?? {})

  const updateFormConfig = computed(() => ({
    fields: fields.value,
    targetAPI: 'content',
    fieldsAlias: fieldsAlias.value,
    inputConfig: {
      content: { type: 'rich-text' },
      ...(resolvedSlotConfig.value?.inputConfig ?? {}),
    },
  }))
  
  const topmostSection = getSmallestChildObject(sectionData, 'parentSectionData')
</script>

<template>
  <Card>
    <div class="flex flex-row items-center gap-4 justify-between">
      <div class="flex flex-row items-center gap-2">
        <Icon name="file-text"></Icon>
        <p class="text-xl font-semibold">{{ name }}</p>
        <div v-if="loading" class="h-[34px] flex items-center justify-center">
          <Spinner/>
        </div>
      </div>
      <Button v-if="!loading" @click="() => isOpen = !isOpen" variant="standard" kind="icon">
        <template #icon>
          <Icon :name="isOpen ? 'arrow-up-s' : 'arrow-down-s'"></Icon>
        </template>
      </Button>
    </div>
    <Form
      v-if="!loading"
      v-show="isOpen"
      v-bind="updateFormConfig"
      :getInitialData="async () => JSON.parse(JSON.stringify(contentData))"
      formType="update"
      :searchParameters="{id: contentID}"
      :extraData="{page_translation_id: pageTranslation?.id}"
      :onSuccess="() => {
        toast.success('Berhasil menyimpan data!')
        keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
      }"
      :disabled="pageTranslation?.status_code !== 'DRAFT'"
    />
  </Card>
</template>
