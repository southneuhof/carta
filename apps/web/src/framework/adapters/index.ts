import type { FrameworkBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'
import * as form from './form'
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
import type { RpcCRUDResource } from './crud'

export const frameworkBehaviors: FrameworkBehaviors<RpcCRUDResource> = {
  crud,
  form,
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
}
