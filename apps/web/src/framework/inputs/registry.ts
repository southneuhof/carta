import { createInputPropsRegistry, type InputPropsAdapter } from '@southneuhof/is-vue-framework'
import { inputUpload, toInputAssetModel } from '../adapters/upload'

type ResourceSource = {
  key: string
  list: (args?: unknown) => { run: unknown; fields?: unknown; namespace?: string }
  detail?: (args: { id: unknown; searchParameters?: Record<string, unknown> }) => { run: (context?: unknown) => unknown }
}
type OptionSource = readonly Record<string, unknown>[] | ResourceSource
type LookupProps = Record<string, unknown>

function listSource(source: ResourceSource): { load: unknown; namespace: string } {
  const list = source.list()
  if (typeof list.run !== 'function') throw new Error(`Input source "${source.key}" requires a list action.`)
  return { load: list.run, namespace: list.namespace ?? source.key }
}

function optionSource(source: OptionSource): Record<string, unknown> {
  if (!('key' in source)) return { data: source }
  return listSource(source)
}

const lookup: InputPropsAdapter<ResourceSource, LookupProps> = {
  normalize: (source) => {
    const { load, namespace } = listSource(source)
    const list = source.list()
    if (!source.detail) throw new Error(`Input source "${source.key}" requires a detail action.`)
    const detail = source.detail
    return { fields: list.fields, load, loadDetail: (context: { id?: unknown; searchParameters?: Record<string, unknown> }) => detail({ id: context.id, searchParameters: context.searchParameters }).run(context), namespace }
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
