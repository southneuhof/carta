<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitDangerSources } from '../permit-danger-source.resource'

const route = useRoute('master-data-permit-danger-source-edit')
const form = { ...permitDangerSources.update({ id: String(route.params.permitDangerSourceId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Sumber Bahaya" submit-label="Submit" /></template>
