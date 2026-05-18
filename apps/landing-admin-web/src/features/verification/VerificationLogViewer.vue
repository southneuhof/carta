<script setup lang="ts">
import { parse } from '@southneuhof/utilities/parse'
import services from '@/utils/services'
import { computed } from 'vue'

const props = defineProps({
  model: { type: String, required: true },
  dataID: { type: [String, Number], required: true },
})

const { data } = await services.list('verificationLog', { model: props.model, data_id: props.dataID })
const logs = computed(() => data ?? [])
</script>

<template>
  <div>
    <div v-for="log in logs" class="relative flex flex-row">
      <div class="absolute -left-[4px] top-[8px] aspect-square w-[9px] rounded-full bg-secondary"></div>
      <div>
        <div class="border-l border-primary pb-6">
          <div class="flex flex-col px-4">
            <p class="text-lg font-bold">{{ log.action }}</p>
            <p class="text-sm text-muted">{{ log.verifier?.name ?? 'Deleted user' }} &middot; {{ parse('datetime', log.created_at) }}</p>
            <p v-if="log.description" class="text-sm italic">"{{ log.description }}"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
