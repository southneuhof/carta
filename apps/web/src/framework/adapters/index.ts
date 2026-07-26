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

export const frameworkRuntimeCapabilities = {
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
} satisfies FrameworkRuntime
