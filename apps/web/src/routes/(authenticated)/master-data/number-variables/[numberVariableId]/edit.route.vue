<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { numberVariables } from '../../master-data.resources'

const route = useRoute('master-data-number-variables-edit')
</script>

<template><FormView title="Edit Number Variables" :resource="numberVariables" :id="String(route.params.numberVariableId)" /></template>
