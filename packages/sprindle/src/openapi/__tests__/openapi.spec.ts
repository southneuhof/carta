import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { create, defineRoute, deleteRoute, detail, list, update } from '../../routes'
import { defineModel } from '../../model'
import { createTestEntity, testApp } from '../../testing'
import { generateOpenApi, openapiRoute } from '..'
import type { ModelRuntimeEntity } from '../../source'

const item = {
  ...createTestEntity(),
  schemas: {
    create: z.object({ id: z.string(), name: z.string() }),
    update: z.object({ name: z.string().optional() }),
    select: z.object({ id: z.string(), name: z.string() }),
  },
} as unknown as ModelRuntimeEntity

const ping = defineRoute({ method: 'get', action: ({ c }) => c.json({ ok: true }) })

const model = defineModel({
  path: '/items',
  entity: item,
  routes: {
    list: list(),
    detail: detail(),
    create: create(),
    update: update(),
    delete: deleteRoute(),
    nested: { ping },
  },
})

const health = defineRoute({ path: '/health', method: 'get', action: ({ c }) => c.json({ ok: true }) })
const installables = [model, health] as const
const info = { title: 'Test API', version: '0.0.0' }

describe('generateOpenApi', () => {
  it('emits every canonical route with OpenAPI path syntax', () => {
    const document = generateOpenApi(installables, info)

    expect(document.openapi).toBe('3.1.0')
    expect(Object.keys(document.paths).sort()).toEqual(
      ['/health', '/items/create', '/items/delete/{id}', '/items/detail/{id}', '/items/list', '/items/nested/ping', '/items/update/{id}'].sort(),
    )
    expect(document.paths['/items/update/{id}'].patch).toBeDefined()
    expect(document.paths['/items/delete/{id}'].delete).toBeDefined()
  })

  it('declares the reserved list query parameters and the free-form filter note', () => {
    const listOperation = generateOpenApi(installables, info).paths['/items/list'].get as {
      parameters: { name: string; in: string }[]
      description: string
    }

    expect(listOperation.parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name)).toEqual([
      'page',
      'limit',
      'search',
      'sort',
      'order',
    ])
    expect(listOperation.description).toContain('equal column value')
  })

  it('references entity component schemas for bodies and payloads', () => {
    const document = generateOpenApi(installables, info)

    expect(Object.keys(document.components.schemas).sort()).toEqual(['Items', 'ItemsCreate', 'ItemsUpdate'])
    expect(document.paths['/items/create'].post).toMatchObject({
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemsCreate' } } } },
      responses: { '201': { content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/Items' } } } } } } },
    })
  })

  it('documents the error envelope per kind', () => {
    const detailOperation = generateOpenApi(installables, info).paths['/items/detail/{id}'].get as { responses: Record<string, unknown> }
    expect(Object.keys(detailOperation.responses).sort()).toEqual(['200', '400', '401', '403', '404', '500'])
    expect(detailOperation.responses['404']).toMatchObject({ content: { 'application/json': { schema: { required: ['error'] } } } })
  })

  it('emits only paths the router actually serves', async () => {
    const app = testApp(installables)
    const served = new Set(app.routes.map((route) => route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')))

    for (const path of Object.keys(generateOpenApi(installables, info).paths)) {
      expect(served.has(path)).toBe(true)
    }
  })
})

describe('openapiRoute', () => {
  it('serves the document', async () => {
    const routes = [...installables, openapiRoute(installables, info)] as const
    const response = await testApp(routes).request('/openapi.json')

    expect(response.status).toBe(200)
    expect((await response.json()).openapi).toBe('3.1.0')
  })
})
