<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { projectItpRoute } from './itp.routes'
</script>

<template>
  <ListView
    v-bind="projects.list()"
    title="Inspection & Test Plan"
    pagination="always"
    :create-route="undefined"
    :detail-route="projectItpRoute"
    :update-route="() => undefined"
    :can-delete="() => false"
  />
</template>
