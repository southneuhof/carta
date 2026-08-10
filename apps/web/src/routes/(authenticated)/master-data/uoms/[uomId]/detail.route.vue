<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { uoms } from '../../master-data.resources'

const route = useRoute('master-data-uoms-detail')
</script>

<template><DetailView title="UOMs" :back-to="{ name: 'master-data-uoms' }" :resource="uoms" :id="String(route.params.uomId)" /></template>
