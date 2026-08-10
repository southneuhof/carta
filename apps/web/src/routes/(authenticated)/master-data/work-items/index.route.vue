<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { workItems } from '../master-data.resources'
</script>
<template><ListView title="Work Items" :resource="workItems" /></template>
