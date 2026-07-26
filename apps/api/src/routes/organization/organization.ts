import { defineDomainPart } from '@southneuhof/sprindle/model'
import {
  jobPosition,
  jobPositions,
  sectionGroups,
  sectionRantings,
  sectionType,
  sectionTypes,
  tollSection,
  tollSections,
} from './organization.entity'
import { jobPositionModel, sectionTypeModel, tollSectionModel } from './organization.model'

export const domain = defineDomainPart({
  tables: { sectionTypes, tollSections, jobPositions, sectionGroups, sectionRantings },
  entities: [sectionType, tollSection, jobPosition],
})

export { jobPositionModel, sectionTypeModel, tollSectionModel }

export default { domain, sectionTypeModel, tollSectionModel, jobPositionModel }
