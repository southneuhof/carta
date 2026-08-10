<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { pts } from './pts.resource'
</script>

<template>
  <ListView title="PTS" :resource="pts" />
</template>
