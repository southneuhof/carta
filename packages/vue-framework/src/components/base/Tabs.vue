<script setup lang="ts">
import { TabGroup, TabList, Tab } from '@headlessui/vue'
import Card from './Card.vue'
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
  <TabGroup v-if="props.variant == 'pill'" :selectedIndex="selectedTab" @change="changeTab">
    <TabList class="flex h-[88px] max-w-full justify-start overflow-auto rounded-full bg-surface-container">
      <Tab v-for="(tab, index) in props.config" as="template" :key="index" v-slot="{ selected }">
        <button
          class="overlay flex h-full w-full min-w-max items-center justify-center rounded-full px-6 py-0 font-bold after:hover:bg-on-surface/[8%] after:active:bg-on-surface/[12%]"
          :class="selected ? 'bg-secondary-container text-on-secondary-container  ' : 'text-on-surface '"
        >
          <div v-if="!$slots.tabContent">{{ tab[props.view] }}</div>
          <slot v-else name="tabContent" v-bind="tab"></slot>
        </button>
      </Tab>
    </TabList>
  </TabGroup>

  <TabGroup v-if="props.variant == 'block'" :selectedIndex="selectedTab" @change="changeTab" class="overflow-auto">
    <TabList class="flex flex-row items-center gap-2">
      <Tab v-for="(tab, index) in props.config" as="template" :key="index" v-slot="{ selected }" class="min-w-max">
        <Card :color="selected ? 'primaryContainer' : color">
          <div>{{ tab[props.view] }}</div>
        </Card>
      </Tab>
    </TabList>
  </TabGroup>

  <TabGroup v-else-if="props.variant == 'stack'" :selectedIndex="selectedTab" @change="changeTab">
    <TabList>
      <div class="grid grid-cols-1 divide-y-[1px] divide-solid divide-outline/[12%]">
        <div v-if="!props.config.length" class="text-muted">Tidak ada data</div>
        <Tab v-else v-for="(tab, index) in props.config" as="template" :key="index" v-slot="{ selected }">
          <div class="py-1">
            <Card class="flex-row items-center justify-between" :color="selected ? 'primaryContainer' : color">
              <div>{{ tab[view] }}</div>
            </Card>
          </div>
        </Tab>
      </div>
    </TabList>
  </TabGroup>

  <template v-else-if="props.variant == 'custom'">
    <TabGroup :selectedIndex="selectedTab" @change="changeTab">
      <TabList :key="JSON.stringify(props.config)" :class="($attrs.class as string)">
        <Tab v-for="(tab, index) in props.config" :key="index" :disabled="tab.disabled" v-slot="{ selected }" :class="`text-start focus-visible:outline-none ${($attrs.class as string)}`">
          <slot name="tab" v-bind="{ tab, selected, index, props, disabled: tab.disabled }"></slot>
        </Tab>
      </TabList>
    </TabGroup>
  </template>
</template>
