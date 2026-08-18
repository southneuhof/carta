import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import {
  inspectionTestPlan,
  inspectionTestPlanInspectorPoint,
  inspectionTestPlanInspectorPoints,
  inspectionTestPlanInspectorType,
  inspectionTestPlanInspectorTypes,
  inspectionTestPlans,
  itpInspectionPoint,
  itpInspectionPoints,
  itpInspectorType,
  itpInspectorTypes,
} from './inspection-test-plans.entity'
import {
  createInspectionTestPlans,
  deleteInspectionTestPlans,
  detailInspectionTestPlans,
  templateInspectionTestPlans,
  treeInspectionTestPlans,
  updateInspectionTestPlans,
} from './inspection-test-plans.routes'

export const domain = defineDomainPart({
  tables: {
    inspectionTestPlans,
    inspectionTestPlanInspectorTypes,
    inspectionTestPlanInspectorPoints,
    itpInspectorTypes,
    itpInspectionPoints,
  },
  entities: [inspectionTestPlan, inspectionTestPlanInspectorType, inspectionTestPlanInspectorPoint, itpInspectorType, itpInspectionPoint],
})

export const inspectionTestPlansModel = defineModel({
  path: '/inspection-test-plans',
  entity: inspectionTestPlan,
  routes: {
    template: templateInspectionTestPlans,
    project: { ':projectId': { tree: treeInspectionTestPlans } },
    create: createInspectionTestPlans,
    detail: detailInspectionTestPlans,
    update: updateInspectionTestPlans,
    delete: deleteInspectionTestPlans,
  },
})

export {
  createInspectionTestPlans,
  deleteInspectionTestPlans,
  detailInspectionTestPlans,
  templateInspectionTestPlans,
  treeInspectionTestPlans,
  updateInspectionTestPlans,
}

export default { domain, inspectionTestPlansModel }
