<script setup lang="ts">
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import { keyManager } from '@/stores/keyManager'
import services from '@/utils/services'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import { toast } from 'vue-sonner'
import MenuItemSettings from './_layouts/MenuItemSettings.vue'
import { permissions } from '@/stores/permissions'
import { menuItemFormConfig } from '@/configs/menuItemFormConfig'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Dialog from '@southneuhof/is-vue-framework/components/base/Dialog.vue'

const props = defineProps({
  level: { type: Number, required: true },
  parentId: String,
})

const [route, router] = [useRoute(), useRouter()]

const modelValue = defineModel<string>()

const [{ data: menuItemRaw }, { data: menuItemData }] = await Promise.all([
  services.list('menuItem', { level: props.level, parent_id: props.parentId, limit: 999 }),
  props.parentId ? services.detail('menuItem', props.parentId) : { data: {} },
])
const menuItem = ref(menuItemRaw)

const activeTabIndex = ref(menuItem.value[Number(route.query[`menu_level_${props.level}_tab`])] ? Number(route.query[`menu_level_${props.level}_tab`]) : 0)

watch(
  activeTabIndex,
  () => {
    if (!menuItemRaw.length) modelValue.value = undefined
    else if (activeTabIndex.value != null) {
      modelValue.value = menuItemRaw[activeTabIndex.value]?.id
    }
  },
  { immediate: true }
)

const isLoadingReordering = ref(false)
const roleLabels: Record<string, string> = {
  home: 'Beranda',
  help_center: 'Pusat Bantuan',
  document_request: 'Req. Dok.',
  project_list: 'Dft. Proyek',
}

