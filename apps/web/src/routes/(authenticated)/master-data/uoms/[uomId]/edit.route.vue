<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { uoms } from '../../master-data.resources'

const route = useRoute('master-data-uoms-edit')
</script>

<template><FormView title="Edit UOMs" :resource="uoms" :id="String(route.params.uomId)" /></template>
