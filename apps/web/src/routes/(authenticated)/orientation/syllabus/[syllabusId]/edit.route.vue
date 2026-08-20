<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { syllabi } from '../syllabus.resource'

const route = useRoute('orientation-syllabus-edit')
const form = { ...syllabi.update({ id: String(route.params.syllabusId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Silabus" submit-label="Submit" /></template>
