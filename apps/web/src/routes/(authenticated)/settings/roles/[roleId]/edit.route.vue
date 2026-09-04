<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { roles } from '../roles.resource'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-roles-edit')
const roleId = computed(() => route.params.roleId)
</script>

<template>
  <FormView v-bind="roles.update({ id: roleId })" title="Edit Role" />
</template>
