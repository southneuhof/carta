import type { FrameworkRuntime } from '@southneuhof/is-vue-framework'
import * as table from './table'
import * as detail from './detail'
import * as select from './select'
import * as radioGroup from './radioGroup'
import * as checkboxGroup from './checkboxGroup'
import * as lookup from './lookup'
import * as upload from './upload'
import * as location from './location'
import * as fileManager from './fileManager'
import * as dynamicForm from './dynamicForm'
import * as crudList from './crudList'
import * as crudDetail from './crudDetail'
import * as crud from './crud'

export const frameworkRuntimeCapabilities = {
  crud,
  table,
  detail,
  select,
  radioGroup,
  checkboxGroup,
  lookup,
  upload,
  location,
  fileManager,
  dynamicForm,
  crudList,
  crudDetail,
} satisfies FrameworkRuntime
