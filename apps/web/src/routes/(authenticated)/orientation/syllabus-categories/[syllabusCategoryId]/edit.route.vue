<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { syllabusCategories } from '../syllabus-categories.resource'

const route = useRoute('orientation-syllabus-categories-edit')
const form = { ...syllabusCategories.update({ id: String(route.params.syllabusCategoryId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Kategori Silabus" submit-label="Submit" /></template>
