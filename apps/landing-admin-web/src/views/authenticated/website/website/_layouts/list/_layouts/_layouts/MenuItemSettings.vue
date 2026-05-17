<script setup lang="ts">
import type { MenuItem } from '@headlessui/vue'
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue'
import { languages } from '@/utils/common'
import { provide, ref } from 'vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { toast } from 'vue-sonner'
import services from '@/utils/services'
import { keyManager } from '@/stores/keyManager'
import TranslationEditor from '@/features/translations/TranslationEditor.vue'
import MenuLanguageSettings from './_layouts/MenuLanguageSettings.vue'
import MenuGeneralSettings from './_layouts/MenuGeneralSettings.vue'
import MenuMappingRoleMenuItem from './_layouts/MenuMappingRoleMenuItem.vue'
import { permissions } from '@/stores/permissions'

const props = defineProps({
  // menuItemForm: {
  //   type: Object,
  //   required: true,
  // },
  menuItem: {
    type: Object,
    required: true,
  },
})

provide('menuItem', props.menuItem)

const activeTabIndex = ref(0)
const tabConfig = [
  {name: 'Bahasa', component: MenuLanguageSettings},
  {name: 'Menu', component: MenuGeneralSettings},
  permissions().has('list-mappingRoleMenuItem') ? {name: 'Permission', component: MenuMappingRoleMenuItem} : null,
].filter((item: any) => item != null)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xl font-bold">{{ menuItem.translations.find((item: any) => item.language === 'id')?.name }}</p>
    <Tabs :config="tabConfig" v-model="activeTabIndex"/>
    <component v-if="activeTabIndex != null" :is="tabConfig[activeTabIndex]?.component"/>
  </div>
</template>
