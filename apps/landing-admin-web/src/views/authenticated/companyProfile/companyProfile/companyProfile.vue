<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import { toast } from 'vue-sonner'
import companyProfileModel from '@client/data-model/models/companyProfile.model'
import { buildFormConfig } from '@southneuhof/is-data-model'

const updateConfig = buildFormConfig(companyProfileModel, 'update')
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <Form
        :fields="['name', 'address', 'email', 'phone', 'facebook', 'instagram', 'youtube']"
        :targetAPI="updateConfig.targetAPI"
        :getAPI="companyProfileModel.name"
        dataID="1"
        :fieldsAlias="updateConfig.fieldsAlias"
        :inputConfig="updateConfig.inputConfig"
        formType="update"
        :onSuccess="
          () => {
            toast.success('Berhasil menyimpan company profile!')
          }
        "
      />
    </Card>
  </div>
</template>
