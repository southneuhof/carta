<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitApds } from '../../../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-detail-apd-create')
const parentId = String(route.params.permitCategoryApdId)
const form = { ...permitApds(parentId).create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah APD" submit-label="Submit" /></template>
