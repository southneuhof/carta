<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from '../number-configs.resource'

const route = useRoute('master-data-number-configs-edit')
</script>

<template><FormView v-bind="numberConfigs.update({ id: String(route.params.numberConfigId) })" title="Edit Number Configs" /></template>
