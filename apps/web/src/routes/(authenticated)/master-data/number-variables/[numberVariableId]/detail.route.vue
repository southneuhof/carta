<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { numberVariables } from '../number-variables.resource'

const route = useRoute('master-data-number-variables-detail')
</script>

<template><DetailView title="Number Variables" :back-to="{ name: 'master-data-number-variables' }" :resource="numberVariables" :id="String(route.params.numberVariableId)" /></template>
