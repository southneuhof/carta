<script setup lang="ts">
/**
 * Acceptance fixture for the design requirements that are easiest to regress
 * during simplification. It is a framework contract test, not demo code, and it
 * is deliberately not reachable from production navigation.
 *
 * It proves:
 *  - two different resources own independent URL query namespaces with no
 *    `v-model:query`;
 *  - one resource mounted twice needs an explicit `namespace` only on the
 *    second instance;
 *  - synchronous/offline and asynchronous loaders use the same contract;
 *  - a local query object never touches the URL;
 *  - an exceptional `read` field and a `behavior` option coexist with ordinary
 *    fields that need neither.
 */
import { ref } from 'vue'
import { defineFields, defineResource, Form, Table } from '@southneuhof/is-vue-framework'

interface Row extends Record<string, unknown> {
  id: string
  name: string
  rel_owner_name: string
}

const rows: Row[] = [
  { id: '1', name: 'Pertama', rel_owner_name: 'Budi' },
  { id: '2', name: 'Kedua', rel_owner_name: 'Sari' },
]

const fields = defineFields<Row>()({
  name: { label: 'Nama', table: { sortable: true } },
  owner: { label: 'Pemilik', read: (record) => record.rel_owner_name },
})

/** Ordinary resource: everything it needs is the catalog plus a loader. */
const alpha = defineResource<Row>({
  key: 'alpha',
  fields,
  operations: { list: async () => ({ data: rows, total: 40, limit: 10 }) },
})

const beta = defineResource<Row>({
  key: 'beta',
  fields,
  operations: { list: async () => ({ data: rows, total: 40, limit: 10 }) },
})

/** The same contract, resolved synchronously with no promise in sight. */
const offline = defineResource<Row>({
  key: 'offline',
  fields,
  operations: { list: () => ({ data: rows, total: 40, limit: 10 }) },
})

const localQuery = ref<Record<string, unknown>>({ page: 1, limit: 10 })

interface Draft extends Record<string, unknown> {
  kind?: string
  reason?: string
}

const draftFields = defineFields<Draft>()({
  kind: { label: 'Jenis', form: { renderer: undefined } },
  reason: {
    label: 'Alasan',
    form: { behavior: { visible: ({ draft }) => draft.kind === 'lain' } },
  },
})

const submitted = ref<Draft>()
</script>

<template>
  <div>
    <section data-fixture="two-resources">
      <Table v-bind="alpha.table()" />
      <Table v-bind="beta.table()" />
    </section>

    <section data-fixture="duplicate-resource">
      <Table v-bind="alpha.table()" />
      <Table v-bind="alpha.table({ namespace: 'archived' })" />
    </section>

    <section data-fixture="offline">
      <Table v-bind="offline.table()" />
    </section>

    <section data-fixture="local-query">
      <Table :fields="fields" :load="() => ({ data: rows, total: 40, limit: 10 })" :query="localQuery" />
    </section>

    <section data-fixture="draft">
      <Form :fields="draftFields" :initial-data="{ kind: 'biasa' }" :submit="(draft: Draft) => (submitted = draft)" />
    </section>
  </div>
</template>
