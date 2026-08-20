<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { learningMaterials } from '../learning-materials.resource'

const route = useRoute('orientation-learning-materials-edit')
const form = { ...learningMaterials.update({ id: String(route.params.learningMaterialId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Materi" submit-label="Submit" /></template>
