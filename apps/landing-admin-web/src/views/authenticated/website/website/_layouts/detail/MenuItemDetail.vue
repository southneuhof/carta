<script setup lang="ts">
  import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
  import { languages } from '@/utils/common';
  import services from '@/utils/services';
  import { computed, onMounted, provide, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import ParentSectionGroupEditor from './_layouts/ParentSectionGroupEditor.vue';
  import { keyManager } from '@/stores/keyManager';
  import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue';
  import { toast } from 'vue-sonner';
  import { permissions } from '@/stores/permissions';
  import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue';
  import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue';
  import Table from '@southneuhof/is-vue-framework/components/composites/Table.vue';
  import VerificationLogViewer from '@/features/verification/VerificationLogViewer.vue';
  import { parse } from '@/utils/common';
  import MenuItemIDSelectInput from '@/features/menu/MenuItemIDSelectInput.vue';
  import MenuItemSettings from '../list/_layouts/_layouts/MenuItemSettings.vue';
  import { adminApiBaseURL } from '@/utils/auth-client';

  const [route, router] = [useRoute(), useRouter()]
  const [{data: menuItemData}] = await Promise.all([
    services.detail('menuItem', String(route.query[`${String(route.name)}_id`])),
    
  ])
  
  const activeLanguageIndex = ref(route.query.activeLanguageIndex ? Number(route.query.activeLanguageIndex) : 0)
  onMounted(() => {
    if (!route.query.activeLanguageIndex) {
      router.replace({query: {...route.query, activeLanguageIndex: 0}})
    }
  })
  const pageTranslation = computed(() => {
    return menuItemData.page[0].translations.find((pt: any) => pt.language === languages[activeLanguageIndex.value].code)
  })

  provide('menuItemData', menuItemData)
  provide('pageTranslation', pageTranslation)

  const [{ data: [latestLogID] }, { data: [latestLogEN] }] = await Promise.all([
    services.list('verificationLog', { model: 'pageTranslation', data_id: menuItemData.page[0].translations.find((pt: any) => pt.language === 'id').id, limit: 1 }),
    services.list('verificationLog', { model: 'pageTranslation', data_id: menuItemData.page[0].translations.find((pt: any) => pt.language === 'en').id, limit: 1 })
  ])

  const latestLog = computed(() => {
    if (languages[activeLanguageIndex.value].code === 'id') {
      return latestLogID
    } else {
      return latestLogEN
    }
  })

  const landingPageBaseURL = adminApiBaseURL.replace(/\/api$/, '')

  function openPreview() {
    if (!pageTranslation.value?.id) return
    window.open(`${landingPageBaseURL}/preview/${pageTranslation.value.id}`, '_blank')
  }
</script>

<template>
  <Transition name="fade" appear>
    <div class="flex flex-col gap-4">
      <div class="flex flex-row items-center gap-4 justify-between">
        <div class="flex flex-row items-center gap-2">
          <Button variant="standard" @click="() => $router.push({query: {...$route.query, [`${String($route.name)}_view`]: undefined, [`${String($route.name)}_id`]: undefined}})"><Icon>arrow_back</Icon></Button>
          <div class="flex flex-col gap-1">
            <div class="flex flex-row items-center gap-2">
              <p class="text-xl font-bold">{{ menuItemData.translations.find((t: any) => t.language === 'id').name }}</p>
              <Icon v-if="!menuItemData.visible" :size="14" class="text-muted">visibility_off</Icon>
              <template v-if="permissions().has('update-menuItem')">
                <div class="h-[16px] w-[1px] bg-muted"></div>
                <Modal>
                  <template #trigger>
                    <button class="text-sm font-semibold text-muted flex items-center justify-center"><Icon :size="14">settings</Icon></button>
                  </template>
                  <template #content>
                    <MenuItemSettings :menuItem="menuItemData"/>
                  </template>
                </Modal>
              </template>
              <div class="h-[16px] w-[1px] bg-muted"></div>
              <button @click="openPreview" class="text-sm font-semibold text-muted flex items-center justify-center gap-1">Preview <Icon :size="12">open_in_new</Icon></button>
            </div>
            <div class="flex flex-row items-center gap-6">
              <div class="flex flex-row items-center gap-2">
                <button
                  v-for="(language, index) in languages"
                  class="text-sm font-semibold"
                  :class="activeLanguageIndex === index ? 'text-primary' : 'text-muted'"
                  @click="() => {
                    activeLanguageIndex = index
                    $router.replace({query: {...$route.query, activeLanguageIndex: index}})
                  }"
                >
                  {{ language.name }}
                </button>
              </div>
              <template v-if="menuItemData.page[0].translations.find((pt: any) => pt.language === languages[activeLanguageIndex].code)?.status_code === 'DRAFT'">
                <MenuItemIDSelectInput
                  :onConfirm="async (id: string | undefined) => {
                    const {data: selectedMenuItem} = await services.detail('menuItem', id)
                    const source = selectedMenuItem?.page?.[0]?.translations?.find((pt: any) => pt.language === languages[activeLanguageIndex].code)?.sectionGroups[0]?.id
                    if (!source) {
                      toast.error('Menu sumber tidak memiliki halaman!')
                      return
                    }
                    const target = menuItemData.page[0].translations.find((pt: any) => pt.language === languages[activeLanguageIndex].code)?.sectionGroups[0]?.id;
                    services.post('sectionGroup/copy', {source_id: source, destination_id: target}).then(res => {
                      toast.success('Berhasil menyalin data!')
                      keyManager().triggerChange(`sectionGroup-${target}`)
                    })
                  }"
                >
                  <template #trigger>
                    <button class="text-sm underline font-semibold text-muted"><Icon :size="12" class="underline">content_copy</Icon> Reset dan Salin dari Halaman Lain</button>
                  </template>
                </MenuItemIDSelectInput>
                <template v-if="activeLanguageIndex === 1">
                  <div class="h-[16px] w-[1px] bg-muted"></div>
                  <ConfirmationDialog
                    :onConfirm="(setOpen: Function) => {
                      const source = menuItemData.page[0].translations.find((pt: any) => pt.language === 'id')?.sectionGroups[0]?.id;
                      const target = menuItemData.page[0].translations.find((pt: any) => pt.language === 'en')?.sectionGroups[0]?.id;
                      services.post('sectionGroup/copy', {source_id: source, destination_id: target}).then(res => {
                        toast.success('Berhasil menyalin data!')
                        keyManager().triggerChange(`sectionGroup-${target}`)
                        setOpen(false)
                      })
                    }"
                  >
                    <template #trigger>
                      <button class="text-sm underline font-semibold text-muted"><Icon :size="12" class="underline">content_copy</Icon> Reset dan Salin dari ID</button>
                    </template>
                  </ConfirmationDialog>
                </template>
              </template>
            </div>
          </div>
        </div>
        <div class="flex flex-row items-center gap-4">
          <!-- <Button
            v-if="pageTranslation?.id"
            variant="outlined"
            color="info"
            class="rounded-full"
            @click="openPreview"
          >
            Preview <Icon>open_in_new</Icon>
          </Button> -->
          <div v-if="latestLog" class="flex flex-col items-end">
            <p class="text-sm text-muted">
              <span v-if="latestLog.action === 'REVISE'" class="font-semibold text-warning">{{ latestLog.action.replace(/_/g, ' ') }}</span>
              <span v-else-if="latestLog.action === 'APPROVE'" class="font-semibold text-success">{{ latestLog.action.replace(/_/g, ' ') }}</span>
              <span v-else class="font-semibold">{{ latestLog.action.replace(/_/g, ' ') }}</span>
              &middot; {{ latestLog.verifier?.name }} &middot; {{ parse('datetime', latestLog.created_at) }}
            </p>
            <p v-if="latestLog.description" class="text-sm italic">"{{ latestLog.description }}"</p>
          </div>
          <template v-if="pageTranslation.status_code === 'PUBLISHED'">
            <Popover align="end">
              <template #trigger>
                <Chip color="success">Published <Icon>expand_more</Icon></Chip>
              </template>
              <template #content>
                <Card class="outline outline-1 outline-outline/[24%] p-1 flex flex-col gap-1">
                  <ConfirmationDialog
                    :onConfirm="() => {
                      services.post('pageTranslation/create-draft', {page_translation_id: pageTranslation.id}).then(res => {
                        toast.success('Berhasil membuat draft!')
                        keyManager().triggerChange('website')
                      })
                    }"
                  >
                    <template #trigger>
                      <Button variant="standard" color="info" class="rounded-lg">Buat Draft <Icon>chevron_right</Icon></Button>
                    </template>
                  </ConfirmationDialog>
                </Card>
              </template>
            </Popover>
            <!-- <Chip v-else color="success">Published</Chip> -->
          </template>
          <template v-else-if="['DRAFT', 'REVIEW'].includes(pageTranslation.status_code)">
            <Popover align="end">
              <template #trigger>
                <Chip v-if="pageTranslation.status_code === 'DRAFT'" color="neutral">Draft <Icon>expand_more</Icon></Chip>
                <Chip v-else color="warning">Review <Icon>expand_more</Icon></Chip>
              </template>
              <template #content>
                <Card class="outline outline-1 outline-outline/[24%] p-1 flex flex-col gap-1">
                  <DialogForm
                    v-if="pageTranslation.status_code === 'DRAFT'"
                    :fields="['description']"
                    :extraData="{id: pageTranslation.id, action: 'MARK_AS_DONE'}"
                    targetAPI="pageTranslation/verify?custom"
                    :onSuccess="() => {
                      toast.success('Berhasil mengajukan verifikasi halaman!')
                      keyManager().triggerChange('website')
                    }"
                  >
                    <template #title>
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-2">
                          <p>Ajukan Verifikasi Halaman</p>
                          <Icon>check</Icon>
                        </div>
                        <p class="text-muted font-normal text-base">Setelah diajukan, halaman akan ditandai sebagai "selesai" dan dapat diverifikasi admin.</p>
                      </div>
                    </template>
                    <template #trigger>
                      <Button variant="standard" color="info" class="rounded-lg">Ajukan Verifikasi <Icon>chevron_right</Icon></Button>
                    </template>
                  </DialogForm>
                  <DialogForm
                    v-if="pageTranslation.status_code === 'REVIEW'"
                    :fields="['description']"
                    :extraData="{id: pageTranslation.id, action: 'MARK_AS_UNDONE'}"
                    targetAPI="pageTranslation/verify?custom"
                    :onSuccess="() => {
                      toast.success('Berhasil mengajukan verifikasi halaman!')
                      keyManager().triggerChange('website')
                    }"
                  >
                    <template #title>
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-2">
                          <p>Kembalikan ke Draft</p>
                          <Icon>refresh</Icon>
                        </div>
                        <p class="text-muted font-normal text-base">Setelah dilakukan aksi ini, status halaman akan kembali ke "draft".</p>
                      </div>
                    </template>
                    <template #trigger>
                      <Button variant="standard" color="info" class="rounded-lg">Kembalikan ke Draft <Icon>refresh</Icon></Button>
                    </template>
                  </DialogForm>
                  <template v-if="permissions().has('verify-page')">
                    <DialogForm
                      :fields="['description']"
                      :extraData="{id: pageTranslation.id, action: 'APPROVE'}"
                      targetAPI="pageTranslation/verify?custom"
                      :onSuccess="() => {
                        toast.success('Berhasil memverifikasi halaman!')
                        keyManager().triggerChange('website')
                      }"
                    >
                      <template #title>
                        <div class="flex flex-col gap-1">
                          <div class="flex flex-row items-center gap-2">
                            <p>Terima Verifikasi Halaman</p>
                            <Icon>check</Icon>
                          </div>
                          <p class="text-muted font-normal text-base">Setelah diverifikasi, halaman akan dipublikasikan di landing page untuk dilihat publik.</p>
                        </div>
                      </template>
                      <template #trigger>
                        <Button variant="standard" color="success" class="rounded-lg">Verifikasi Halaman <Icon>check</Icon></Button>
                      </template>
                    </DialogForm>
                    <DialogForm
                      :fields="['description']"
                      :extraData="{id: pageTranslation.id, action: 'RESET'}"
                      targetAPI="pageTranslation/verify?custom"
                      :onSuccess="() => {
                        toast.success('Berhasil menghapus draft!')
                        keyManager().triggerChange('website')
                      }"
                    >
                      <template #title>
                        <div class="flex flex-col gap-1">
                          <div class="flex flex-row items-center gap-2">
                            <p>Hapus Draft</p>
                            <Icon>close</Icon>
                          </div>
                          <p class="text-muted font-normal text-base">Setelah menghapus draft, halaman akan dikembalikan ke keadaan semula sebelum pengubahan. Halaman akan kembali ke bentuk published semula.</p>
                        </div>
                      </template>
                      <template #trigger>
                        <Button variant="standard" color="error" class="rounded-lg">Hapus Draft <Icon>close</Icon></Button>
                      </template>
                    </DialogForm>
                    <!-- <DialogForm
                      :fields="['description']"
                      :extraData="{id: pageTranslation.id, action: 'REVISE'}"
                      targetAPI="pageTranslation/verify?custom"
                      :onSuccess="() => {
                        toast.success('Berhasil mengajukan revisi!')
                        keyManager().triggerChange('website')
                      }"
                    >
                      <template #title>
                        <div class="flex flex-col gap-1">
                          <div class="flex flex-row items-center gap-2">
                            <p>Ajukan Revisi</p>
                            <Icon>history</Icon>
                          </div>
                          <p class="text-muted font-normal text-base">Setelah mengajukan revisi, halaman akan dikembalikan ke keadaan semula sebelum pengubahan. Halaman akan tetap dalam status draft.</p>
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
      <Suspense v-if="activeLanguageIndex != null" :key="activeLanguageIndex" :timeout="0">
        <template #fallback>
          <div class="w-full flex items-center justify-center h-fit"><Spinner/></div>
        </template>
        <ParentSectionGroupEditor :sectionGroupID="menuItemData.page[0].translations.find((pt: any) => pt.language === languages[activeLanguageIndex].code)?.sectionGroups[0].id" :key="keyManager().value[`sectionGroup-${menuItemData.page[0].translations.find((pt: any) => pt.language === languages[activeLanguageIndex].code)?.sectionGroups[0].id}`]"/>
      </Suspense>
    </div>
  </Transition>
</template>
