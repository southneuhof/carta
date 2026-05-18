<script setup lang="ts">
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import { keyManager } from '@/stores/keyManager'
import { permissions } from '@/stores/permissions'
import { toast } from 'vue-sonner'
import { parseSlug } from '@/utils/common'
import { parse } from '@southneuhof/utilities/parse'
import services from '@/utils/services'
import type { PropType } from 'vue'

const props = defineProps({ article: { type: Object as PropType<Record<string, any>>, required: true }, language: { type: Object, required: true } })
const { data: articleTranslation } = await services.detail('articleTranslation', undefined, { article_id: props.article.id, language: props.language.code })
const {data: [latestLog]} = await services.list('verificationLog', { model: 'articleTranslation', data_id: articleTranslation.id, limit: 1 })
</script>

<template>
  <Card>
    <div class="flex flex-row items-center justify-between">
      <div class="flex flex-row items-center gap-4">
        <p class="text-xl">Detail Artikel</p>
        <template v-if="language.code === 'en' && articleTranslation.status_code === 'DRAFT'">
          <div class="h-[16px] w-[1px] bg-muted"></div>
          <ConfirmationDialog
            :onConfirm="async (setOpen: Function) => {
              const {data: {id: source}} = await services.detail('articleTranslation', undefined, {article_id: props.article.id, language: 'id'})
              const target = articleTranslation.id;
              services.post('articleTranslation/copy', {source_id: source, destination_id: target}).then(res => {
                toast.success('Berhasil menyalin data!')
                keyManager().triggerChange(`article-translation-detail-under`)
                setOpen(false)
              })
            }"
          >
            <template #trigger>
              <button class="text-sm underline font-semibold text-muted"><Icon :size="12" class="underline">content_copy</Icon> Reset dan Salin dari ID</button>
            </template>
          </ConfirmationDialog>
        </template>        
      </div>
      <div class="flex flex-row items-center gap-4">
        <div v-if="latestLog" class="flex flex-col items-end">
          <p class="text-sm text-muted">
            <span v-if="latestLog.action === 'REVISE'" class="font-semibold text-warning">{{ latestLog.action.replace(/_/g, ' ') }}</span>
            <span v-else-if="latestLog.action === 'APPROVE'" class="font-semibold text-success">{{ latestLog.action.replace(/_/g, ' ') }}</span>
            <span v-else class="font-semibold">{{ latestLog.action.replace(/_/g, ' ') }}</span>
            &middot; {{ latestLog.verifier?.name }} &middot; {{ parse('datetime', latestLog.created_at) }}
          </p>
          <p v-if="latestLog.description" class="text-sm italic">"{{ latestLog.description }}"</p>
        </div>
        <template v-if="articleTranslation.status_code === 'PUBLISHED'">
          <Popover align="end">
            <template #trigger>
              <Chip color="success">Published <Icon>expand_more</Icon> </Chip>
            </template>
            <template #content>
              <Card class="flex flex-col gap-1 p-1 outline outline-1 outline-outline/[24%]">
                <ConfirmationDialog
                  :onConfirm="
                    () => {
                      services.post('articleTranslation/create-draft', { article_translation_id: articleTranslation.id }).then((res) => {
                        toast.success('Berhasil membuat draft!')
                        keyManager().triggerChange('article-translation-detail-under')
                      })
                    }
                  "
                >
                  <template #trigger>
                    <Button variant="standard" color="info" class="rounded-lg">Buat Draft <Icon>chevron_right</Icon> </Button>
                  </template>
                </ConfirmationDialog>
              </Card>
            </template>
          </Popover>
          <!-- <Chip v-else color="success">Published</Chip> -->
        </template>
        <template v-else-if="['DRAFT', 'REVIEW'].includes(articleTranslation.status_code)">
          <Popover align="end">
            <template #trigger>
              <Chip v-if="articleTranslation.status_code === 'DRAFT'" color="neutral">Draft <Icon>expand_more</Icon> </Chip>
              <Chip v-else color="warning">Review <Icon>expand_more</Icon></Chip>
            </template>
            <template #content>
              <Card class="flex flex-col gap-1 p-1 outline outline-1 outline-outline/[24%]">
                <DialogForm
                  v-if="articleTranslation.status_code === 'DRAFT'"
                  :fields="['description']"
                  :extraData="{ id: articleTranslation.id, action: 'MARK_AS_DONE' }"
                  targetAPI="articleTranslation/verify?custom"
                  :onSuccess="
                    () => {
                      toast.success('Berhasil memverifikasi artikel!')
                      keyManager().triggerChange('article-translation-detail-under')
                    }
                  "
                >
                  <template #title>
                    <div class="flex flex-col gap-1">
                      <div class="flex flex-row items-center gap-2">
                        <p>Ajukan Verifikasi Artikel</p>
                        <Icon>check</Icon>
                      </div>
                      <p class="text-muted font-normal text-base">Setelah diajukan, artikel akan ditandai sebagai "selesai" dan dapat diverifikasi admin.</p>
                    </div>
                  </template>
                  <template #trigger>
                    <Button variant="standard" color="info" class="rounded-lg">Ajukan Verifikasi <Icon>chevron_right</Icon></Button>
                  </template>
                </DialogForm>
                <DialogForm
                  v-if="articleTranslation.status_code === 'REVIEW'"
                  :fields="['description']"
                  :extraData="{ id: articleTranslation.id, action: 'MARK_AS_UNDONE' }"
                  targetAPI="articleTranslation/verify?custom"
                  :onSuccess="
                    () => {
                      toast.success('Berhasil memverifikasi artikel!')
                      keyManager().triggerChange('article-translation-detail-under')
                    }
                  "
                >
                  <template #title>
                    <div class="flex flex-col gap-1">
                      <div class="flex flex-row items-center gap-2">
                        <p>Kembalikan ke Draft</p>
                        <Icon>refresh</Icon>
                      </div>
                      <p class="text-muted font-normal text-base">Setelah dilakukan aksi ini, status artikel akan kembali ke "draft".</p>
                    </div>
                  </template>
                  <template #trigger>
                    <Button variant="standard" color="info" class="rounded-lg">Kembalikan ke Draft <Icon>refresh</Icon></Button>
                  </template>
                </DialogForm>
                <template v-if="permissions().has('verify-article')">
                  <DialogForm
                    :fields="['description']"
                    :extraData="{ id: articleTranslation.id, action: 'APPROVE' }"
                    targetAPI="articleTranslation/verify?custom"
                    :onSuccess="
                      () => {
                        toast.success('Berhasil memverifikasi artikel!')
                        keyManager().triggerChange('article-translation-detail-under')
                      }
                    "
                  >
                    <template #title>
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-2">
                          <p>Terima Verifikasi Artikel</p>
                          <Icon>check</Icon>
                        </div>
                        <p class="text-base font-normal text-muted">Setelah diverifikasi, artikel akan dipublikasikan di landing page untuk dilihat publik.</p>
                      </div>
                    </template>
                    <template #trigger>
                      <Button variant="standard" color="success" class="rounded-lg">Verifikasi Artikel <Icon>check</Icon> </Button>
                    </template>
                  </DialogForm>
                  <DialogForm
                    :fields="['description']"
                    :extraData="{ id: articleTranslation.id, action: 'RESET' }"
                    targetAPI="articleTranslation/verify?custom"
                    :onSuccess="
                      () => {
                        toast.success('Berhasil mengajukan revisi!')
                        keyManager().triggerChange('article-translation-detail-under')
                      }
                    "
                  >
                    <template #title>
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-2">
                          <p>Hapus Draft</p>
                          <Icon>close</Icon>
                        </div>
                        <p class="text-base font-normal text-muted">
                          Setelah menghapus draft, artikel akan dikembalikan ke keadaan semula sebelum pengubahan. Artikel akan kembali ke bentuk published semula.
                        </p>
                      </div>
                    </template>
                    <template #trigger>
                      <Button variant="standard" color="error" class="rounded-lg">Hapus Draft <Icon>close</Icon></Button>
                    </template>
                  </DialogForm>
                  <!-- <DialogForm
                    :fields="['description']"
                    :extraData="{ id: articleTranslation.id, action: 'REVISE' }"
                    targetAPI="articleTranslation/verify?custom"
                    :onSuccess="
                      () => {
                        toast.success('Berhasil mengajukan revisi!')
                        keyManager().triggerChange('article-translation-detail-under')
                      }
                    "
                  >
                    <template #title>
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-2">
                          <p>Ajukan Revisi</p>
                          <Icon>history</Icon>
                        </div>
                        <p class="text-base font-normal text-muted">
                          Setelah mengajukan revisi, halaman akan dikembalikan ke keadaan semula sebelum pengubahan. Halaman akan tetap dalam status draft.
                        </p>
                      </div>
                    </template>
                    <template #trigger>
                      <Button variant="standard" color="warning" class="rounded-lg">Revisi <Icon>history</Icon></Button>
                    </template>
                  </DialogForm> -->
                </template>
              </Card>
            </template>
          </Popover>
          <!-- <Chip v-else color="neutral">Draft</Chip> -->
        </template>
      </div>
    </div>
    <Form
      targetAPI="articleTranslation"
      :fields="['title', 'slug', 'excerpt', 'thumbnail', 'content']"
      :inputConfig="{
        title: { type: 'text', props: { required: true } },
        slug: {
          type: 'text',
          dependency: {
            fields: ['title'],
            value: {
              generator: ({ title }: any) => parseSlug(title),
              default: ''
            }
          },
          props: { disabled: true }
        },
        content: { type: 'rich-text' },
        excerpt: { type: 'text' },
        thumbnail: { type: 'image' }
      }"
      :fieldsAlias="{
        title: 'Judul',
        slug: 'Kode',
        excerpt: 'Ringkasan',
        thumbnail: 'Foto',
        content: 'Isi Artikel',
      }"
      :disabled="articleTranslation.status_code !== 'DRAFT'"
      :getDetailData="async () => JSON.parse(JSON.stringify(articleTranslation))"
      formType="update"
      :searchParameters="{ article_id: props.article.id, language: props.language.code }"
      :onSuccess="
        () => {
          toast.success('Berhasil menyimpan artikel!')
        }
      "
    />
  </Card>
</template>
