import { defineDomainPart } from '@southneuhof/sprindle/model'
import {
  learningMaterialAttachments,
  learningMaterialQuestionAnswers,
  learningMaterialQuestions,
  learningMaterials,
  orientationRelations,
  syllabusCategories,
  syllabusCategoryMappings,
  syllabusCategoryRoles,
  syllabusLearningMaterialQuiz,
  syllabi,
} from './orientation.entity'

export const domain = defineDomainPart({
  tables: {
    syllabi,
    syllabusCategories,
    syllabusCategoryMappings,
    syllabusCategoryRoles,
    learningMaterials,
    syllabusLearningMaterialQuiz,
    learningMaterialAttachments,
    learningMaterialQuestions,
    learningMaterialQuestionAnswers,
  },
  entities: [],
  relations: [orientationRelations],
})
