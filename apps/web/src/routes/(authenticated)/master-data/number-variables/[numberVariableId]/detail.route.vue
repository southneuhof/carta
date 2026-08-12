<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { numberVariables } from '../number-variables.resource'

const route = useRoute('master-data-number-variables-detail')
</script>

<template><DetailView v-bind="numberVariables.detail({ id: String(route.params.numberVariableId) })" title="Number Variables" :back-to="{ name: 'master-data-number-variables' }" /></template>
