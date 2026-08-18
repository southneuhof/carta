import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import {
  qualityInspection,
  qualityInspectionDocumentation,
  qualityInspectionDocumentations,
  qualityInspectionNumberCounters,
  qualityInspectionPtsRejection,
  qualityInspectionPtsRejections,
  qualityInspectionVerification,
  qualityInspectionVerifications,
  qualityInspectionWorkItemItp,
  qualityInspectionWorkItemItpSnapshots,
  qualityInspectionWorkItemItpSnapshot,
  qualityInspectionWorkItemItpSnapshotInspector,
  qualityInspectionWorkItemItpSnapshotInspectors,
  qualityInspectionWorkItemItpSnapshotPoint,
  qualityInspectionWorkItemItpSnapshotPoints,
  qualityInspectionWorkItemItpVerification,
  qualityInspectionWorkItemItpVerifications,
  qualityInspectionWorkItemItps,
  qualityInspections,
  workItemSchedule,
  workItemSchedules,
} from './quality-inspection.entity'
import {
  completeReportQualityInspectionRoute,
  createContextQualityInspectionRoute,
  createQualityInspectionRoute,
  deleteQualityInspectionRoute,
  detailQualityInspectionRoute,
  listSchedulesQualityInspectionRoute,
  listQualityInspectionRoute,
  scheduleContextQualityInspectionRoute,
  submitDocumentationsQualityInspectionRoute,
  updateQualityInspectionRoute,
  verifyQualityInspectionRoute,
  verifyWorkItemQualityInspectionRoute,
} from './quality-inspection.routes'

export const domain = defineDomainPart({
  tables: {
    workItemSchedules,
    qualityInspectionNumberCounters,
    qualityInspections,
    qualityInspectionWorkItemItps,
    qualityInspectionWorkItemItpSnapshots,
    qualityInspectionWorkItemItpSnapshotInspectors,
    qualityInspectionWorkItemItpSnapshotPoints,
    qualityInspectionWorkItemItpVerifications,
    qualityInspectionDocumentations,
    qualityInspectionVerifications,
    qualityInspectionPtsRejections,
  },
  entities: [
    qualityInspection,
    workItemSchedule,
    qualityInspectionWorkItemItp,
    qualityInspectionWorkItemItpSnapshot,
    qualityInspectionWorkItemItpSnapshotInspector,
    qualityInspectionWorkItemItpSnapshotPoint,
    qualityInspectionWorkItemItpVerification,
    qualityInspectionDocumentation,
    qualityInspectionVerification,
    qualityInspectionPtsRejection,
  ],
})

export const qualityInspectionModel = defineModel({
  path: '/quality-inspection',
  entity: qualityInspection,
  routes: {
    list: listQualityInspectionRoute,
    detail: detailQualityInspectionRoute,
    create: createQualityInspectionRoute,
    update: updateQualityInspectionRoute,
    delete: deleteQualityInspectionRoute,
    createContext: createContextQualityInspectionRoute,
    schedules: { list: listSchedulesQualityInspectionRoute, ':id': { createContext: scheduleContextQualityInspectionRoute } },
    actions: {
      ':id': {
        completeReport: completeReportQualityInspectionRoute,
        submitDocumentations: submitDocumentationsQualityInspectionRoute,
        verify: verifyQualityInspectionRoute,
        workItems: { ':workItemRowId': { verify: verifyWorkItemQualityInspectionRoute } },
      },
    },
  },
})

export {
  completeReportQualityInspectionRoute,
  createContextQualityInspectionRoute,
  createQualityInspectionRoute,
  deleteQualityInspectionRoute,
  detailQualityInspectionRoute,
  listSchedulesQualityInspectionRoute,
  listQualityInspectionRoute,
  scheduleContextQualityInspectionRoute,
  submitDocumentationsQualityInspectionRoute,
  updateQualityInspectionRoute,
  verifyQualityInspectionRoute,
  verifyWorkItemQualityInspectionRoute,
}

export default { domain, qualityInspectionModel }
