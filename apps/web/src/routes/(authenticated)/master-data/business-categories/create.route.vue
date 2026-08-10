<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../master-data.resources'
</script>

<template><FormView title="Create Business Categories" :resource="businessCategories" /></template>
