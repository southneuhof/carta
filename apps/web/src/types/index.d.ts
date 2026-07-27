import type { Component } from 'vue'
import type { FieldDependency as SharedFieldDependency, InputConfig as SharedInputConfig, ModelConfig as SharedModelConfig } from '@southneuhof/is-vue-framework'

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
    filter?: Partial<CRUDCreateProps>
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

  export type CRUDListProps = {
    uid?: string
    getAPI: string
    deleteAPI?: string
    searchParameters?: Record<string, any>
    fields: string[]
    fieldsAlias?: Record<string, string>
    fieldsDictionary?: Record<string, Record<string, string>>
    fieldsParse?: Record<string, string>
    fieldsProxy?: Record<string, string>
    fieldsClass?: Record<string, string>
    fieldsHeaderClass?: Record<string, string>
    fieldsAlign?: Record<string, 'start' | 'center' | 'end'>
    fieldsType?: Record<string, { type: string; props?: any }>
    fieldsUnit?: Record<string, string>
    filter?: Partial<CRUDCreateProps>
    toggleableFields?: string[]
    export?: {
      allow?: boolean
      onExport?: (params: { getAPI: string; params: Record<string, any>; listConfig: CRUDListProps }) => void
    }
  }

  export type CRUDDetailProps = {
    getAPI: string
    searchParameters?: Record<string, any>
    getDataID: string
    fields: string[]
    fieldsAlias?: Record<string, string>
    fieldsDictionary?: Record<string, Record<string, string>>
    fieldsParse?: Record<string, string>
    fieldsProxy?: Record<string, string>
    fieldsType?: Record<string, { type: string; props?: any }>
    fieldsUnit?: Record<string, string>
    export?: {
      model?: string
      routeName?: string
      allow?: boolean | ((activeData: Record<string, any>) => boolean)
      title?: string
      layout?: {
        type: 'detail' | 'table' | 'image-single' | 'image-multi' | 'paragraph' | 'qr' | 'page-break' | 'custom'
        component?: any
        sourceKey?: string
        title?: string
        props?: Record<string, any>
      }[][]
    }
  }

  export type CRUDUpdateProps = {
    targetAPI?: string
    getAPI?: string
    postAdditionalData?: Record<string, any>
    fields: string[]
    fieldsAlias?: Record<string, string>
    inputConfig?: InputConfig
    defaultValues?: Record<string, any>
    guide?: { enabled?: boolean; getAPI?: string; searchParameters?: Record<string, any> }
  }

  export type CRUDCreateProps = {
    targetAPI?: string
    postAdditionalData?: Record<string, any>
    fields: string[]
    fieldsAlias?: Record<string, string>
    inputConfig?: InputConfig
    defaultValues?: Record<string, any>
    guide?: { enabled?: boolean; getAPI?: string; searchParameters?: Record<string, any> }
    onSuccess?: (formData: Record<string, any>, res: Record<string, any>) => void
  }

  export type BaseCRUDConfig = Partial<CRUDListProps> &
    Partial<CRUDDetailProps> &
    Partial<CRUDUpdateProps> &
    Partial<CRUDCreateProps> & {
      name: string
      model?: string
      permission?: string
      title?: string
      actions?: {
        list?: boolean
        detail?: boolean
        update?: boolean
        create?: boolean
        delete?: boolean
      }
      list?: Partial<CRUDListProps>
      detail?: Partial<CRUDDetailProps>
      update?: Partial<CRUDUpdateProps>
      create?: Partial<CRUDCreateProps>
    }

  export type BaseCRUDConfigLegacy = {
    title?: string
    loadkey?: string
    name: string
    modelAPI: string
    getAPI: string
    targetAPI: string
    showAPI?: string
    createAPI?: string
    updateAPI?: string
    deleteAPI?: string
    mainFilter?: { [key: string]: Array<{ id: string; label: string }> }
    fieldList?: Array<string>
    fieldShow?: Array<string>
    fieldAdd?: Array<string>
    fieldAddPaginated?: Array<FieldPage>
    fieldEdit?: Array<string>
    searchParameters?: Record<string, string>
    postQueryParameters?: Record<string, string>
    fieldsAlias?: Record<string, string>
    fieldsAlternateSource?: Record<string, string>
    fieldsExclude: Array<string>
    infoFields?: Array<string>
    fieldsOverride?: Record<string, Record<string, string>>
    inputConfig?: InputConfig
    fieldsFilterable?: Array<string>
    fieldsType?: FieldsType
    fieldsParse?: Record<string, string>
    fieldsVisibility?: Record<string, boolean>
    tableActionsLocation?: 'left' | 'right'
    fieldsToggleable?: string[]
    uid?: string
    actions?: {
      create?: boolean
      update?: boolean
      delete?: boolean
      show?: boolean
    }
    additionalColumns?: Array<object>
    fieldsFormatter?: Record<string, (value: any) => string>
    dataExportURL?: string
    filterInputConfig?: InputConfig
    beforeSubmit?: (data: any) => any // Modifies data form before submit
    submitAction?: (data: any) => any // Submits data
    afterSubmit?: (data: any, res: any) => any // Effect action on successful submit
  }

  export type CRUDMode = 'create' | 'read' | 'read_detail' | 'update' | 'delete'

  export type TableField = {
    id: string
    label: string
    visible: boolean
  }

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
