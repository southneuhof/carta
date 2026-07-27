<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from './overtimes.resource'
</script>

<template>
  <FormView title="Ajukan Lembur" :resource="overtimes" success-message="Pengajuan lembur tersimpan sebagai draft." />
</template>
