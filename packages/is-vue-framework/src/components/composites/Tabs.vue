<script setup lang="ts">
import { TabsList, TabsRoot, TabsTrigger } from 'radix-vue'
import Card from '../base/Card.vue'
import type { PropType } from 'vue'
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

type TabVariants = 'pill' | 'block' | 'stack' | 'custom'

const props = defineProps({
  name: {
    type: String,
    required: false,
  },
  static: {
    type: Boolean,
    required: false,
    default: false,
  },
  view: {
    type: String,
    required: false,
    default: 'name',
  },
  config: {
    type: Array<any>,
    required: true,
  },
  variant: {
    type: String as PropType<TabVariants>,
    default: 'block',
  },
  additionalEmits: {
    type: Array<string>,
    required: false,
    default: [],
  },
  ignoreQuery: {
    type: Boolean,
    required: false,
    default: false,
  },
  color: {
    type: String as PropType<
      | 'surface'
      | 'surfaceContainerLowest'
      | 'surfaceContainerLow'
      | 'surfaceContainer'
      | 'surfaceContainerHigh'
      | 'surfaceContainerHighest'
      | 'primaryContainer'
      | 'secondaryContainer'
      | 'tertiaryContainer'
      | 'errorContainer'
    >,
    required: false,
    default: 'surfaceContainer',
  },
})
const emit = defineEmits(['change'])

const [router, route] = [useRouter(), useRoute()]

const modelValue = defineModel<number>()

const selectedTab = ref(0)
const name = props.name || String(route.name)

const resolveTabIndex = (value: unknown) => {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsedIndex = Number(rawValue)
  if (!Number.isInteger(parsedIndex) || parsedIndex < 0) return 0
  return Math.min(parsedIndex, Math.max(props.config.length - 1, 0))
}

const getCurrentTab = () => {
  if (props.static || modelValue.value != undefined) {
    selectedTab.value = resolveTabIndex(modelValue.value)
    return
  }
  selectedTab.value = resolveTabIndex(route.query[`${name}_tab`])
}

const changeTab = (idx: number) => {
  const nextTab = resolveTabIndex(idx)
  selectedTab.value = nextTab
  if (!props.ignoreQuery) {
    const queryKey = name + '_tab'
    const currentQueryTab = Array.isArray(route.query[queryKey]) ? route.query[queryKey][0] : route.query[queryKey]
    if (String(currentQueryTab ?? '') !== String(nextTab)) {
      router.replace({ query: { ...route.query, [queryKey]: nextTab } })
    }
  }
  emit('change', nextTab)
  modelValue.value = nextTab
}

onMounted(() => {
  getCurrentTab()
  modelValue.value = selectedTab.value
  emit('change', selectedTab.value)
  if (props.static) {
    watch(
      () => modelValue.value,
      (val) => {
        changeTab(resolveTabIndex(val))
      }
    )
  }
})

defineExpose({
  changeTab,
  getCurrentTab,
})
</script>

<template>
  <TabsRoot v-if="props.variant == 'pill'" :modelValue="String(selectedTab)" @update:modelValue="(value) => changeTab(Number(value))">
    <TabsList class="flex h-[88px] max-w-full justify-start overflow-auto rounded-full bg-surface-container">
      <TabsTrigger v-for="(tab, index) in props.config" as-child :value="String(index)" :key="index">
        <button
          type="button"
          class="overlay flex h-full w-full min-w-max items-center justify-center rounded-full px-6 py-0 font-bold after:hover:bg-on-surface/[8%] after:active:bg-on-surface/[12%]"
          :class="selectedTab === index ? 'bg-secondary-container text-on-secondary-container  ' : 'text-on-surface '"
          @click="changeTab(index)"
        >
          <div v-if="!$slots.tabContent">{{ tab[props.view] }}</div>
          <slot v-else name="tabContent" v-bind="tab"></slot>
        </button>
      </TabsTrigger>
    </TabsList>
  </TabsRoot>

  <TabsRoot v-if="props.variant == 'block'" :modelValue="String(selectedTab)" @update:modelValue="(value) => changeTab(Number(value))" class="overflow-auto">
    <TabsList class="flex flex-row items-center gap-2">
      <TabsTrigger v-for="(tab, index) in props.config" :value="String(index)" :key="index" class="min-w-max text-start focus-visible:outline-none" @click="changeTab(index)">
        <Card :color="selectedTab === index ? 'primaryContainer' : color">
          <div>{{ tab[props.view] }}</div>
        </Card>
      </TabsTrigger>
    </TabsList>
  </TabsRoot>

  <TabsRoot v-else-if="props.variant == 'stack'" :modelValue="String(selectedTab)" @update:modelValue="(value) => changeTab(Number(value))">
    <TabsList>
      <div class="grid grid-cols-1 divide-y-[1px] divide-solid divide-outline/[12%]">
        <div v-if="!props.config.length" class="text-muted">Tidak ada data</div>
        <TabsTrigger v-else v-for="(tab, index) in props.config" as-child :value="String(index)" :key="index">
          <button type="button" class="w-full py-1 text-start" @click="changeTab(index)">
            <Card class="flex-row items-center justify-between" :color="selectedTab === index ? 'primaryContainer' : color">
              <div>{{ tab[view] }}</div>
            </Card>
          </button>
        </TabsTrigger>
      </div>
    </TabsList>
  </TabsRoot>

  <template v-else-if="props.variant == 'custom'">
    <TabsRoot :modelValue="String(selectedTab)" @update:modelValue="(value) => changeTab(Number(value))">
      <TabsList :key="JSON.stringify(props.config)" :class="($attrs.class as string)">
        <TabsTrigger v-for="(tab, index) in props.config" :key="index" :value="String(index)" :disabled="tab.disabled" :class="`text-start focus-visible:outline-none ${($attrs.class as string)}`" @click="changeTab(index)">
          <slot name="tab" v-bind="{ tab, selected: selectedTab === index, index, props, disabled: tab.disabled }"></slot>
        </TabsTrigger>
      </TabsList>
    </TabsRoot>
  </template>
</template>
