<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from '../users.resource'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-users-edit')
const userId = computed(() => route.params.userId)
</script>

<template>
  <FormView title="Edit User" :resource="users" :id="userId" />
</template>
