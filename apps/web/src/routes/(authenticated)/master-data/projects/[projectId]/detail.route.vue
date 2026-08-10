<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { Button } from '@southneuhof/is-vue-framework/components/base'
import { projects } from '../projects.resource'

const route = useRoute('master-data-projects-detail')
</script>

<template>
  <DetailView title="Proyek" :back-to="{ name: 'master-data-projects' }" :resource="projects" :id="String(route.params.projectId)">
    <template #controls>
      <RouterLink :to="`/master-data/projects/${route.params.projectId}/vendors`"><Button>Vendors</Button></RouterLink>
    </template>
  </DetailView>
</template>
