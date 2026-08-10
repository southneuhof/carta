<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { uoms } from '../uoms.resource'

const route = useRoute('master-data-uoms-edit')
</script>

<template><FormView title="Edit Satuan" :resource="uoms" :id="String(route.params.uomId)" /></template>
