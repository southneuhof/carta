<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { syllabi } from '../syllabus.resource'
import SyllabusConfigurationForm from '../SyllabusConfigurationForm.vue'

const route = useRoute('orientation-syllabus-detail')
const syllabusId = String(route.params.syllabusId)
</script>

<template>
  <div class="flex flex-col gap-4">
    <DetailView v-bind="syllabi.detail({ id: syllabusId })" title="Detail Silabus" :back-to="{ name: 'orientation-syllabus' }" />
    <SyllabusConfigurationForm :syllabus-id="syllabusId" />
  </div>
</template>
