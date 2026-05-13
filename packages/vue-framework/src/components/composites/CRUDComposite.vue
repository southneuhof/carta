<script setup lang="ts">
import { ref, onMounted, type PropType, computed, provide } from 'vue'
import type { ModelConfig } from '@southneuhof/is-data-model'
import { useRoute, useRouter } from 'vue-router'
import CRUDList from './CRUD/CRUDList.vue'
import CRUDDetail from './CRUD/CRUDDetail.vue'
import CRUDCreate from './CRUD/CRUDCreate.vue'
import CRUDUpdate from './CRUD/CRUDUpdate.vue'
import { permissions } from '@southneuhof/is-vue-framework/adapters/state'
import Spinner from '../base/Spinner.vue'
import Card from '../base/Card.vue'

const [router, route] = [useRouter(), useRoute()]

const props = defineProps({
  config: {
    type: Object as PropType<ModelConfig>,
    required: false,
    default: () => ({}),
  },
  main: {
    type: Boolean,
    required: false,
    default: false,
  },
  preservedParameters: {
    type: Array as PropType<string[]>,
    required: false,
    default: () => [],
  },
})

const actionsPermission = {
  view: permissions().has(`view-${props.config.permission || props.config.name || props.config.modelAPI}`),
  lookup: permissions().has(`lookup-${props.config.permission || props.config.name || props.config.modelAPI}`),
  detail: permissions().has(`show-${props.config.permission || props.config.name || props.config.modelAPI}`),
  create: permissions().has(`create-${props.config.permission || props.config.name || props.config.modelAPI}`),
  update: permissions().has(`update-${props.config.permission || props.config.name || props.config.modelAPI}`),
  delete: permissions().has(`delete-${props.config.permission || props.config.name || props.config.modelAPI}`),
}

provide('actionsPermission', actionsPermission)

const currentView = computed<'list' | 'detail' | 'create' | 'update'>(() => (route.query[`${props.config.name}_view`] ? route.query[`${props.config.name}_view`] : ('list' as any)))

onMounted(async () => {
  if (!actionsPermission.view) return
  // setTimeout(() => animate.value = true, 200);
})
</script>

<template>
  <div>
    <Transition mode="out-in" name="bc">
      <Suspense :timeout="0">
        <template #fallback>
          <div class="flex w-full items-center justify-center"><Spinner /></div>
        </template>
        <div v-if="actionsPermission.view" :key="`${currentView}${config.name}`" class="flex flex-col gap-4">
          <template v-if="currentView === 'list'">
            <slot v-if="$slots['list-content']" name="list-content"></slot>
            <CRUDList v-else :config="config" :permissions="actionsPermission">
              <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
                <slot v-if="slotname.slice(0, 5) === 'list-'" :name="slotname" v-bind="(data as any)"></slot>
              </template>
            </CRUDList>
          </template>

          <template v-else-if="currentView === 'detail'">
            <slot v-if="$slots['detail-content']" name="detail-content"></slot>
            <CRUDDetail v-else :config="config" :permissions="actionsPermission">
              <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
                <slot v-if="slotname.slice(0, 7) === 'detail-'" :name="slotname" v-bind="(data as any)"></slot>
              </template>
            </CRUDDetail>
          </template>

          <template v-else-if="currentView === 'create'">
            <slot v-if="$slots['create-content']" name="create-content"></slot>
            <CRUDCreate v-else :config="config" :permissions="actionsPermission">
              <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
                <slot v-if="slotname.slice(0, 7) === 'create-'" :name="slotname" v-bind="(data as any)"></slot>
              </template>
            </CRUDCreate>
          </template>

          <template v-else-if="currentView === 'update'">
            <slot v-if="$slots['update-content']" name="update-content"></slot>
            <CRUDUpdate v-else :config="config" :permissions="actionsPermission">
              <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
                <slot v-if="slotname.slice(0, 7) === 'update-'" :name="slotname" v-bind="(data as any)"></slot>
              </template>
            </CRUDUpdate>
          </template>
        </div>
      </Suspense>
    </Transition>
  </div>
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
