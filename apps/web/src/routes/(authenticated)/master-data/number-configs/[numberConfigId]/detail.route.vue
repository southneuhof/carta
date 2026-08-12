<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from '../number-configs.resource'

const route = useRoute('master-data-number-configs-detail')
</script>

<template><DetailView v-bind="numberConfigs.detail({ id: String(route.params.numberConfigId) })" title="Number Configs" :back-to="{ name: 'master-data-number-configs' }" /></template>
