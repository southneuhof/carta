import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import { numberVariables } from '../number-variables/number-variables.resource'
import { numberConfigs } from './number-configs.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('number configurations resource', () => {
  it('uses number variables as the lookup source by code', () => {
    const field = fields(numberConfigs.create().fields, 'form').find((candidate) => candidate.key === 'numberVariableCode')!
    expect(field).toMatchObject({ renderer: 'lookup', source: numberVariables })
    expect(field.props.pick).toBe('code')
    expect(field.props.loadDetail).toEqual(expect.any(Function))
  })

  it('keeps display order out of the form while showing it on read surfaces', () => {
    expect(fields(numberConfigs.create().fields, 'form').map((field) => field.key)).toEqual(['numberVariableCode', 'numberOfDigits', 'customCode', 'description', 'active'])
    expect(fields(numberConfigs.list().fields, 'table').map((field) => field.key)).toContain('displayOrder')
    expect(fields(numberConfigs.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toContain('displayOrder')
  })

  it('exposes reorder as a custom action', () => {
    expect(numberConfigs.actions.reorder.run).toEqual(expect.any(Function))
  })
})
