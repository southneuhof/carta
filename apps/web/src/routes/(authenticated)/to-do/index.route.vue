<script setup lang="ts">
/**
 * Tasks waiting on the caller.
 *
 * This is the same `notifications` resource the inbox drawer renders, in a second
 * query namespace. Two independent namespaces over one resource is a stated
 * release gate, and this is that proof in production code rather than a fixture:
 * paging or searching here must not move the drawer, and vice versa.
 */
import { ListView } from '@southneuhof/is-vue-framework'
import { notifications } from './notifications.resource'

const list = notifications.list({ namespace: 'to-do' })
</script>

<template>
  <ListView title="To Do" v-bind="list" />
</template>
