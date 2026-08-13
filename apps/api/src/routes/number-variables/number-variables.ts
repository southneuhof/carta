import { authenticated, detail, list } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import { numberVariables, numberVariable } from './number-variables.entity'

const listNumberVariables = [authenticated(), requirePermission('list-number-variables')]
const detailNumberVariables = [authenticated(), requirePermission('detail-number-variables')]

export const domain = defineDomainPart({ tables: { numberVariables }, entities: [numberVariable] })

export const numberVariableModel = defineModel({
  path: '/number-variables',
  entity: numberVariable,
  routes: {
    list: list({ authorize: listNumberVariables }),
    detail: detail({ authorize: detailNumberVariables }),
  },
})
