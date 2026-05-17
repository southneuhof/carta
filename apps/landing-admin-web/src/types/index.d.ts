import type { Component } from 'vue'
import type { FormField } from './form'
import type { FieldDependency as SharedFieldDependency, InputConfig as SharedInputConfig, ModelConfig as SharedModelConfig } from '@southneuhof/is-data-model'

export {}

declare global {
  type CommonModelConfig = {
    fields?: string[]
    fieldsAlias?: Record<string, string>
  }

  type ModelConfig = SharedModelConfig

  type CommonViewConfig = CommonModelConfig & {
    getAPI?: string
    fieldsDictionary?: Record<string, Record<string, string>>
    fieldsParse?: Record<string, string>
    fieldsProxy?: Record<string, string>
    fieldsType?: Record<string, { type: string; props?: any }>
    fieldsUnit?: Record<string, string>
    searchParameters?: Record<string, any>
  }

  type ListConfig = CommonViewConfig & {
    uid?: string
    getAPI?: string
    deleteAPI?: string
    fieldsClass?: Record<string, string>
    fieldsHeaderClass?: Record<string, string>
    fieldsAlign?: Record<string, 'start' | 'center' | 'end'>
    filter?: Partial<CreateConfig>
    toggleableFields?: string[]
    draggable?: boolean
    onDragChange?: (event: any) => void
    export?: Omit<CommonViewConfig, 'getAPI' | 'searchParameters'> & {
      allow?: boolean
      exportAPI?: string
      onExport?: (params: { exportAPI: string; params: Record<string, any>; listConfig: ListConfig }) => void
    }
  }

  type DetailConfig = CommonViewConfig & {
    getAPI?: string
    dataID?: string
    export?: Omit<CommonViewConfig, 'getAPI' | 'searchParameters'> & {
      title?: string
      allow?: boolean | ((data: Record<string, any>) => boolean)
      onExport?: (params: { getAPI: string; params: Record<string, any>; detailConfig: DetailConfig }) => void
    }
  }

  type CommonTransactionConfig = CommonModelConfig & {
    targetAPI?: string
    inputConfig?: InputConfig
    extraData?: Record<string, any>
    // inputConfig?: InputConfig,
    // defaultValue?: Record<string, any>
    getInitialData?: () => Promise<Record<string, any>>
    onSuccess?: (params: { formData: Record<string, any>; res: Record<string, any> }) => void
  }

  type CreateConfig = CommonTransactionConfig & {}

  type UpdateConfig = CommonTransactionConfig & {
    getAPI?: string
    dataID?: string
    searchParameters?: Record<string, any>
  }

  type ViewConfig = CommonViewConfig & {
    list?: ListConfig
    detail?: DetailConfig
  }

  type TransationConfig = CommonTransactionConfig & {
    create?: CreateConfig
    update?: UpdateConfig
  }

  type CRUDCompositeConfig = ModelConfig & {
    view?: ViewConfig
    transaction?: TransationConfig
  }
}

declare global {
  type InputConfig = SharedInputConfig
  type FieldDependency = SharedFieldDependency

  type Action = 'READ_DETAIL' | 'UPDATE' | 'DELETE'
  type Methods = {
    list?: boolean
    detail?: boolean
    create?: boolean
    update?: boolean
  }

  type Field = {
    id: string
    label: string
    source?: string | null
    methods?: Methods
    visible?: boolean
  }

  type TabConfig = {
    name: string
    component: Component
    props?: Object
  }

  export type CRUDPermissions = {
    view: boolean
    lookup: boolean
    detail: boolean
    create: boolean
    update: boolean
    delete: boolean
  }

  export type Model = {
    fieldList?: Array<string>
    fieldView?: Array<string>
    fieldAdd?: Array<string>
    fieldEdit?: Array<string>
  }

  export type FieldPage = {
    name: string
    fields: Array<string>
  }

  export type FieldsType = { [key: string]: { type: string; [key: string]: string | boolean | { [key: string]: any } } }

  export type CRUDMode = 'create' | 'read' | 'read_detail' | 'update' | 'delete'

  export type TableField = {
    id: string
    label: string
    visible: boolean
  }

  export type RouteSeparator = {
    name: string
  }

  export type Route = {
    title: string
    name: string
    icon: string
    meta?: Object
    permission?: string
  }

  export type Module = {
    title: string
    name: string
    permission?: string
    icon: [string, string] | string
    description?: string
    meta?: Object
    routes: Array<{ separator?: boolean } & (RouteSeparator | Route)>
    children?: Array<Route>
  }

  export type Modules = Array<Module>

  export type QueryParameters = {
    page?: number
    limit?: number
    sort_by?: string
    sort?: string
    search?: string
    filters?: Object
    [key: string]: any
  }
}
