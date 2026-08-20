<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { findingTypes } from './hsse-observation.resource'

const form = { ...findingTypes.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Jenis Temuan" submit-label="Submit" /></template>
