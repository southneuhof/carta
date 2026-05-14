<script setup lang="ts">
import { debounce } from '@southneuhof/is-vue-framework/utils/object'
import { ref, watch } from 'vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  debounced: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: 'Cari...',
  },
})

const modelValue = defineModel<string>()

const value = ref(modelValue.value)
const debouncedSetValue = debounce(() => (modelValue.value = value.value), 300)

watch(value, () => {
  if (!props.debounced) modelValue.value = value.value
  else debouncedSetValue()
})

watch(modelValue, () => (value.value = modelValue.value))
</script>

<template>
  <div class="flex flex-row gap-4 rounded-full py-3 pl-4 outline outline-1 outline-outline/[24%] transition-all ease-linear">
    <Icon class="text-primary" name="search"></Icon>
    <input class="w-full bg-transparent focus-visible:outline-none" :placeholder="placeholder" v-model="value" />
  </div>
</template>
