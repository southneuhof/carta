<script setup lang="ts">
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue';
import Table from '@southneuhof/is-vue-framework/components/composites/Table.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import services from '@/utils/services';
import { inject, onMounted, ref, type PropType } from 'vue';
import type { SupportedSectionSlotEditor } from '@/features/sections/schemaAdapter';
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue';
import Detail from '@southneuhof/is-vue-framework/components/composites/Detail.vue';
import { getSmallestChildObject } from '@/utils/common';

  const props = defineProps({
    objectID: {
      type: String,
      required: true
    },
    slotConfig: {
      type: Object as PropType<SupportedSectionSlotEditor | undefined>,
      required: true
    },
    sectionData: {
      type: Object,
      required: true
    }
  })

  const pageTranslation = inject<Record<string, any>>('pageTranslation')

  function onDragChange(model: string, event: any) {
    if (!event.moved) return
    services.put(`${model}/reorder`, {
      old_order: event.moved.oldIndex+1,
      new_order: event.moved.newIndex+1,
      id: event.moved.element.id,
      page_translation_id: pageTranslation?.value?.id
    })
  }

  const isOpen = ref(false)
  const loading = ref(true)

  const localConfig: any = {

    list: {
      fields: [
        "title",
        "description",
        "media",
        "url",
        "url_text",
        "status",
        "attachment",
      ],
      fieldsAlias: {
        status: 'Dokumen Privat (Memerlukan Request)',
      },
      inputConfig: {
        status: {
          type: 'checkbox',
        },
        attachment: {
          type: 'file',
          // dependency: {
          //   field: ['status'],
          //   visibility: {
          //     validator: ({status}: any) =>!status,
          //     default: false
          //   }
          // },
        }
      }
    },
    media: {
      fields: [
        "subtitle",
        "title",
        "description",
        "media",
        "url",
        "url_text",
        "status",
        "attachment",
      ],
      fieldsAlias: {
        status: 'Dokumen Privat (Memerlukan Request)',
      },
      inputConfig: {
        status: {
          type: 'checkbox',
        },
        attachment: {
          type: 'file',
          // dependency: {
          //   field: ['status'],
          //   visibility: {
          //     validator: ({status}: any) =>!status,
          //     default: false
          //   }
          // },
        }
      }
    },
    gallery: {
      fields: [
        "media",
        "subtitle",
        "title",
        "description",
      ],
    },
    content: {
      fields: [
        "title",
        "description"
      ],
      inputConfig: {
        description: {type: 'rich-text'}
      }
    },
    card: {
      fields: ["media", "attachment", "subtitle", "title", "description", "url_type", "url", "url_text"],
      inputConfig: {
        attachment: {type: 'image'}
      },
      fieldsAlias: {
        media: 'Gambar Background',
        attachment: 'Logo'
      }
    },
  }

  const config = localConfig

  const listConfig = {
    getAPI: 'content',
    deleteAPI: 'content',
    fields: config[props.sectionData.parentSectionData.meta.type].fields,
    fieldsAlias: config[props.sectionData.parentSectionData.meta.type].fieldsAlias,
    fieldsDictionary: config[props.sectionData.parentSectionData.meta.type].fieldsDictionary,
    fieldsParse: config[props.sectionData.parentSectionData.meta.type].fieldsParse,
    fieldsProxy: config[props.sectionData.parentSectionData.meta.type].fieldsProxy,
    fieldsType: config[props.sectionData.parentSectionData.meta.type].fieldsType,
    fieldsUnit: config[props.sectionData.parentSectionData.meta.type].fieldsUnit,
    searchParameters: {gallery_id: props.objectID, sort: 'asc', sort_by: 'order', limit: 1000},
    onDragChange: config[props.sectionData.parentSectionData.meta.type].onDragChange || ((event: any) => onDragChange('content', event)),
  }

  const createFormConfig = {
    fields: config[props.sectionData.parentSectionData.meta.type].fields,
    targetAPI: 'content',
    fieldsAlias: config[props.sectionData.parentSectionData.meta.type].fieldsAlias,
    inputConfig: config[props.sectionData.parentSectionData.meta.type].inputConfig,
    extraData: {gallery_id: props.objectID, page_translation_id: pageTranslation?.value?.id},
  }

  const updateFormConfig = {
    fields: config[props.sectionData.parentSectionData.meta.type].fields,
    targetAPI: 'content',
    fieldsAlias: config[props.sectionData.parentSectionData.meta.type].fieldsAlias,
    inputConfig: config[props.sectionData.parentSectionData.meta.type].inputConfig,
    extraData: {page_translation_id: pageTranslation?.value?.id},
  }

  const detailConfig = {
    fields: config[props.sectionData.parentSectionData.meta.type].fields,
    fieldsAlias: config[props.sectionData.parentSectionData.meta.type].fieldsAlias,
    fieldsDictionary: config[props.sectionData.parentSectionData.meta.type].fieldsDictionary,
    fieldsParse: config[props.sectionData.parentSectionData.meta.type].fieldsParse,
    fieldsProxy: config[props.sectionData.parentSectionData.meta.type].fieldsProxy,
    fieldsType: config[props.sectionData.parentSectionData.meta.type].fieldsType,
    fieldsUnit: config[props.sectionData.parentSectionData.meta.type].fieldsUnit,
  }

  const currentView = ref<'list' | 'create' | 'update' | 'detail'>('list')
  const activeData = ref<any>(null)
  const injectedSectionData = inject<any>('sectionData', {})
  const topmostSection = getSmallestChildObject(injectedSectionData, 'parentSectionData')
