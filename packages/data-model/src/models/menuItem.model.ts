import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { visibleOptions } from './_helpers'

const menuItemModel: ModelConfig = withModelDefaults({
  name: 'menuItem',
  title: 'Website',
  modelAPI: 'menuItem',
  permission: 'menuItem',
  fields: ['parent_id', 'role', 'visible', 'level', 'order', 'menu_item_type', 'show_submenu_below_navbar', 'url', 'slug'],
  fieldsAlias: {
    parent_id: 'Parent Menu',
    menu_item_type: 'Menu Type',
    show_submenu_below_navbar: 'Show Submenu Below Navbar',
  },
  view: {
    list: {
      fields: ['slug', 'menu_item_type', 'level', 'order', 'visible', 'role'],
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
      filter: {
        fields: ['parent_id', 'level', 'visible'],
        inputConfig: {
          visible: { type: 'radio', props: { data: visibleOptions } },
        },
      },
    },
    detail: {
      fields: ['parent_id', 'role', 'visible', 'level', 'order', 'menu_item_type', 'show_submenu_below_navbar', 'url', 'slug'],
    },
  },
  transaction: {
    fields: ['parent_id', 'role', 'visible', 'menu_item_type', 'show_submenu_below_navbar', 'url', 'slug'],
    inputConfig: {
      visible: { type: 'radio', props: { data: visibleOptions, required: true } },
      role: { type: 'text' },
      menu_item_type: {
        type: 'radio',
        props: {
          data: [
            { id: 'layout', name: 'Layout' },
            { id: 'link', name: 'Link' },
          ],
        },
      },
      show_submenu_below_navbar: { type: 'checkbox' },
      url: { type: 'text' },
      slug: { type: 'text' },
    },
  },
})

export default menuItemModel