function handleSectionReorder(event: any) {
  isLoadingReordering.value = true
  if (!event.moved) return
  if (event.moved.newIndex != event.moved.oldIndex) {
    services
      .put('menuItem/reorder', { old_order: event.moved.oldIndex + 1, new_order: event.moved.newIndex + 1, id: event.moved.element.id })
      .then(() => {
        isLoadingReordering.value = false
      })
      .catch((err) => {
        toast.error('Gagal mengubah urutan!')
        isLoadingReordering.value = false
      })
  }
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="flex flex-col gap-4 w-full">
      <DialogForm
        v-if="!menuItem.length && level === 1"
        v-bind="menuItemFormConfig"
        :extraData="{ parent_id: parentId }"
        targetAPI="menuItem"
        :onSuccess="
          () => {
            keyManager().triggerChange(`menu_item_view_${level}`)
          }
        "
      >
        <template #title> Tambah Menu </template>
        <template #trigger>
          <Card class="-mt-2 h-fit w-full flex-row items-center justify-center gap-2 outline outline-1 outline-outline/[24%]" color="primaryContainer">
            <Icon name="add"></Icon>
            <p>Tambah menu</p>
          </Card>
        </template>
      </DialogForm>
      <Card v-if="menuItem.length" class="h-fit flex-col items-center justify-center">
        <div class="w-full">
          <Draggable v-model="menuItem" class="flex flex-col gap-2" item-key="id" @change="handleSectionReorder">
            <template #item="{ element: item, index }">
              <Card
                @click="
                  () => {
                    const query = { ...$route.query }
                    // Set current level tab
                    query[`menu_level_${level}_tab`] = index
                    // Reset all subsequent levels up to level 3
                    for (let i = level + 1; i <= 3; i++) {
                      query[`menu_level_${i}_tab`] = '0'
                    }
                    $router.replace({ query })
                    activeTabIndex = index
                  }
                "
                :color="index === activeTabIndex ? 'primary' : 'surfaceContainer'"
                class="flex flex-row items-center justify-between"
              >
                <div class="flex w-full flex-row items-center justify-between gap-2">
                  <div class="flex flex-row items-center gap-2">
                    <p :class="{ 'text-muted': !item.can_edit && index !== activeTabIndex }">{{ item.translations.find((item: any) => item.language === 'id')?.name }}</p>
                    <Chip v-if="item.role" color="primary" variant="tonal">{{ roleLabels[item.role] ?? item.role }}</Chip>
                  </div>
                  <div class="z-[50] flex flex-row items-center gap-2">
                    <div :class="index === activeTabIndex ? '' : 'text-muted'" class="flex flex-row items-center gap-4">
                      <!-- <div v-if="(item.page) && ((item.page?.['id']?.status_code != 'PUBLISHED') || (item.page?.['en']?.status_code != 'PUBLISHED'))" class="flex flex-row items-center gap-1">
                        <Icon>warning</Icon>
                        <p v-if="item.page['id']?.status_code != 'PUBLISHED'">ID</p>
                        <p v-if="item.page['en']?.status_code != 'PUBLISHED'">EN</p>
                      </div> -->
                      <Icon v-if="!item.visible" :class="index === activeTabIndex ? '' : 'text-muted'" name="eye-off"/>
                      <Chip v-if="item.page" color="neutral">
                        <div class="flex flex-row items-center gap-1 font-normal">
                          <p
                            :class="{
                              'text-muted/20': item.page?.['id']?.status_code === 'DRAFT',
                              'text-warning/70': item.page?.['id']?.status_code === 'REVIEW',
                              'text-success font-semibold': item.page?.['id']?.status_code === 'PUBLISHED',
                            }"
                          >
                            ID
                          </p>
                          <p class="text-muted">/</p>
                          <p
                            :class="{
                              'text-muted/50': item.page?.['en']?.status_code === 'DRAFT',
                              'text-warning/70': item.page?.['en']?.status_code === 'REVIEW',
                              'text-success font-semibold': item.page?.['en']?.status_code === 'PUBLISHED',
                            }"
                          >
                            EN
                          </p>
                        </div>
                      </Chip>
                    </div>
                    <Popover v-if="permissions().has('update-menuItem') || permissions().has('delete-menuItem')">
                      <template #trigger>
                        <Button kind="icon" :variant="index === activeTabIndex ? 'filled' : 'standard'">
                          <template #icon>
                            <Icon name="more"></Icon>
                          </template>
                        </Button>
                      </template>
                      <template #content>
                        <Card class="gap-1 rounded-md p-1 outline outline-1 outline-outline/[38%]">
                          <ConfirmationDialog
                            v-if="permissions().has('delete-menuItem')"
                            :onConfirm="
                              () => {
                                services.delete('menuItem', { id: item.id }).then((res) => {
                                  toast.success('Berhasil menghapus menu!')
                                  keyManager().triggerChange(`menu_item_view_${level}`)
                                })
                              }
                            "
                          >
                            <template #trigger>
                              <Card class="flex-row items-center gap-4 rounded-md p-2" color="errorContainer">
                                <Icon name="delete-bin"></Icon>
                                <p>Hapus</p>
                              </Card>
                            </template>
                          </ConfirmationDialog>
                          <Dialog v-if="permissions().has('update-menuItem')">
                            <template #trigger>
                              <Card class="flex-row items-center gap-4 rounded-md p-2">
                                <Icon name="settings"></Icon>
                                <p>Pengaturan Menu</p>
                              </Card>
                            </template>
                            <template #content>
                              <MenuItemSettings :menuItem="item"/>
                            </template>
                          </Dialog>
                        </Card>
                      </template>
                    </Popover>
                    <!-- <div v-else class="w-[34px] aspect-square"></div> -->
                  </div>
                </div>
              </Card>
            </template>
          </Draggable>
        </div>
        <div v-if="permissions().has('create-menuItem')" class="w-full">
          <DialogForm
            v-bind="menuItemFormConfig"
            :extraData="{ parent_id: parentId }"
            targetAPI="menuItem"
            :onSuccess="
              () => {
                keyManager().triggerChange(`menu_item_view_${level}`)
              }
            "
          >
            <template #title> Tambah Menu </template>
            <template #trigger>
              <Card class="-mt-2 h-fit w-full flex-row items-center justify-center gap-2 outline outline-1 outline-outline/[24%]" color="primaryContainer">
                <Icon name="add"></Icon>
                <p>Tambah menu</p>
              </Card>
            </template>
          </DialogForm>
        </div>
      </Card>
      <template v-if="menuItemData.can_edit">
        <template v-if="menuItemData.menu_item_type === 'page'">
          <p v-if="menuItem.length" class="text-sm text-muted text-center">dan</p>
          <div v-if="![4, 1].includes(level) && !menuItem.length" class="w-full">
            <DialogForm
              v-bind="menuItemFormConfig"
              :extraData="{ parent_id: parentId }"
              targetAPI="menuItem"
              :onSuccess="
                () => {
                  keyManager().triggerChange(`menu_item_view_${level}`)
                }
              "
            >
              <template #title> Tambah Submenu {{ menuItemData.translations?.find((item: any) => item.language === 'id')?.title }} </template>
              <template #trigger>
                <Card class="h-fit w-full flex-row items-center justify-center gap-2 outline outline-1 outline-outline/[24%]" color="primaryContainer">
                  <Icon name="add">add</Icon>
                  <p>Tambah submenu</p>
                </Card>
              </template>
            </DialogForm>
          </div>
          <p v-if="level != 4 && !menuItemData.page_id && !menuItem.length" class="text-sm text-muted text-center">atau</p>
          <div class="flex flex-col items-center gap-2">
            <template v-if="menuItemData.id">
              <ConfirmationDialog
                v-if="!menuItemData.has_page"
                :onConfirm="
                  () => {
                    services.create('page', { menu_item_id: menuItemData.id }).then((res) => {
                      toast.success('Berhasil membuat halaman!')
                      keyManager().triggerChange(`menu_item_view_${level}`)
                    })
                  }
                "
              >
                <template #trigger>
                  <Card v-if="!menuItemData.has_page" class="h-fit w-full flex-row items-center justify-center gap-2 outline outline-1 outline-info bg-transparent" color="infoContainer">
                    <Icon name="file-edit"></Icon>
                    <p><span class="">Buat halaman di</span> <span class="font-bold">{{ menuItemData.translations.find((item: any) => item.language === 'id')?.name }}</span></p>
                  </Card>
                </template>
              </ConfirmationDialog>
              <div v-else class="grid grid-cols-6 w-full items-center gap-2">
                <ConfirmationDialog
                  :onConfirm="() => {
                    services.delete('page', { id: menuItemData.page[0].id }).then((res) => {
                      toast.success('Berhasil menghapus halaman!')
                      keyManager().triggerChange(`menu_item_view_${level}`)
                    })
                  }"
                >
                  <template #trigger>
                    <Card
                      class="flex flex-row items-center justify-center gap-2 h-full self-start outline outline-1 outline-outline/[24%] w-full"

                      color="errorContainer"
                    >
                      <!-- <p>Hapus menu <span class="font-bold">{{ menuItemData.translations.find((item: any) => item.language === 'id')?.name }}</span></p> -->
                      <Icon name="delete-bin"></Icon>
                    </Card>
                  </template>                  
                </ConfirmationDialog>
                <Card
                  class="flex flex-row items-center justify-center gap-2 self-start outline outline-1 outline-outline/[24%] w-full col-span-5 text-sm"

                  color="infoContainer"
                  @click="() => $router.push({ query: { ...$route.query, [`${String($route.name)}_view`]: 'detail', [`${String($route.name)}_id`]: menuItemData.id } })"
                >
                  <p>Lihat detail menu <span class="font-bold">{{ menuItemData.translations.find((item: any) => item.language === 'id')?.name }}</span></p>
                  <Icon size="md" name="arrow-right"></Icon>
                </Card>
              </div>
            </template>
          </div>
        </template>
        <div v-else-if="menuItemData.menu_item_type === 'link'" class="flex flex-col gap-4">
          <Card color="infoContainer">
            <div class="flex flex-row items-center gap-2">
              <Icon name="external-link"></Icon>
              <p>Diarahkan ke halaman eksternal</p>
            </div>
            <a :href="menuItemData.url" target="_blank" class="underline">{{ menuItemData.url }}</a>
          </Card>
        </div>
      </template>
      <p v-else-if="!menuItem.length" class="text-muted">Anda tidak memiliki akses untuk mengubah menu ini</p>
    </div>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(2%);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0%);
}
</style>
