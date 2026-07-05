import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as ts from 'typescript'

type RuntimeAction = {
  method: string
  path: string
  kind: 'list' | 'detail' | 'create' | 'update' | 'delete' | 'custom'
  bind: unknown
}

type RuntimeModel = {
  name: string
  actions: Record<string, unknown>
}

type ImportBinding = {
  imported: string
  moduleSpecifier: string
}

type ModelDefinition = {
  file: string
  exportName: string
  entityName: string
  entityImport: ImportBinding
}

type Route = {
  path: string
  method: string
  input: string
  status: 200 | 201
}

const cwd = process.cwd()
const srcDir = path.join(cwd, 'src')
const domainsDir = path.join(srcDir, 'domains')
const generatedPath = path.join(srcDir, 'rpc.generated.ts')
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<Record<string, unknown>>

async function main() {
  const files = await findFiles(domainsDir)
  const definitions = (await Promise.all(files.map(readModelDefinitions))).flat()
  const routes: Route[] = []
  const imports = new Map<string, string>()

  for (const definition of definitions) {
    const module = await dynamicImport(`${pathToFileURL(definition.file).href}?t=${Date.now()}`)
    const model = module[definition.exportName] as RuntimeModel | undefined
    if (!model?.actions) throw new Error(`Missing exported model "${definition.exportName}" in ${definition.file}`)

    const entityAlias = `${pascal(model.name)}Entity`
    imports.set(entityAlias, importLine(definition, entityAlias))
    routes.push(...collectRoutes(model, entityAlias))
  }

  routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
  await mkdir(path.dirname(generatedPath), { recursive: true })
  await writeFile(generatedPath, renderGenerated([...imports.values()].sort(), routes))
  console.log(`Generated ${path.relative(cwd, generatedPath)} (${routes.length} routes)`)
}

async function findFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const next = path.join(dir, entry.name)
      if (entry.isDirectory()) return findFiles(next)
      if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) return [next]
      return []
    }),
  )
  return files.flat()
}

async function readModelDefinitions(file: string): Promise<ModelDefinition[]> {
  const text = await readFile(file, 'utf8')
  if (!text.includes('defineModel')) return []

  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = readImports(sourceFile)
  const definitions: ModelDefinition[] = []

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node) || !hasExport(node)) return
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
      const config = getDefineModelConfig(declaration.initializer)
      if (!config) continue

      const entityName = getObjectIdentifier(config, 'entity')
      if (!entityName) throw new Error(`defineModel() in ${file} needs an identifier entity.`)

      const entityImport = imports.get(entityName)
      if (!entityImport) throw new Error(`Entity "${entityName}" in ${file} must be imported for RPC generation.`)

      definitions.push({ file, exportName: declaration.name.text, entityName, entityImport })
    }
  })

  return definitions
}

function readImports(sourceFile: ts.SourceFile) {
  const imports = new Map<string, ImportBinding>()
  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return
    const named = node.importClause?.namedBindings
    if (!named || !ts.isNamedImports(named)) return
    for (const element of named.elements) {
      imports.set(element.name.text, {
        imported: element.propertyName?.text ?? element.name.text,
        moduleSpecifier: node.moduleSpecifier.text,
      })
    }
  })
  return imports
}

function hasExport(node: ts.VariableStatement) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false
}

function getDefineModelConfig(expression: ts.Expression) {
  if (!ts.isCallExpression(expression)) return undefined
  if (!ts.isIdentifier(expression.expression) || expression.expression.text !== 'defineModel') return undefined
  const [config] = expression.arguments
  return config && ts.isObjectLiteralExpression(config) ? config : undefined
}

function getObjectIdentifier(object: ts.ObjectLiteralExpression, key: string) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue
    if (property.name.text === key && ts.isIdentifier(property.initializer)) return property.initializer.text
  }
  return undefined
}

function importLine(definition: ModelDefinition, alias: string) {
  const resolved = path.resolve(path.dirname(definition.file), definition.entityImport.moduleSpecifier)
  const specifier = toRelativeImport(path.dirname(generatedPath), resolved)
  const imported = definition.entityImport.imported
  return imported === alias
    ? `import type { ${imported} } from '${specifier}'`
    : `import type { ${imported} as ${alias} } from '${specifier}'`
}

function toRelativeImport(fromDir: string, targetNoExtension: string) {
  const relative = path.relative(fromDir, targetNoExtension).replaceAll(path.sep, '/')
  return relative.startsWith('.') ? relative : `./${relative}`
}

function collectRoutes(model: RuntimeModel, entityAlias: string) {
  const routes: Route[] = []
  walkActions(model.actions, [model.name], entityAlias, routes)
  return routes
}

function walkActions(actions: Record<string, unknown>, segments: string[], entityAlias: string, routes: Route[]) {
  for (const [key, value] of Object.entries(actions)) {
    if (isRuntimeAction(value)) {
      const routePath = normalizePath(`/${[...segments, key].join('/')}${value.path}`)
      routes.push({
        path: routePath,
        method: `$${value.method}`,
        input: inputFor(value.kind, routePath, entityAlias),
        status: value.kind === 'create' ? 201 : 200,
      })
      continue
    }

    if (isPlainObject(value)) walkActions(value, [...segments, key], entityAlias, routes)
  }
}

function isRuntimeAction(value: unknown): value is RuntimeAction {
  return Boolean(value && typeof value === 'object' && typeof (value as RuntimeAction).bind === 'function' && typeof (value as RuntimeAction).method === 'string')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

function inputFor(kind: RuntimeAction['kind'], routePath: string, entityAlias: string) {
  const parts: string[] = []
  if (kind === 'list') parts.push('{ query: ListQuery }')
  if (kind === 'create') parts.push(`{ json: z.input<typeof ${entityAlias}.schemas.create> }`)
  if (kind === 'update') parts.push(`{ json: z.input<typeof ${entityAlias}.schemas.update> }`)

  const params = paramInput(routePath)
  if (params) parts.push(params)

  return parts.length ? parts.join(' & ') : '{}'
}

function paramInput(routePath: string) {
  const params = [...routePath.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1])
  if (!params.length) return undefined
  return `{ param: { ${params.map((param) => `${param}: string`).join('; ')} } }`
}

function normalizePath(value: string) {
  return value.replace(/\/+/g, '/')
}

function pascal(value: string) {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('')
}

function renderGenerated(imports: string[], routes: Route[]) {
  return `/* eslint-disable */
// This file is generated by scripts/generate-rpc.ts. Do not edit.

import type { Hono } from 'hono'
import type { z } from 'zod/v4'
${imports.join('\n')}

type ListQuery = {
  page?: string
  limit?: string
  search?: string
}

type JsonEndpoint<TInput, TStatus extends number = 200> = {
  input: TInput
  output: unknown
  outputFormat: 'json'
  status: TStatus
}

export type RpcSchema = {
${routes.map(renderRoute).join('\n')}
}

export type AppType = Hono<{}, RpcSchema>
`
}

function renderRoute(route: Route) {
  return `  '${route.path}': {
    '${route.method}': JsonEndpoint<${route.input}, ${route.status}>
  }`
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
