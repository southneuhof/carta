<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from '../../master-data.resources'

const route = useRoute('master-data-number-configs-detail')
</script>

<template><DetailView title="Number Configs" :back-to="{ name: 'master-data-number-configs' }" :resource="numberConfigs" :id="String(route.params.numberConfigId)" /></template>
