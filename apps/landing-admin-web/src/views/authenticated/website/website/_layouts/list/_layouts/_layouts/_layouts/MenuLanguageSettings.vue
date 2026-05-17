<script setup lang="ts">
import TranslationEditor from '@/features/translations/TranslationEditor.vue'
import { inject } from 'vue';

const menuItem = inject<any>('menuItem')
</script>

<template>
  <TranslationEditor
    :data="menuItem"
    identifier="menu_item_id"
    :fields="['name', 'description']"
    targetAPI="menuItemTranslation"
  /> 
</template>