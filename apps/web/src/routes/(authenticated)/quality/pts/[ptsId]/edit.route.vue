<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { pts } from '../pts.resource'

const route = useRoute('quality-pts-edit')
</script>

<template><FormView v-bind="pts.update({ id: String(route.params.ptsId) })" title="Edit Manual PTS" /></template>
