import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..')

const expectedCrudViews = [
  'authenticated/article/article/article.vue',
  'authenticated/article/articleCategory/articleCategory.vue',
  'authenticated/master/product/product.vue',
  'authenticated/master/productCategory/productCategory.vue',
  'authenticated/careers/job/job.vue',
  'authenticated/careers/jobCategory/jobCategory.vue',
  'authenticated/user/user/user.vue',
  'authenticated/user/role/role.vue',
  'authenticated/user/roleGroup/roleGroup.vue',
  'authenticated/user/permission/permission.vue',
  'authenticated/collection/collection/collection.vue',
  'authenticated/form/formType/formType.vue',
  'authenticated/form/formSubmission/formSubmission.vue',
  'authenticated/companyProfile/companyProfile/companyProfile.vue',
]

describe('crud view wiring', () => {
  it('contains all non-calculator CRUD route components', () => {
    for (const relPath of expectedCrudViews) {
      const content = readFileSync(join(srcRoot, relPath), 'utf-8')
      expect(content.length).toBeGreaterThan(0)
    }
  })

  it('mounts CRUDComposite in standard CRUD views', () => {
    for (const relPath of expectedCrudViews) {
      const content = readFileSync(join(srcRoot, relPath), 'utf-8')
      expect(content).toContain('<CRUDComposite')
    }
  })

  it('keeps website route as shell-only for phase 5', () => {
    const content = readFileSync(join(srcRoot, 'authenticated/website/website/website.vue'), 'utf-8')
    expect(content).not.toContain('<CRUDComposite')
  })
})
