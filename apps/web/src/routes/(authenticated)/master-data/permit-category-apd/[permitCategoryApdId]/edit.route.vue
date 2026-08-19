<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitCategoryApds } from '../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-edit')
const form = { ...permitCategoryApds.update({ id: String(route.params.permitCategoryApdId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Kategori APD" submit-label="Submit" /></template>
