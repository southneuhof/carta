import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const formFieldModel: ModelConfig = withModelDefaults({
  name: 'formField',
  title: 'Field Form',
  modelAPI: 'formField',
  fields: ['id', 'form_type_id', 'order', 'col_span', 'type', 'validation_type_code', 'label', 'label_en', 'code', 'required', 'helper_message', 'helper_message_en', 'data'],
  fieldsAlias: {
    form_type_id: 'Form Type',
    validation_type_code: 'Validation Type',
    col_span: 'Column Span',
  },
  view: {
    list: {
      draggable: true,
      searchParameters: { sort_by: 'order', sort: 'asc' },
      filter: {
        fields: ['form_type_id', 'type', 'validation_type_code'],
      },
    },
  },
  transaction: {
    fields: ['form_type_id', 'type', 'validation_type_code', 'label', 'label_en', 'code', 'required', 'helper_message', 'helper_message_en', 'data', 'col_span'],
    inputConfig: {
      form_type_id: { type: 'text', props: { required: true } },
      type: {
        type: 'radio',
        props: {
          data: [
            { id: 'text', name: 'Text' },
            { id: 'textarea', name: 'Textarea' },
            { id: 'number', name: 'Number' },
            { id: 'select', name: 'Select' },
            { id: 'image', name: 'Image' },
            { id: 'file', name: 'File' },
            { id: 'date', name: 'Date' },
          ],
          required: true,
        },
      },
      validation_type_code: {
        type: 'radio',
        props: {
          data: [
            { id: 'email', name: 'Email' },
            { id: 'phone', name: 'Phone' },
            { id: 'number', name: 'Number' },
            { id: 'url', name: 'URL' },
            { id: 'date', name: 'Date' },
            { id: 'file', name: 'File' },
          ],
        },
      },
      label: { type: 'text', props: { required: true } },
      label_en: { type: 'text' },
      code: { type: 'text' },
      required: { type: 'checkbox' },
      helper_message: { type: 'textarea' },
      helper_message_en: { type: 'textarea' },
      data: { type: 'textarea' },
      col_span: { type: 'number' },
    },
  },
})

export default formFieldModel
