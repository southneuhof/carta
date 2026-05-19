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
import { imageURLResolver } from './imageInput'

export const frameworkBehaviors: FrameworkBehaviors = {
  form,
  table,
  detail,
  select,
  radioGroup,
  checkboxGroup,
  lookup,
  upload,
  imageInput: {
    fileUpload: upload.fileUpload,
    imageURLResolver: imageURLResolver
  },
  fileInput: {
    fileUpload: upload.fileUpload,
  },
  location,
  fileManager,
  dynamicForm,
  crudList,
  crudDetail,
}
