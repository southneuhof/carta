<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { workItems } from '../master-data.resources'
</script>

<template><FormView title="Create Work Items" :resource="workItems" /></template>
