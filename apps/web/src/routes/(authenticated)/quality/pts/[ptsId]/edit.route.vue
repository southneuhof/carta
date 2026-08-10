<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { pts } from '../pts.resource'

const route = useRoute('quality-pts-edit')
</script>

<template>
  <FormView title="Update PTS Report" :resource="pts" :id="String(route.params.ptsId)" />
</template>
