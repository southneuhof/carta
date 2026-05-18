<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import { menuItemFormConfig } from '@/configs/menuItemFormConfig';
import { inject } from 'vue';

const menuItem = inject<any>('menuItem')
</script>

<template>
  <div class="flex flex-col gap-2">
    <Form
      :getInitialData="async () => JSON.parse(JSON.stringify(menuItem))"
      formType="update"
      :fields="menuItem.menu_item_type === 'page' ? ['role', 'slug', 'visible', 'show_submenu_below_navbar'] : ['role', 'url', 'visible']"
      :inputConfig="{
        role: {
          type: 'select',
          props: {
            clearable: true,
            data: [
              { name: 'Beranda', id: 'home' },
              { name: 'Permohonan Akses Dokumen', id: 'document_request' },
              { name: 'Pusat Bantuan', id: 'help_center' },
              { name: 'Daftar Proyek', id: 'project_list' },
            ],
          },
        },
      slug: {
        type: 'text',
        props: {
          required: true,
          disabled: true
        }
      },
      primary: {
        type: 'checkbox',
      },
      visible: {
        type: 'radio',
        props: {
          data: [
            { name: 'Visible', id: true },
            { name: 'Hidden', id: false },
          ],
        },
      },
      show_submenu_below_navbar: {
        type: 'checkbox',
      }
    }"
      :fieldsAlias="{
        ...menuItemFormConfig.fieldsAlias,
        role: 'Role',
        visible: 'Visibility',
        show_submenu_below_navbar: 'Tampilkan daftar submenu di bawah menu navigasi',
      }"
      :onSuccess="
        () => {
          toast.success('Berhasil mengubah data!')
          keyManager().triggerChange(String($route.name))
        }
      "
      targetAPI="menuItem"
    />
  </div>
</template>
