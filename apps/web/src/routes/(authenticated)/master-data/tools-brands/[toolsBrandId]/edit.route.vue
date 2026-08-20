<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { toolsBrands } from '../tools-brands.resource'

const route = useRoute('master-data-tools-brands-edit')
const form = { ...toolsBrands.update({ id: String(route.params.toolsBrandId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Merk Alat Berat &amp; Alat Ukur/Uji" submit-label="Submit" /></template>

