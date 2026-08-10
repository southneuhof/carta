import { authenticated, detail, list } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import { numberVariables, numberVariable } from './number-variables.entity'

const read = [authenticated(), requirePermission('view-number-variables')]

export const domain = defineDomainPart({ tables: { numberVariables }, entities: [numberVariable] })

export const numberVariableModel = defineModel({
  path: '/number-variables',
  entity: numberVariable,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
  },
})