</script>


<template>
  <Card>
    <div class="flex flex-row items-center gap-4 justify-between">
      <div class="flex flex-row items-center gap-2">
        <Icon>category</Icon>
        <p class="text-xl font-semibold">Data</p>
        <div v-if="loading" class="h-[34px] flex items-center justify-center">
          <Spinner/>
        </div>
        <Button
          v-if="isOpen && currentView !== 'list'"
          @click="() => {
            currentView = 'list'
            activeData = null
          }"
          variant="tonal"
          class="ml-4"
        >
          <Icon>chevron_left</Icon>Kembali
        </Button>
      </div>
      <div v-if="!loading" class="flex flex-row items-center gap-4">
        <Button v-if="isOpen && currentView === 'list' && pageTranslation?.status_code === 'DRAFT'" class="h-[34px]" @click="() => currentView = 'create'"><Icon>add</Icon>Tambah</Button>
        <Button @click="() => isOpen = !isOpen" variant="standard"><Icon>{{ isOpen ? 'expand_less' : 'expand_more' }}</Icon></Button>
      </div>
    </div>
    <div v-show="isOpen" class="flex flex-col gap-4">
      <Transition name="fade" mode="out-in">
        <div :key="currentView" class="flex flex-col gap-4">
          <template v-if="currentView === 'list'">
            <Table
              draggable
              :key="keyManager().value[`table-gallery-${objectID}`]"
              v-bind="listConfig"
              :onDataLoaded="() => loading = false"
              :disabled="pageTranslation?.status_code !== 'DRAFT'"
            >
              <template #list-rowActions="{data}">
                <div class="flex flex-row items-center gap-2">
                  <Icon v-if="pageTranslation?.status_code === 'DRAFT'" class="cursor-move mr-3">drag_indicator</Icon>
                  <Button
                    color="info"

                    @click="() => {
                      activeData = data
                      currentView = 'detail'
                    }"
                  >
                    <Icon>info</Icon>
                  </Button>
                  <template v-if="pageTranslation?.status_code === 'DRAFT'">
                    <Button
                      color="warning"

                      @click="() => {
                        activeData = data
                        currentView = 'update'
                      }"
                    >
                      <Icon>edit</Icon>
                    </Button>
                    <ConfirmationDialog
                      :onConfirm="() => {
                        services.delete('content', {id: data.id}).then(() => {
                          toast.success('Berhasil menghapus data!')
                          keyManager().triggerChange(`table-gallery-${objectID}`)
                          keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                        })
                      }"
                    >
                      <template #trigger>
                        <Button color="error"><Icon>delete_forever</Icon></Button>
                      </template>
                    </ConfirmationDialog>
                  </template>
                </div>
              </template>
            </Table>
          </template>
          <template v-else-if="currentView === 'create'">
            <Form
              v-bind="createFormConfig"
              :getInitialData="async () => ({ meta: props.sectionData.meta,
               })"
              :disabled="pageTranslation?.status_code !== 'DRAFT'"
              :onSuccess="() => {
                toast.success('Berhasil menambahkan data!')
                keyManager().triggerChange(`table-gallery-${objectID}`)
                keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                currentView = 'list'
              }"
            />
          </template>
          <template v-else-if="currentView === 'update'">
            <Form
              v-bind="updateFormConfig"
              :getInitialData="async () => JSON.parse(JSON.stringify(activeData))"
              formType="update"
              :disabled="pageTranslation?.status_code !== 'DRAFT'"
              :onSuccess="() => {
                toast.success('Berhasil mengubah data!')
                keyManager().triggerChange(`table-gallery-${objectID}`)
                keyManager().triggerChange(`section-update-time-${topmostSection.id}`)
                currentView = 'list'
              }"
            />
          </template>
          <template v-else-if="currentView === 'detail'">
            <Detail
              :data="activeData"
              v-bind="detailConfig"
            />
          </template>
        </div>
      </Transition>
    </div>
    <!-- <Form
      v-if="!loading"
      v-show="isOpen"
      :fields="fields"
      :getData="async () => JSON.parse(JSON.stringify(contentData))"
      formType="update"
    /> -->
  </Card>
</template>

<style>
.bc-enter-active,
.bc-leave-active {
  transition: all 0.2s ease;
}

.bc-enter-from {
  transform: v-bind('currentView === "list" ? "translateX(-1.25%)" : "translateX(1.25%)"');
  opacity: 0;
}

.bc-leave-to {
  transform: v-bind('currentView === "list" ? "translateX(1.25%)" : "translateX(-1.25%)"');
  opacity: 0;
}
</style>
