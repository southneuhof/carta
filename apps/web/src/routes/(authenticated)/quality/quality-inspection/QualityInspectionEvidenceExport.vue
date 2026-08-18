<script setup lang="ts">
import { computed } from 'vue'
import QRCode from 'qrcode.vue'
import Printable from '@southneuhof/is-vue-framework/components/utils/Printable.vue'
import { Button, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'

const props = defineProps<{ record: Record<string, any> }>()
const photoNames = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
const photos = computed(() => photoNames.map((name) => (Array.isArray(props.record.documentations) ? props.record.documentations : []).find((photo: Record<string, any>) => photo.name === name) ?? { name, fileAttachment: null }))
const qrValue = computed(() => JSON.stringify({ report: props.record.number, reporter: props.record.createdByUser?.id ?? null }))
</script>

<template>
  <Printable v-if="record.statusCode === 'close'" document-title="Bukti Kerja Inspection/Test">
    <template #trigger="{ handlePrint }">
      <Button type="button" variant="tonal" @click="handlePrint">
        <template #icon><span aria-hidden="true">⇩</span></template>
        Download Bukti Kerja
      </Button>
    </template>
    <template #content>
      <article class="flex flex-col gap-5 bg-white p-8 text-black">
        <header class="flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
          <div>
            <h1 class="text-2xl font-bold">Bukti Kerja Inspection/Test</h1>
            <p class="mt-1">{{ record.number }}</p>
          </div>
          <QRCode :value="qrValue" :size="96" aria-label="Reporter QR identity" />
        </header>
        <section><h2 class="font-semibold">Detail Laporan</h2><p>{{ record.targetDate }} · {{ record.locationZone || '—' }}</p></section>
        <section><h2 class="font-semibold">Prosedur &amp; Penyelesaian</h2><p>{{ record.workMethod || '—' }}</p></section>
        <section>
          <h2 class="font-semibold">Daftar Item Pekerjaan</h2>
          <ul class="list-disc ps-5">
            <li v-for="item in record.workItems ?? []" :key="item.row.id">
              <p>{{ item.workItem?.name }} · {{ item.row.volume }} · {{ item.row.statusCode }}</p>
              <ul class="list-[circle] ps-5">
                <li v-for="snapshot in item.snapshots ?? []" :key="snapshot.id">{{ snapshot.type }} · Criteria: {{ snapshot.criteria || '—' }} · {{ snapshot.procedureCode || '—' }}</li>
              </ul>
            </li>
          </ul>
        </section>
        <section>
          <h2 class="font-semibold">Foto Sudut Pengambilan</h2>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="photo in photos" :key="photo.name">
              <p class="mb-1 font-medium">{{ photo.name }}</p>
              <ImagePreview v-if="photo.fileAttachment" :image-u-r-l="fileUrl(photo.fileAttachment)" :disable-controls="true" class="aspect-video w-full" />
              <p v-else>—</p>
            </div>
          </div>
        </section>
      </article>
    </template>
  </Printable>
</template>
