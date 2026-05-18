import { beforeEach, describe, expect, it } from 'vitest'
import { configureFrameworkBehaviors, getFrameworkBehaviors, missingBehavior, resetFrameworkBehaviorsForTests } from '../behaviors'
import config, { applyFrameworkConfig, applyFrameworkDefaults, defaultDetailConfig, defaultFormConfig, defaultTableConfig, mode } from '../defaults'

describe('framework behavior registry', () => {
  beforeEach(() => {
    resetFrameworkBehaviorsForTests()
  })

  it('stores configured behavior groups', async () => {
    const getData = async () => ({ data: [], total: 0, totalPage: 0 })

    configureFrameworkBehaviors({
      table: { getData },
    })

    expect(getFrameworkBehaviors().table?.getData).toBe(getData)
  })

  it('merges behavior groups without replacing existing members', () => {
    const getData = async () => ({ data: [], total: 0, totalPage: 0 })
    const onDataLoaded = () => {}

    configureFrameworkBehaviors({ table: { getData } })
    configureFrameworkBehaviors({ table: { onDataLoaded } })

    expect(getFrameworkBehaviors().table?.getData).toBe(getData)
    expect(getFrameworkBehaviors().table?.onDataLoaded).toBe(onDataLoaded)
  })

  it('throws a clear missing behavior error', () => {
    expect(() => missingBehavior('table.getData')).toThrow('Missing behavior: table.getData')
  })

  it('applies defaults through defaults registry API', () => {
    applyFrameworkDefaults({
      table: {
        fieldsAlias: { title: 'Judul' },
        fieldsClass: { title: 'truncate' },
        fieldsType: { active: { type: 'chip' } },
        fieldsAlign: { active: 'center' },
      },
      detail: {
        fieldsAlias: { description: 'Deskripsi' },
        fieldsType: { status: { type: 'chip' } },
      },
      form: {
        fieldsAlias: { code: 'Kode' },
        inputConfig: { code: { type: 'text', props: { required: true } } },
      },
      mode: 'custom',
    })
    applyFrameworkConfig({
      apiUrl: 'https://api.example.com/',
    })

    expect(defaultTableConfig.fieldsAlias.title).toBe('Judul')
    expect(defaultTableConfig.fieldsClass.title).toBe('truncate')
    expect(defaultTableConfig.fieldsType.active?.type).toBe('chip')
    expect(defaultTableConfig.fieldsAlign.active).toBe('center')
    expect(defaultDetailConfig.fieldsAlias.description).toBe('Deskripsi')
    expect(defaultDetailConfig.fieldsType.status?.type).toBe('chip')
    expect(defaultFormConfig.fieldsAlias.code).toBe('Kode')
    expect(defaultFormConfig.inputConfig.code?.type).toBe('text')
    expect(config.apiUrl).toBe('https://api.example.com/')
    expect(mode).toBe('custom')
  })

  it('deep merges defaults across repeated calls', () => {
    applyFrameworkDefaults({
      table: {
        fieldsAlias: { title: 'Judul' },
        fieldsType: { status: { type: 'chip', props: { color: 'success' } } },
      },
    })
    applyFrameworkConfig({
      server: { timeout: 1000 },
    })

    applyFrameworkDefaults({
      table: {
        fieldsAlias: { code: 'Kode' },
        fieldsType: { status: { props: { rounded: true } } },
      },
    })
    applyFrameworkConfig({
      server: { retries: 2 },
    })

    expect(defaultTableConfig.fieldsAlias.title).toBe('Judul')
    expect(defaultTableConfig.fieldsAlias.code).toBe('Kode')
    expect(defaultTableConfig.fieldsType.status?.type).toBe('chip')
    expect(defaultTableConfig.fieldsType.status?.props?.color).toBe('success')
    expect(defaultTableConfig.fieldsType.status?.props?.rounded).toBe(true)
    expect(config.server.timeout).toBe(1000)
    expect(config.server.retries).toBe(2)
  })

  it('resets defaults when behavior registry resets for tests', () => {
    applyFrameworkDefaults({
      table: { fieldsAlias: { title: 'Judul' } },
      detail: { fieldsAlias: { title: 'Judul' } },
      form: { fieldsAlias: { title: 'Judul' } },
      mode: 'custom',
    })
    applyFrameworkConfig({ apiUrl: 'https://api.example.com/' })

    resetFrameworkBehaviorsForTests()

    expect(defaultTableConfig.fieldsAlias).toEqual({})
    expect(defaultDetailConfig.fieldsAlias).toEqual({})
    expect(defaultFormConfig.fieldsAlias).toEqual({})
    expect(defaultFormConfig.inputConfig).toEqual({})
    expect(config.apiUrl).toBe('')
    expect(config.server).toEqual({})
    expect(mode).toBe('default')
  })
})
