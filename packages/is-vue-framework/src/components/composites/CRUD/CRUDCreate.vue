<script setup lang="ts">
import { toast } from 'vue-sonner'
import { buildFormConfig } from '../../../model-config'
import { useCRUDOperations, type CRUDCompositeConfig, type CRUDOperationOverrides } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import Form from '../Form.vue'
import { useRoute } from 'vue-router'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { useFrameworkDefaults } from '@southneuhof/is-vue-framework'

const props = defineProps<{
  config: CRUDCompositeConfig
  operations?: CRUDOperationOverrides
  permissions: CRUDPermissions
}>()

const route = useRoute()
const crudOperations = useCRUDOperations(props.config, props.operations)
const defaultFormConfig = useFrameworkDefaults().form

if (!props.config.title) props.config.title = String(route.meta.title)

const createFormConfig: CreateConfig = buildFormConfig(props.config, 'create', {
  fieldsAlias: defaultFormConfig.fieldsAlias,
}) as CreateConfig
const createFormProps = (() => {
  const { targetAPI: _targetAPI, onSuccess: _onSuccess, ...config } = createFormConfig as any
  return config
})()
</script>

<template>
  <div class="flex flex-col gap-2">
    <slot v-if="$slots['create-header']" name="create-header"></slot>
    <Card v-else class="flex flex-row items-center justify-between gap-4">
      <div class="flex flex-row items-center gap-4">
        <Button
          @click="() => ($route.query['redirected'] == 'true' ? $router.back() : $router.push({ query: { ...$route.query, [`${config.name}_view`]: 'list' } }))"
          kind="icon" variant="text"

          class="max-w-fit"
        >
          <template #icon>
            <Icon name="arrow-left" />
          </template>
        </Button>
        <div class="min-w-max text-xl">Tambah {{ config.title || $route.meta.title }}</div>
      </div>
    </Card>
    <Transition name="vfade" mode="out-in">
      <Suspense>
        <template #fallback>
          <div class="flex w-full items-center justify-center">
            <Spinner />
          </div>
        </template>
        <slot v-if="$slots['create-main']" name="create-main" />
        <Card v-else>
          <Form v-bind="createFormProps" :submit="crudOperations.create" @success="(result, submittedData) => {
            if (createFormConfig.onSuccess) createFormConfig.onSuccess({ formData: submittedData, res: (result as Record<string, any>) || {} })
            else { toast.success('Berhasil menambahkan data!'); $router.back() }
          }" />
        </Card>
      </Suspense>
    </Transition>
  </div>
</template>
