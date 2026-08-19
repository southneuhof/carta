<script setup lang="ts">
import { computed } from 'vue'
import QRCode from 'qrcode.vue'
import Printable from '@southneuhof/is-vue-framework/components/utils/Printable.vue'
import { Button, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'
import { acceptanceCriteriaLabels, itpTypeLabels, resultLabels } from './quality-inspection.schema'

const props = defineProps<{ record: Record<string, any> }>()

const photoNames = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
const criteriaGroups = [
  { type: 'material', label: acceptanceCriteriaLabels.material },
  { type: 'process', label: acceptanceCriteriaLabels.process },
  { type: 'product', label: acceptanceCriteriaLabels.product },
] as const

function display(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value)
}

function relation(record: Record<string, any>, key: string, fallbackKey: string) {
  const related = record[key]
  if (related && typeof related === 'object' && typeof related.name === 'string') return related.name
  return display(record[fallbackKey])
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function resultLabel(value: unknown) {
  if (value === 'waiting') return 'Menunggu'
  return resultLabels[String(value)] ?? display(value)
}

function snapshotTypeLabel(value: unknown) {
  return itpTypeLabels[String(value)] ?? display(value)
}

function snapshots(item: Record<string, any>) {
  return Array.isArray(item.snapshots) ? item.snapshots : []
}

function criteria(item: Record<string, any>, type: string) {
  return snapshots(item)
    .filter((snapshot: Record<string, any>) => snapshot.type === type)
    .map((snapshot: Record<string, any>) => snapshot.criteria)
    .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
}

function latestVerification(item: Record<string, any>) {
  const events = Array.isArray(item.verifications) ? item.verifications : []
  return events[events.length - 1] ?? item.row ?? {}
}

function fileKey(value: unknown) {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object' && typeof (value as { path?: unknown }).path === 'string') return (value as { path: string }).path
  return undefined
}

function imageUrl(value: unknown) {
  if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') return (value as { url: string }).url
  const key = fileKey(value)
  return key ? fileUrl(key) : undefined
}

const reporterName = computed(() => props.record.createdByUser?.name ?? props.record.createdByName ?? '—')
const reportDate = computed(() => formatDate(props.record.createdAt))
const qrValue = computed(() => `Dilaporkan oleh ${reporterName.value} pada ${reportDate.value}`)
const photos = computed(() => photoNames.map((name) => (Array.isArray(props.record.documentations) ? props.record.documentations : []).find((photo: Record<string, any>) => photo.name === name) ?? { name, fileAttachment: null, description: null }))
const canPrint = computed(() => props.record.statusCode === 'close' && props.record.stepCode === 'close')
</script>

<template>
  <Printable v-if="canPrint" document-title="Bukti Kerja Inspection/Test">
    <template #trigger="{ handlePrint }">
      <Button type="button" variant="tonal" @click="handlePrint">
        <template #icon><span aria-hidden="true">⇩</span></template>
        Download Bukti Kerja
      </Button>
    </template>
    <template #content>
      <article data-testid="quality-inspection-evidence" class="flex flex-col gap-6 bg-white p-8 text-black">
        <header class="flex items-start justify-between gap-6 border-b border-slate-300 pb-4">
          <div>
            <h1 class="text-2xl font-bold">Bukti Kerja Inspection/Test</h1>
            <p class="mt-1">{{ display(record.number) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <QRCode :value="qrValue" :size="96" aria-label="Identitas QR pelapor" />
            <p data-testid="reporter-qr-text" class="max-w-48 text-sm">{{ qrValue }}</p>
          </div>
        </header>

        <section>
          <h2 class="mb-3 text-lg font-semibold">Detail Laporan</h2>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt class="font-medium">Nomor Laporan</dt><dd>{{ display(record.number) }}</dd></div>
            <div><dt class="font-medium">Dilaporkan Oleh</dt><dd>{{ reporterName }}</dd></div>
            <div><dt class="font-medium">Tanggal Laporan</dt><dd>{{ reportDate }}</dd></div>
            <div><dt class="font-medium">Divisi</dt><dd>{{ relation(record, 'division', 'divisionName') }}</dd></div>
            <div><dt class="font-medium">Proyek</dt><dd>{{ relation(record, 'project', 'projectName') }}</dd></div>
            <div><dt class="font-medium">Kategori Pekerjaan</dt><dd>{{ relation(record, 'qualityWorkCategory', 'qualityWorkCategoryName') }}</dd></div>
            <div><dt class="font-medium">Jenis Pekerjaan</dt><dd>{{ relation(record, 'workItemCategory', 'workItemCategoryName') }}</dd></div>
            <div><dt class="font-medium">Target Pelaksanaan</dt><dd>{{ display(record.targetDate) }}</dd></div>
            <div><dt class="font-medium">Area/Zona Kerja</dt><dd>{{ display(record.locationZone) }}</dd></div>
          </dl>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold">Prosedur &amp; Penyelesaian</h2>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt class="font-medium">Inspection Point</dt><dd>{{ display(record.inspectionPointName ?? record.inspectionPointCode) }}</dd></div>
            <div><dt class="font-medium">Prosedur / Metode Kerja</dt><dd>{{ display(record.workMethod) }}</dd></div>
          </dl>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold">Daftar Item Pekerjaan</h2>
          <div class="flex flex-col gap-5">
            <article v-for="item in record.workItems ?? []" :key="item.row.id" data-testid="evidence-item" class="break-inside-avoid border-b border-slate-300 pb-5 last:border-0">
              <h3 class="mb-3 font-semibold">{{ display(item.workItem?.name) }}</h3>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><dt class="font-medium">Volume</dt><dd>{{ display(item.row?.volume) }}</dd></div>
                <div><dt class="font-medium">Satuan</dt><dd>{{ display(item.workItem?.uomName) }}</dd></div>
                <div><dt class="font-medium">Hasil Inspeksi</dt><dd>{{ resultLabel(item.row?.statusCode) }}</dd></div>
                <div class="col-span-2"><dt class="font-medium">Verifikasi</dt><dd v-if="latestVerification(item).verifiedAt">Inspeksi dilakukan oleh {{ display(latestVerification(item).verifierName ?? latestVerification(item).verifierId ?? latestVerification(item).verifiedBy) }} pada {{ display(latestVerification(item).verifiedAt) }}</dd><dd v-else>—</dd></div>
              </dl>
              <div class="mt-4 grid grid-cols-3 gap-4">
                <div v-for="group in criteriaGroups" :key="group.type" :data-criteria-type="group.type">
                  <h4 class="font-medium">{{ group.label }}</h4>
                  <ol v-if="criteria(item, group.type).length" class="mt-1 list-decimal ps-5 text-sm">
                    <li v-for="entry in criteria(item, group.type)" :key="entry">{{ entry }}</li>
                  </ol>
                  <p v-else class="mt-1 text-sm">—</p>
                </div>
              </div>

              <div class="mt-5">
                <h4 class="font-medium">Data ITP Tersimpan</h4>
                <div v-if="snapshots(item).length" class="mt-2 flex flex-col gap-3">
                  <article v-for="snapshot in snapshots(item)" :key="snapshot.id" class="break-inside-avoid border border-slate-300 p-3 text-sm">
                    <h5 class="font-medium">{{ snapshotTypeLabel(snapshot.type) }}</h5>
                    <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div><dt class="font-medium">Kriteria/Tolok Ukur Penerimaan</dt><dd>{{ display(snapshot.criteria) }}</dd></div>
                      <div><dt class="font-medium">Kode Prosedur</dt><dd>{{ display(snapshot.procedureCode) }}</dd></div>
                      <div><dt class="font-medium">Spesifikasi</dt><dd>{{ display(snapshot.specification) }}</dd></div>
                      <div><dt class="font-medium">Metode</dt><dd>{{ display(snapshot.method) }}</dd></div>
                      <div><dt class="font-medium">Frekuensi</dt><dd>{{ display(snapshot.frequency) }}</dd></div>
                      <div class="col-span-2"><dt class="font-medium">Deskripsi</dt><dd>{{ display(snapshot.description) }}</dd></div>
                    </dl>
                    <div v-if="imageUrl(snapshot.imgDocumentation)" class="mt-3 max-w-sm">
                      <p class="mb-1 font-medium">Foto Dokumentasi</p>
                      <ImagePreview :image-u-r-l="imageUrl(snapshot.imgDocumentation)" :disable-controls="true" class="aspect-video w-full" />
                    </div>
                    <div v-for="inspector in snapshot.inspectors ?? []" :key="inspector.id" class="mt-3 border-t border-slate-300 pt-3">
                      <p><span class="font-medium">Jenis Inspektor:</span> {{ display(inspector.inspectorTypeName) }}</p>
                      <ul v-if="inspector.points?.length" class="mt-1 list-disc ps-5">
                        <li v-for="point in inspector.points" :key="point.id">{{ display(point.inspectionPointName ?? point.inspectionPointCode) }}: {{ point.value ? 'Ya' : 'Tidak' }}</li>
                      </ul>
                      <p v-else class="mt-1">Inspection Point: —</p>
                    </div>
                  </article>
                </div>
                <p v-else class="mt-2 text-sm">Tidak ada data ITP tersimpan.</p>
              </div>
            </article>
            <p v-if="!(record.workItems ?? []).length" class="text-sm">Tidak ada item pekerjaan.</p>
          </div>
        </section>

        <section data-testid="documentation-section" class="break-before-page" style="break-before: page; page-break-before: always;">
          <h2 class="mb-3 text-lg font-semibold">Dokumentasi</h2>
          <div class="grid grid-cols-2 gap-4">
            <article v-for="photo in photos" :key="photo.name" data-testid="documentation-slot" class="break-inside-avoid border border-slate-300 p-3">
              <h3 class="font-medium">{{ photo.name }}</h3>
              <ImagePreview v-if="imageUrl(photo.fileAttachment)" :image-u-r-l="imageUrl(photo.fileAttachment)" :disable-controls="true" class="mt-2 aspect-video w-full" />
              <p v-else class="mt-2 flex aspect-video items-center justify-center bg-slate-100 text-sm">—</p>
              <p class="mt-2 text-sm"><span class="font-medium">Deskripsi:</span> {{ display(photo.description) }}</p>
            </article>
          </div>
        </section>
      </article>
    </template>
  </Printable>
</template>
