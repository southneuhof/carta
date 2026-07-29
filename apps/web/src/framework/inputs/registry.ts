import { createInputPropsRegistry, type InputPropsAdapter } from '@southneuhof/is-vue-framework'
import { inputUpload, toInputAssetModel } from '../adapters/upload'

type ResourceSource = {
  key: string
  fields: unknown
  capabilities: {
    list?: { handler?: unknown }
    detail?: { handler?: unknown }
  }
}
type OptionSource = readonly Record<string, unknown>[] | ResourceSource
type LookupProps = Record<string, unknown>

function listSource(source: ResourceSource): { load: unknown; namespace: string } {
  const load = source.capabilities?.list?.handler
  if (typeof load !== 'function') throw new Error(`Input source "${source.key}" requires a list capability.`)
  return { load, namespace: source.key }
}

function optionSource(source: OptionSource): Record<string, unknown> {
  if (!('key' in source)) return { data: source }
  return listSource(source)
}

const lookup: InputPropsAdapter<ResourceSource, LookupProps> = {
  normalize: (source) => {
    const { load, namespace } = listSource(source)
    const loadDetail = source.capabilities?.detail?.handler
    if (typeof loadDetail !== 'function') throw new Error(`Input source "${source.key}" requires a detail capability.`)
    return { fields: source.fields, load, loadDetail, namespace }
  },
}
const options: InputPropsAdapter<OptionSource, Record<string, unknown>> = { normalize: optionSource }

export const appInputProps = createInputPropsRegistry({
  lookup,
  select: options,
  radio: options,
  'checkbox-group': options,
  file: { defaults: { upload: inputUpload, toModel: toInputAssetModel } },
  image: { defaults: { upload: inputUpload, toModel: toInputAssetModel } },
})
