import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { qhssePts, qhssePtsEntity, qhssePtsNumberCounters, qhssePtsRootCauses } from './qhsse-pts.entity'
import { actionPts, createPts, deletePts, detailPts, listPts, updatePts } from './qhsse-pts.routes'

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
    delete: deletePts,
    action: actionPts,
  },
})

export { actionPts, createPts, deletePts, detailPts, listPts, updatePts }
export default { domain, qhssePtsModel }
