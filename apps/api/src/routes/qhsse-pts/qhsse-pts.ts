import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { qhssePts, qhssePtsEntity, qhssePtsNumberCounters, qhssePtsRootCauses } from './qhsse-pts.entity'
import { actionPts, createPts, detailPts, listPts, updatePts } from './qhsse-pts.routes'

export const domain = defineDomainPart({
  tables: { qhssePts, qhssePtsRootCauses, qhssePtsNumberCounters },
  entities: [qhssePtsEntity],
})

export const qhssePtsModel = defineModel({
  path: '/qhsse-pts',
  entity: qhssePtsEntity,
  routes: {
    list: listPts,
    detail: detailPts,
    create: createPts,
    update: updatePts,
    action: actionPts,
  },
})

export { actionPts, createPts, detailPts, listPts, updatePts }
export default { domain, qhssePtsModel }
