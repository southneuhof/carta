import { defineModel } from '@southneuhof/sprindle/model'
import { detail, list } from '@southneuhof/sprindle/routes'
import { requirePermission } from '../../identity'
import { permission } from '../roles/roles.entity'

const listPermissions = [requirePermission('list-permissions')]
const detailPermissions = [requirePermission('detail-permissions')]

export const permissionModel = defineModel({
  path: '/permissions',
  entity: permission,
  routes: {
    list: list({ authorize: listPermissions }),
    detail: detail({ authorize: detailPermissions }),
  },
})
