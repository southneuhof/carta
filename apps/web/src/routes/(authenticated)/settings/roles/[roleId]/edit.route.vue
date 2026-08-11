<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from '../roles.resource'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-roles-edit')
const roleId = computed(() => route.params.roleId)
</script>

<template>
  <FormView title="Edit Role" :resource="roles" :id="roleId" :form-options="{ context: { operation: 'update' } }" />
</template>
