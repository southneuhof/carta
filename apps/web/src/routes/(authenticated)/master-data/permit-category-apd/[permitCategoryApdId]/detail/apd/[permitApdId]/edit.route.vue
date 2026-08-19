<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitApds } from '../../../../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-detail-apd-edit')
const parentId = String(route.params.permitCategoryApdId)
const form = { ...permitApds(parentId).update({ id: String(route.params.permitApdId), initialData: { permitCategoryApdId: parentId } }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui APD" submit-label="Submit" /></template>
