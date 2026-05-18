<script setup lang="ts">
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { keyManager } from '@/stores/keyManager';
import { ref } from 'vue';
import MenuItemView from './_layouts/MenuItemView.vue';

const filter = ref<{selectedLevel1Id: string | undefined, selectedLevel2Id: string | undefined, selectedLevel3Id: string | undefined, selectedLevel4Id: string | undefined}>({
    selectedLevel1Id: undefined,
    selectedLevel2Id: undefined,
    selectedLevel3Id: undefined,
    selectedLevel4Id: undefined
  })
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xl font-bold">Konfigurasi Website</p>
    <div class="grid grid-cols-4 gap-4">
      <Suspense :timeout="0">
        <template #fallback>
          <div class="w-full flex items-center justify-center h-fit"><Spinner/></div>
        </template>
        <MenuItemView
          :key="`${keyManager().value[`menu_item_view_${1}`]}`"
          :level="1"
          v-model="filter.selectedLevel1Id"
          @update:modelValue="() => {
            filter.selectedLevel2Id = undefined
            filter.selectedLevel3Id = undefined
            filter.selectedLevel4Id = undefined
          }"
        />
      </Suspense>
      <div v-if="filter.selectedLevel1Id" :key="filter.selectedLevel1Id" class="grid grid-cols-3 col-span-3 gap-4">
        <Suspense :timeout="0">
          <template #fallback>
            <div class="w-full flex items-center justify-center h-fit"><Spinner/></div>
          </template>
          <MenuItemView
            :key="`${keyManager().value[`menu_item_view_${2}`]}`"
            :level="2" 
            :parentId="filter.selectedLevel1Id"
            v-model="filter.selectedLevel2Id"
            @update:modelValue="() => {
              filter.selectedLevel3Id = undefined
              filter.selectedLevel4Id = undefined
            }"
          />
        </Suspense>
        <div v-if="filter.selectedLevel2Id" :key="filter.selectedLevel2Id" class="grid grid-cols-2 col-span-2 gap-4">
          <Suspense :timeout="0">
            <template #fallback>
              <div class="w-full flex items-center justify-center h-fit"><Spinner/></div>
            </template>
            <MenuItemView
              :key="`${keyManager().value[`menu_item_view_${3}`]}`"
              :level="3"
              :parentId="filter.selectedLevel2Id"
              v-model="filter.selectedLevel3Id"
              @update:modelValue="() => {
                filter.selectedLevel4Id = undefined
              }"
            />
          </Suspense>
          <Suspense :timeout="0">
            <template #fallback>
              <div class="w-full flex items-center justify-center h-fit"><Spinner/></div>
            </template>
            <MenuItemView
              v-if="filter.selectedLevel3Id"
              :key="`${keyManager().value[`menu_item_view_${4}`]}${filter.selectedLevel3Id}`"
              :level="4"
              :parentId="filter.selectedLevel3Id"
              v-model="filter.selectedLevel4Id"
            />
          </Suspense>
        </div>
      </div>
    </div>
  </div>
</template>