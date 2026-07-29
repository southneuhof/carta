<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from './overtimes.resource'
</script>

<template>
  <FormView title="Ajukan Lembur" description="Isi rincian lembur. Ruas dan karyawan tetap diverifikasi server." :resource="overtimes" success-message="Pengajuan lembur disimpan sebagai draft." />
</template>
