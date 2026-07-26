import { authenticated, detail, list } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { jobPosition, sectionType, tollSection } from './organization.entity'

// Reference data: read-only over HTTP. It is written by the seed and by migrations,
// never by the application.
export const sectionTypeModel = defineModel({
  path: '/section-types',
  entity: sectionType,
  authorize: [authenticated()],
  routes: { list: list(), detail: detail() },
})

export const tollSectionModel = defineModel({
  path: '/toll-sections',
  entity: tollSection,
  authorize: [authenticated()],
  routes: { list: list(), detail: detail() },
})

export const jobPositionModel = defineModel({
  path: '/job-positions',
  entity: jobPosition,
  authorize: [authenticated()],
  routes: { list: list(), detail: detail() },
})
