<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from '../overtimes.resource'


const route = useRoute('hr-overtimes-edit')
const overtimeId = computed(() => route.params.overtimeId)

// Editing is only possible while the request is a draft; the API answers 409
// otherwise, and the detail screen hides the control once it is submitted.
</script>

<template>
  <FormView title="Ubah Lembur" :resource="overtimes" :id="overtimeId" />
</template>
