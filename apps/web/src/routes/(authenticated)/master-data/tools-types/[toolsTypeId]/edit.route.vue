<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { toolsTypes } from '../tools-types.resource'

const route = useRoute('master-data-tools-types-edit')
const form = { ...toolsTypes.update({ id: String(route.params.toolsTypeId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Jenis Alat Berat &amp; Alat Ukur/Uji" submit-label="Submit" /></template>

