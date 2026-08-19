<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { permitWorkTypes } from '../permit-work-types.resource'

const route = useRoute('master-data-permit-work-types-detail')
</script>

<template><DetailView v-bind="permitWorkTypes.detail({ id: String(route.params.permitWorkTypeId) })" title="Detail Tipe Pekerjaan" :back-to="{ name: 'master-data-permit-work-types' }" /></template>
