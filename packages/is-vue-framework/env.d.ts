declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'html2pdf.js' {
  const html2pdf: any
  export default html2pdf
}

interface ImportMetaEnv {
  readonly GOOGLE_MAP_API_KEY?: string
  readonly VITE_GOOGLE_MAP_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type CRUDPermissions = {
  view: boolean
  lookup: boolean
  detail: boolean
  create: boolean
  update: boolean
  delete: boolean
}

type CreateConfig = import('@southneuhof/is-data-model').CreateConfig
type UpdateConfig = import('@southneuhof/is-data-model').UpdateConfig
type ListConfig = import('@southneuhof/is-data-model').ListConfig
type DetailConfig = import('@southneuhof/is-data-model').DetailConfig

type CRUDCreateProps = Partial<CreateConfig> & {
  onSuccess?: (formData: Record<string, any>, res: Record<string, any>) => void
}

type CRUDUpdateProps = Partial<UpdateConfig>
type CRUDListProps = Partial<ListConfig> & {
  filter?: Partial<CRUDCreateProps>
}
type CRUDDetailProps = Partial<DetailConfig>
type FrameworkInputConfig = import('@southneuhof/is-data-model').InputConfig
