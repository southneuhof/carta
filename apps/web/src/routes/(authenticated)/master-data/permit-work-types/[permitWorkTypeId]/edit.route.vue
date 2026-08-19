<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitWorkTypes } from '../permit-work-types.resource'

const route = useRoute('master-data-permit-work-types-edit')
const form = { ...permitWorkTypes.update({ id: String(route.params.permitWorkTypeId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Tipe Pekerjaan" submit-label="Submit" /></template>
