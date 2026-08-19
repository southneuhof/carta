<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { permitDangerSources } from '../permit-danger-source.resource'

const route = useRoute('master-data-permit-danger-source-detail')
</script>

<template>
  <DetailView v-bind="permitDangerSources.detail({ id: String(route.params.permitDangerSourceId) })" title="Detail Sumber Bahaya" :back-to="{ name: 'master-data-permit-danger-source' }" />
</template>
