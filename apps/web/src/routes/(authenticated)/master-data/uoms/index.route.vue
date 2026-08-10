<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { uoms } from '../master-data.resources'
</script>
<template><ListView title="UOMs" :resource="uoms" /></template>
