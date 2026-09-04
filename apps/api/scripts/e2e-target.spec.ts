import { describe, expect, it } from 'vitest'
import { assertE2eStorageTarget, assertE2eTarget, E2E_BUCKET_NAME, E2E_DATABASE_NAME, E2E_DATABASE_PURPOSE } from './e2e-target'

describe('E2E target guards', () => {
  it.each([
    ['development database', 'qhsse_hk3', E2E_BUCKET_NAME, E2E_DATABASE_PURPOSE],
    ['Vitest database', 'qhsse_hk_test', E2E_BUCKET_NAME, E2E_DATABASE_PURPOSE],
    ['wrong purpose', E2E_DATABASE_NAME, E2E_BUCKET_NAME, 'development'],
    ['wrong bucket', E2E_DATABASE_NAME, 'qhsse-hk', E2E_DATABASE_PURPOSE],
  ])('rejects %s', (_label, databaseName, bucket, purpose) => {
    expect(() => assertE2eTarget({ databaseName, bucket, purpose })).toThrow()
  })

  it('accepts the exact E2E database and bucket', () => {
    expect(() =>
      assertE2eTarget({
        databaseName: E2E_DATABASE_NAME,
        bucket: E2E_BUCKET_NAME,
        purpose: E2E_DATABASE_PURPOSE,
      })
    ).not.toThrow()
  })

  it('accepts only the exact ignored E2E database override when configured', () => {
    const previous = process.env.CARTA_E2E_DATABASE_NAME
    process.env.CARTA_E2E_DATABASE_NAME = 'configured-e2e-database'
    try {
      expect(() =>
        assertE2eTarget({
          databaseName: 'configured-e2e-database',
          bucket: E2E_BUCKET_NAME,
          purpose: E2E_DATABASE_PURPOSE,
        })
      ).not.toThrow()
      expect(() =>
        assertE2eTarget({
          databaseName: E2E_DATABASE_NAME,
          bucket: E2E_BUCKET_NAME,
          purpose: E2E_DATABASE_PURPOSE,
        })
      ).toThrow()
    } finally {
      if (previous === undefined) delete process.env.CARTA_E2E_DATABASE_NAME
      else process.env.CARTA_E2E_DATABASE_NAME = previous
    }
  })

  it('rejects every bucket except the E2E bucket', () => {
    expect(() => assertE2eStorageTarget('qhsse-hk')).toThrow()
    expect(() => assertE2eStorageTarget(E2E_BUCKET_NAME)).not.toThrow()
  })
})
