import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const viewsRoot = join(__dirname, '..')

describe('mapping panel endpoint wiring', () => {
  it('role permission mapping uses list and toggle endpoints', () => {
    const content = readFileSync(join(viewsRoot, 'authenticated/user/role/_layouts/RolePermissionMapping.vue'), 'utf-8')
    expect(content).toContain('mappingPermissionRole/toggle')
    expect(content).toContain('mappingPermissionRoleModel')
  })

  it('article category mapping uses list and toggle endpoints', () => {
    const content = readFileSync(join(viewsRoot, 'authenticated/article/articleCategory/_layouts/ArticleCategoryRoleMapping.vue'), 'utf-8')
    expect(content).toContain('mappingRoleArticleCategory/toggle')
    expect(content).toContain('mappingRoleArticleCategoryModel')
  })

  it('form type mapping uses list and toggle endpoints', () => {
    const content = readFileSync(join(viewsRoot, 'authenticated/form/formType/_layouts/FormTypeRoleMapping.vue'), 'utf-8')
    expect(content).toContain('mappingRoleFormType/toggle')
    expect(content).toContain('mappingRoleFormTypeModel')
  })
})
