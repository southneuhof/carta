<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import ArticleDetailUnder from './_layouts/ArticleDetailUnder.vue';
import { articleModel } from '@/models';
import { parse } from '@/utils/common';
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- <div :class="!$route.query[`${articleConfig.name}_view`] || $route.query[`${articleConfig.name}_view`] === 'list' ? '' : 'hidden'">
      <Tabs :config="articleCategory" v-model="activeTabIndex"/>
    </div> -->
    <CRUDComposite
      :config="articleModel"
    >
      <template #detail-under="{data}">
        <ArticleDetailUnder :data="data"/>
      </template>
      <template #list-created_at="{data}">
        <p class="whitespace-nowrap">{{ parse('date', data.created_at) }}</p>
      </template>
      <template #detail-title="{data}">
        <p class="whitespace-nowrap">{{ data.translations['id'].title }}</p>
      </template>
      <template #list-status_code="{data}">
        <div class="flex flex-col items-center justify-center gap-2">
          <div class="flex flex-row items-center gap-2">
            <p
              :class="{
                'text-muted': data.translations['id']?.status_code === 'DRAFT',
                'text-success': data.translations['id']?.status_code === 'PUBLISHED',
                'text-warning': data.translations['id']?.status_code === 'REVIEW',
              }"
            >
              ID
            </p>
            <p class="text-muted">/</p>
            <p
              :class="{
                'text-muted': data.translations['en']?.status_code === 'DRAFT',
                'text-success': data.translations['en']?.status_code === 'PUBLISHED',
                'text-warning': data.translations['en']?.status_code === 'REVIEW',
              }"
            >
              EN
            </p>
          </div>
        </div>
      </template>
    </CRUDComposite>
  </div>
</template>
