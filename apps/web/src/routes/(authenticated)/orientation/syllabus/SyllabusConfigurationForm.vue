<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Form } from '@southneuhof/is-vue-framework'
import { Button, Card } from '@southneuhof/is-vue-framework/components/base'
import { learningMaterialLookup } from '../orientation.lookups'
import { syllabusActions } from './syllabus.actions'

const props = defineProps<{ syllabusId: string }>()
const loading = ref(true)
const model = ref<Record<string, unknown>>({})
const fields = {
  isHaveQuiz: { label: 'Ada ujian', form: { renderer: 'switch' } },
  questionType: { label: 'Tipe pertanyaan', form: { renderer: 'text' } },
  minScore: { label: 'Nilai minimal', form: { renderer: 'number' } },
  timeLimit: { label: 'Waktu pengerjaan', form: { renderer: 'number' } },
  isShuffleQuestion: { label: 'Acak pertanyaan', form: { renderer: 'switch' } },
  isShuffleOption: { label: 'Acak jawaban', form: { renderer: 'switch' } },
  quizMaterialIds: {
    label: 'Materi',
    form: {
      renderer: 'lookup',
      source: learningMaterialLookup,
      props: { pick: 'id', view: 'name', multi: true },
      behavior: {
        disabled: ({ draft }: { draft: Record<string, unknown> }) => draft.isHaveQuiz !== true,
        props: () => ({ searchParameters: { syllabusId: props.syllabusId, active: true, quizEnabled: true, excludeFinalQuiz: true } }),
      },
    },
  },
}

function selectedMaterials(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return { learningMaterialId: item, totalQuestion: 0, active: true }
      if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string') return undefined
      const material = item as { id: string; totalQuestion?: unknown }
      return { learningMaterialId: material.id, totalQuestion: Number(material.totalQuestion ?? 0), active: true }
    })
    .filter((item): item is { learningMaterialId: string; totalQuestion: number; active: boolean } => Boolean(item))
}

async function load() {
  loading.value = true
  try {
    const record = (await syllabusActions.detail({ id: props.syllabusId, searchParameters: {} })) as Record<string, unknown>
    const quizMaterials = Array.isArray(record?.quizMaterials) ? (record.quizMaterials as Array<Record<string, unknown>>) : []
    model.value = {
      isHaveQuiz: record?.isHaveQuiz ?? false,
      questionType: record?.questionType ?? undefined,
      minScore: record?.minScore ?? undefined,
      timeLimit: record?.timeLimit ?? undefined,
      isShuffleQuestion: record?.isShuffleQuestion ?? false,
      isShuffleOption: record?.isShuffleOption ?? false,
      quizMaterialIds: quizMaterials.filter((row) => row.active !== false).map((row) => row.learningMaterialId),
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Konfigurasi Silabus could not be loaded.')
  } finally {
    loading.value = false
  }
}

async function submit(input: Record<string, unknown>) {
  const result = await syllabusActions.update(props.syllabusId, {
    isHaveQuiz: Boolean(input.isHaveQuiz),
    questionType: typeof input.questionType === 'string' ? input.questionType : undefined,
    minScore: input.minScore as never,
    timeLimit: input.timeLimit as never,
    isShuffleQuestion: Boolean(input.isShuffleQuestion),
    isShuffleOption: Boolean(input.isShuffleOption),
    quizMaterials: selectedMaterials(input.quizMaterialIds),
  } as never)
  toast.success('Konfigurasi Silabus berhasil disimpan.')
  await load()
  return result
}

onMounted(() => void load())
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="gap-4 p-4">
    <h2 class="font-semibold">Konfigurasi Ujian</h2>
    <div v-if="loading" class="text-sm text-on-surface-variant" role="status">Loading...</div>
    <Form v-else v-model="model" :fields="fields" :submit="submit as never">
      <template #actions="{ submit: save, submitting }"><Button type="button" :disabled="submitting" @click="save">Simpan</Button></template>
    </Form>
  </Card>
</template>
