<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { divisions } from '../divisions.resource'

const route = useRoute('master-data-divisions-edit')
</script>

<template><FormView title="Edit Divisi" :resource="divisions" :id="String(route.params.divisionId)" /></template>
