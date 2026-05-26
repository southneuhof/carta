<script setup lang="ts">
import Modal from '@southneuhof/is-vue-framework/components/base/Dialog.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import TranslationEditor from '@/features/translations/TranslationEditor.vue'
import jobCategoryModel from '@client/data-model/models/jobCategory.model'
import { permissions } from '@/stores/permissions'
</script>

<template>
  <CRUDComposite :config="jobCategoryModel">
    <template #list-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #list-rowActions-update="{ data }">
      <Modal v-if="permissions().has('update-jobCategory')">
        <template #trigger>
          <Button color="warning" kind="icon">
            <template #icon>
              <Icon name="edit" />
            </template>
          </Button>
        </template>
        <template #content>
          <TranslationEditor
            :data="data"
            identifier="job_category_id"
            :fields="['name', 'description']"
            targetAPI="jobCategoryTranslation"
          />
        </template>
      </Modal>
    </template>
  </CRUDComposite>
</template>
