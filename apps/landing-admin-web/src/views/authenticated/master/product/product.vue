<script setup lang="ts">
import Modal from '@southneuhof/is-vue-framework/components/base/Dialog.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import TranslationEditor from '@/features/translations/TranslationEditor.vue'
import productModel from '@client/data-model/models/product.model'
import { parse } from '@southneuhof/utilities/parse'
import { permissions } from '@/stores/permissions'
</script>

<template>
  <CRUDComposite :config="productModel">
    <template #list-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #detail-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #list-created_at="{ data }">
      <p class="whitespace-nowrap">{{ parse('date', data.created_at) }}</p>
    </template>
    <!-- <template #list-rowActions-update="{ data }">
      <Modal v-if="permissions().has('update-product')">
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
            identifier="product_id"
            :fields="['name', 'description']"
            targetAPI="productTranslation"
          />
        </template>
      </Modal>
    </template> -->
  </CRUDComposite>
</template>
