<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { tollCausesAccidents } from '../toll-causes-accidents.resource'

const route = useRoute('master-data-toll-causes-accidents-edit')
const form = { ...tollCausesAccidents.update({ id: String(route.params.tollCausesAccidentsId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Faktor Kecelakaan" submit-label="Submit" /></template>
