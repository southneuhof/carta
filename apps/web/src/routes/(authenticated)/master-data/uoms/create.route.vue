<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { uoms } from '../master-data.resources'
</script>

<template><FormView title="Create UOMs" :resource="uoms" /></template>
