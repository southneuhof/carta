<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import ProductDetailUnder from './_layouts/ProductDetailUnder.vue'
import productModel from '@client/data-model/models/product.model'
import { parse } from '@southneuhof/utilities/parse'
</script>

<template>
  <CRUDComposite :config="productModel">
    <template #detail-under="{ data }">
      <ProductDetailUnder :data="data" />
    </template>
    <template #list-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #detail-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #list-created_at="{ data }">
      <p class="whitespace-nowrap">{{ parse('date', data.created_at) }}</p>
    </template>
  </CRUDComposite>
</template>
