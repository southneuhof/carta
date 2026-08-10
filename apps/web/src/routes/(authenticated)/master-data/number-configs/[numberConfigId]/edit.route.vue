<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from '../../master-data.resources'

const route = useRoute('master-data-number-configs-edit')
</script>

<template><FormView title="Edit Number Configs" :resource="numberConfigs" :id="String(route.params.numberConfigId)" /></template>
