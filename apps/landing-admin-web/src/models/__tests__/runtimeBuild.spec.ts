import { describe, expect, it } from 'vitest'
import { buildDetailConfig, buildFormConfig, buildListConfig } from '@southneuhof/is-data-model'
import {
  adBannerLanguageMapModel,
  adBannerModel,
  articleTranslationModel,
  collectionModel,
  companyProfileModel,
  formFieldModel,
  languageModel,
  layoutTypeModel,
  menuItemModel,
  userModel,
} from '../index'

describe('runtime config builders', () => {
  it('builds list config for menuItem', () => {
    const list = buildListConfig(menuItemModel)
    expect(list.getAPI).toBe('menuItem')
    expect(list.fields).toContain('slug')
    expect(list.draggable).toBe(true)
  })

  it('builds detail and update config for articleTranslation', () => {
    const detail = buildDetailConfig(articleTranslationModel)
    const update = buildFormConfig(articleTranslationModel, 'update')
    expect(detail.getAPI).toBe('articleTranslation')
    expect(update.targetAPI).toBe('articleTranslation')
    expect(update.fields).toContain('content')
  })

  it('builds create config for formField', () => {
    const create = buildFormConfig(formFieldModel, 'create')
    expect(create.targetAPI).toBe('formField')
    expect(create.fields).toContain('type')
    expect(create.inputConfig?.type?.type).toBe('radio')
  })

  it('builds create config for user model', () => {
    const create = buildFormConfig(userModel, 'create')
    expect(create.fields).toContain('email')
    expect(create.targetAPI).toBe('user')
  })

  it('builds collection and companyProfile configs', () => {
    const collectionCreate = buildFormConfig(collectionModel, 'create')
    const companyUpdate = buildFormConfig(companyProfileModel, 'update')
    expect(collectionCreate.targetAPI).toBe('collection')
    expect(collectionCreate.fields).toContain('data')
    expect(companyUpdate.targetAPI).toBe('companyProfile')
    expect(companyUpdate.fields).toContain('subsidiaries')
  })

  it('builds config for language/layoutType/adBanner models', () => {
    expect(buildListConfig(languageModel).getAPI).toBe('language')
    expect(buildFormConfig(layoutTypeModel, 'create').targetAPI).toBe('layoutType')
    expect(buildDetailConfig(adBannerLanguageMapModel).getAPI).toBe('adBannerLanguageMap')
    expect(buildFormConfig(adBannerModel, 'update').targetAPI).toBe('adBanner')
  })
})
