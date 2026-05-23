<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import type { PropType } from 'vue'

const props = defineProps({
  product: { type: Object as PropType<Record<string, any>>, required: true },
  language: { type: Object, required: true },
})

const { data: productTranslation } = await services.detail('productTranslation', [props.product.id, props.language.code])
</script>

<template>
  <Card>
    <div class="mb-4 flex flex-row items-center justify-between">
      <p class="text-xl">Detail Produk</p>
    </div>
    <Form
      targetAPI="productTranslation"
      :fields="['name', 'description']"
      :inputConfig="{
        name: { type: 'text', props: { required: true } },
        description: { type: 'rich-text' },
      }"
      :fieldsAlias="{
        name: 'Nama Produk',
        description: 'Deskripsi Produk',
      }"
      :getDetailData="async () => JSON.parse(JSON.stringify(productTranslation))"
      formType="update"
      :searchParameters="{ product_id: props.product.id, language: props.language.code }"
      :onSuccess="
        () => {
          toast.success('Berhasil menyimpan produk!')
        }
      "
    />
  </Card>
</template>
