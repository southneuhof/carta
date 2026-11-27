import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const defaultRoot = resolve(scriptDir, '..')
const requireFromLoom = createRequire(resolve(defaultRoot, 'packages/loom/package.json'))
const ts = requireFromLoom('typescript')
const vueSfc = requireFromLoom('vue/compiler-sfc')
const requireFromVueCompiler = createRequire(requireFromLoom.resolve('vue/compiler-sfc'))
const vueDom = requireFromVueCompiler('@vue/compiler-dom')

function posixPath(root, filePath) {
  return relative(root, filePath).replaceAll('\\', '/')
}

function parseTs(filePath) {
  const source = readFileSync(filePath, 'utf8')
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function propertyNameText(name) {
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}

function resolveTsFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return undefined
  const base = resolve(dirname(fromFile), specifier)
  for (const candidate of [base, `${base}.ts`, `${base}.vue`, resolve(base, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return undefined
}

function collectBarrelVueExports(barrelPath) {
  const sf = parseTs(barrelPath)
  const items = []
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || stmt.isTypeOnly || !stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const specifier = stmt.moduleSpecifier.text
    const resolved = resolveTsFile(barrelPath, specifier)
    if (!resolved || !resolved.endsWith('.vue')) continue
    if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      for (const spec of stmt.exportClause.elements) {
        if (spec.isTypeOnly) continue
        items.push({ name: spec.name.text, file: resolved })
      }
    }
  }
  return items
}

function collectTypeMembers(filePath, typeName, visited = new Set()) {
  const key = `${filePath}#${typeName}`
  if (visited.has(key) || !existsSync(filePath) || filePath.endsWith('.vue')) return []
  visited.add(key)
  const sf = parseTs(filePath)
  const imports = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const target = resolveTsFile(filePath, stmt.moduleSpecifier.text)
    if (!target || !stmt.importClause?.namedBindings || !ts.isNamedImports(stmt.importClause.namedBindings)) continue
    for (const el of stmt.importClause.namedBindings.elements) {
      imports.set(el.name.text, { file: target, exported: (el.propertyName ?? el.name).text })
    }
  }

  const extractFromTypeNode = (node) => {
    if (!node) return []
    if (ts.isTypeLiteralNode(node)) {
      return node.members
        .filter((m) => ts.isPropertySignature(m))
        .map((m) => propertyNameText(m.name))
        .filter(Boolean)
    }
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      return node.types.flatMap(extractFromTypeNode)
    }
    if (ts.isParenthesizedTypeNode(node)) return extractFromTypeNode(node.type)
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const refName = node.typeName.text
      if ((refName === 'Omit' || refName === 'Pick' || refName === 'Partial' || refName === 'Required') && node.typeArguments?.length) {
        const base = extractFromTypeNode(node.typeArguments[0])
        if (refName === 'Omit' && node.typeArguments[1]) {
          const omitted = new Set(extractStringLiterals(node.typeArguments[1]))
          return base.filter((name) => !omitted.has(name))
        }
        if (refName === 'Pick' && node.typeArguments[1]) {
          const picked = new Set(extractStringLiterals(node.typeArguments[1]))
          return base.filter((name) => picked.has(name))
        }
        return base
      }
      const imported = imports.get(refName)
      if (imported) return collectTypeMembers(imported.file, imported.exported, visited)
      return collectTypeMembers(filePath, refName, visited)
    }
    return []
  }

  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === typeName) {
      const own = stmt.members
        .filter((m) => ts.isPropertySignature(m))
        .map((m) => propertyNameText(m.name))
        .filter(Boolean)
      const inherited = (stmt.heritageClauses ?? []).flatMap((clause) =>
        clause.types.flatMap((expr) => {
          if (!ts.isIdentifier(expr.expression)) return []
          const refName = expr.expression.text
          const imported = imports.get(refName)
          return imported ? collectTypeMembers(imported.file, imported.exported, visited) : collectTypeMembers(filePath, refName, visited)
        }),
      )
      return [...new Set([...inherited, ...own])]
    }
    if (ts.isTypeAliasDeclaration(stmt) && stmt.name.text === typeName) {
      return [...new Set(extractFromTypeNode(stmt.type))]
    }
  }
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const target = resolveTsFile(filePath, stmt.moduleSpecifier.text)
    if (!target) continue
    if (!stmt.exportClause) {
      const found = collectTypeMembers(target, typeName, visited)
      if (found.length) return found
    } else if (ts.isNamedExports(stmt.exportClause)) {
      const match = stmt.exportClause.elements.find((el) => el.name.text === typeName)
      if (match) return collectTypeMembers(target, (match.propertyName ?? match.name).text, visited)
    }
  }
  return []
}

function extractStringLiterals(node) {
  if (!node) return []
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text]
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(extractStringLiterals)
  return []
}

function extractSlots(templateContent) {
  if (!templateContent) return []
  const ast = vueDom.baseParse(templateContent)
  const slots = new Set()
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 1 && node.tag === 'slot') {
      const nameAttr = (node.props ?? []).find((p) => p.type === 6 && p.name === 'name')
      const dynamicName = (node.props ?? []).find((p) => p.type === 7 && p.name === 'bind' && p.arg?.content === 'name')
      if (nameAttr?.value?.content) slots.add(nameAttr.value.content)
      else if (dynamicName) slots.add('[dynamic]')
      else slots.add('default')
    }
    for (const child of node.children ?? []) visit(child)
    for (const branch of node.branches ?? []) visit(branch)
  }
  visit(ast)
  return [...slots]
}

const domNoiseProps = new Set([
  'acceptCharset',
  'accesskey',
  'action',
  'autocomplete',
  'class',
  'contenteditable',
  'dir',
  'draggable',
  'enctype',
  'hidden',
  'inert',
  'inputmode',
  'lang',
  'maxlength',
  'method',
  'minlength',
  'novalidate',
  'pattern',
  'role',
  'spellcheck',
  'style',
  'tabindex',
])

function isDomNoiseProp(name) {
  return domNoiseProps.has(name) || name.startsWith('aria-')
}

function extractInlineTypeMembers(filePath, imports, node) {
  if (!node) return []
  if (ts.isTypeLiteralNode(node)) {
    return node.members
      .filter((m) => ts.isPropertySignature(m))
      .map((m) => propertyNameText(m.name))
      .filter(Boolean)
  }
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    return node.types.flatMap((part) => extractInlineTypeMembers(filePath, imports, part))
  }
  if (ts.isParenthesizedTypeNode(node)) return extractInlineTypeMembers(filePath, imports, node.type)
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const refName = node.typeName.text
    const imported = imports.get(refName)
    return imported ? collectTypeMembers(imported.file, imported.exported) : collectTypeMembers(filePath, refName)
  }
  return []
}

function extractVueComponent(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor } = vueSfc.parse(source, { filename: filePath })
  const scriptContent = descriptor.scriptSetup?.content ?? descriptor.script?.content ?? ''
  const sf = ts.createSourceFile(filePath, scriptContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const target = resolveTsFile(filePath, stmt.moduleSpecifier.text)
    if (!target || !stmt.importClause?.namedBindings || !ts.isNamedImports(stmt.importClause.namedBindings)) continue
    for (const el of stmt.importClause.namedBindings.elements) {
      imports.set(el.name.text, { file: target, exported: (el.propertyName ?? el.name).text })
    }
  }

  const props = []
  const models = []
  let hasCommonProps = false

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text
      if (callee === 'defineModel') {
        const first = node.arguments[0]
        models.push(first && ts.isStringLiteral(first) ? `v-model:${first.text}` : 'v-model')
      }
      if (callee === 'defineProps') {
        if (node.typeArguments?.length) {
          props.push(...extractInlineTypeMembers(filePath, imports, node.typeArguments[0]))
        } else if (node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
          for (const prop of node.arguments[0].properties) {
            if (ts.isSpreadAssignment(prop)) {
              if (ts.isIdentifier(prop.expression) && prop.expression.text === 'commonProps') hasCommonProps = true
              else if (ts.isIdentifier(prop.expression)) props.push(`...${prop.expression.text}`)
            } else {
              const name = propertyNameText(prop.name)
              if (name) props.push(name)
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  const uniqueProps = [...new Set(props)].filter((name) => !isDomNoiseProp(name))
  if (hasCommonProps) uniqueProps.push('...commonProps')
  const slots = extractSlots(descriptor.template?.content)
  return { models: [...new Set(models)], props: uniqueProps, slots }
}

function extractBuiltInFormRenderers(root) {
  const formPath = resolve(root, 'packages/loom/src/renderers/form.ts')
  const sf = parseTs(formPath)
  const staticImports = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier) || !stmt.importClause?.name) continue
    const target = resolveTsFile(formPath, stmt.moduleSpecifier.text)
    if (target) staticImports.set(stmt.importClause.name.text, target)
  }
  const rows = []
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'builtInFormRenderers' && node.initializer) {
      const obj = ts.isSatisfiesExpression(node.initializer) ? node.initializer.expression : node.initializer
      if (ts.isObjectLiteralExpression(obj)) {
        for (const prop of obj.properties) {
          if (!ts.isPropertyAssignment(prop)) continue
          const key = propertyNameText(prop.name)
          if (!key) continue
          let target
          const init = ts.isAsExpression(prop.initializer) ? prop.initializer.expression : prop.initializer
          if (ts.isIdentifier(init)) target = staticImports.get(init.text)
          else if (ts.isCallExpression(init) && init.arguments[0] && ts.isArrowFunction(init.arguments[0])) {
            const body = init.arguments[0].body
            if (ts.isCallExpression(body) && body.arguments[0] && ts.isStringLiteral(body.arguments[0])) {
              target = resolveTsFile(formPath, body.arguments[0].text)
            }
          }
          if (target) rows.push({ key, file: target })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return rows
}

function extractAppDisplayRenderers(root) {
  const filePath = resolve(root, 'apps/web/src/framework/display/renderers.ts')
  const sf = parseTs(filePath)
  const propMap = new Map()
  const rows = []
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const name = node.name.text
      if (ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === 'defineComponent') {
        const arg = node.initializer.arguments[0]
        if (arg && ts.isObjectLiteralExpression(arg)) {
          const propsProp = arg.properties.find((p) => ts.isPropertyAssignment(p) && propertyNameText(p.name) === 'props')
          if (propsProp && ts.isObjectLiteralExpression(propsProp.initializer)) {
            propMap.set(
              name,
              propsProp.initializer.properties.map((p) => propertyNameText(p.name)).filter((p) => p && p !== 'value'),
            )
          }
        }
      }
      if (name === 'appDisplayRenderers') {
        const obj = ts.isSatisfiesExpression(node.initializer) ? node.initializer.expression : node.initializer
        if (ts.isObjectLiteralExpression(obj)) {
          for (const prop of obj.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.initializer)) continue
            const key = propertyNameText(prop.name)
            if (key) rows.push({ key, props: propMap.get(prop.initializer.text) ?? [] })
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return rows
}

function extractDefaultFormatters(root) {
  const filePath = resolve(root, 'packages/utilities/src/parse.ts')
  const sf = parseTs(filePath)
  const keys = []
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'createDefaultFormatters' && node.body) {
      for (const stmt of node.body.statements) {
        if (ts.isReturnStatement(stmt) && stmt.expression && ts.isObjectLiteralExpression(stmt.expression)) {
          for (const prop of stmt.expression.properties) {
            const key = propertyNameText(prop.name)
            if (key) keys.push(key)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return keys
}

function extractTsFunctionExports(filePath) {
  const sf = parseTs(filePath)
  const exports = []
  const seen = new Set()
  const isExported = (node) => Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && isExported(stmt) && stmt.name) {
      const name = stmt.name.text
      if (seen.has(name)) continue
      seen.add(name)
      const params = stmt.parameters.map((p) => (ts.isIdentifier(p.name) ? `${p.name.text}${p.questionToken || p.initializer ? '?' : ''}` : 'arg'))
      exports.push(`${name}(${params.join(', ')})`)
    } else if (ts.isVariableStatement(stmt) && isExported(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        const name = decl.name.text
        if (seen.has(name)) continue
        seen.add(name)
        exports.push(name)
      }
    } else if (ts.isClassDeclaration(stmt) && isExported(stmt) && stmt.name) {
      const name = stmt.name.text
      if (seen.has(name)) continue
      seen.add(name)
      exports.push(`class ${name}`)
    }
  }
  return exports
}

function formatList(values, empty = '-') {
  if (!values.length) return empty
  return values.map((v) => `\`${v}\``).join(', ')
}

function compactTypeText(sf, node) {
  if (!node) return ''
  const text = node.getText(sf).replace(/\s+/g, ' ').trim()
  if (text.length <= 72) return text
  if (ts.isTypeLiteralNode(node)) {
    const keys = node.members.map((m) => (ts.isPropertySignature(m) || ts.isMethodSignature(m)) ? propertyNameText(m.name) : '').filter(Boolean)
    return keys.length ? `{ ${keys.join(', ')} }` : '{ ... }'
  }
  return `${text.slice(0, 69)}...`
}

function extractTsSignature(filePath, symbolName) {
  const sf = parseTs(filePath)
  const formatParams = (params) =>
    params
      .map((p) => {
        const name = p.name.getText(sf)
        const opt = p.questionToken || p.initializer ? '?' : ''
        const type = p.type ? `: ${compactTypeText(sf, p.type)}` : ''
        return `${name}${opt}${type}`
      })
      .join(', ')

  const formatTypeParams = (typeParams) => {
    if (!typeParams?.length) return ''
    const parts = typeParams.map((tp) => {
      const name = tp.name.text
      return tp.default ? `${name}?` : name
    })
    return `<${parts.join(', ')}>`
  }

  let match
  for (const stmt of sf.statements) {
    const isExport = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExport) continue
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === symbolName) {
      if (stmt.body || !match) match = stmt
    }
    if (ts.isClassDeclaration(stmt) && stmt.name?.text === symbolName) {
      const ctor = stmt.members.find((m) => ts.isConstructorDeclaration(m))
      return `new ${symbolName}${formatTypeParams(stmt.typeParameters)}(${ctor ? formatParams(ctor.parameters) : ''})`
    }
  }
  if (match) {
    return `${symbolName}${formatTypeParams(match.typeParameters)}(${formatParams(match.parameters)})`
  }
  return symbolName
}

function buildLoomCatalog(root) {
  const views = collectBarrelVueExports(resolve(root, 'packages/loom/src/components/views/index.ts'))
  const core = [
    { name: 'Table', file: resolve(root, 'packages/loom/src/components/core/Table.vue') },
    { name: 'TreeTable', file: resolve(root, 'packages/loom/src/components/core/TreeTable.vue') },
    { name: 'Detail', file: resolve(root, 'packages/loom/src/components/core/Detail.vue') },
    { name: 'Form', file: resolve(root, 'packages/loom/src/components/core/Form.vue') },
  ]
  const base = collectBarrelVueExports(resolve(root, 'packages/loom/src/components/base/index.ts'))
  const composites = collectBarrelVueExports(resolve(root, 'packages/loom/src/components/composites/index.ts'))
  const formRenderers = extractBuiltInFormRenderers(root)
  const displayRenderers = extractAppDisplayRenderers(root)
  const formatters = extractDefaultFormatters(root)
  const resourceApi = extractTsFunctionExports(resolve(root, 'packages/loom/src/resources/defineResource.ts'))
  const honoHelpers = [
    ...extractTsFunctionExports(resolve(root, 'apps/web/src/framework/hono/actions.ts')),
    ...extractTsFunctionExports(resolve(root, 'apps/web/src/framework/hono/response.ts')),
  ]
  const schemaHelpers = extractTsFunctionExports(resolve(root, 'apps/web/src/framework/schema.ts'))

  const renderTable = (items) => {
    const lines = ['| Component | Models and props | Slots | Source |', '|---|---|---|---|']
    for (const item of items) {
      const info = extractVueComponent(item.file)
      const propsAndModels = [...info.models, ...info.props]
      lines.push(`| \`${item.name}\` | ${formatList(propsAndModels)} | ${formatList(info.slots)} | \`${posixPath(root, item.file)}\` |`)
    }
    return lines.join('\n')
  }

  const rendererLines = ['| Form renderer | Component | Unique props | Source |', '|---|---|---|---|']
  for (const entry of formRenderers) {
    const info = extractVueComponent(entry.file)
    const propsAndModels = [...info.models, ...info.props]
    const componentName = posixPath(root, entry.file).split('/').pop().replace(/\.vue$/, '')
    rendererLines.push(`| \`${entry.key}\` | \`${componentName}\` | ${formatList(propsAndModels)} | \`${posixPath(root, entry.file)}\` |`)
  }

  const displayLines = ['| Display renderer | Extra props | Source |', '|---|---|---|']
  for (const entry of displayRenderers) {
    displayLines.push(`| \`${entry.key}\` | ${formatList(entry.props)} | \`apps/web/src/framework/display/renderers.ts\` |`)
  }

  const resourceDeclProps = collectTypeMembers(resolve(root, 'packages/loom/src/resources/operations.ts'), 'ResourceDefinitionInput')
  const createDeclProps = collectTypeMembers(resolve(root, 'packages/loom/src/resources/operations.ts'), 'ResourceCreateDeclaration')
  const customCmdProps = collectTypeMembers(resolve(root, 'packages/loom/src/resources/operations.ts'), 'ResourceCustomCommand')

  const coreFactories = [
    ['defineForm', 'packages/loom/src/forms/defineForm.ts'],
    ['defineTable', 'packages/loom/src/tables/defineTable.ts'],
    ['defineDetail', 'packages/loom/src/details/defineDetail.ts'],
    ['defineResource', 'packages/loom/src/resources/defineResource.ts'],
    ['useCollection', 'packages/loom/src/components/core/useCollection.ts'],
    ['useRecord', 'packages/loom/src/components/core/useRecord.ts'],
    ['useLoader', 'packages/loom/src/query/loader.ts'],
    ['useNamespacedQuery', 'packages/loom/src/query/namespace.ts'],
    ['downloadBlob', 'packages/loom/src/services/download.ts'],
    ['parseFilenameFromContentDisposition', 'packages/loom/src/services/download.ts'],
  ]
  const factoryLines = ['| Export | Signature | Source |', '|---|---|---|']
  for (const [name, rel] of coreFactories) {
    const abs = resolve(root, rel)
    if (!existsSync(abs)) continue
    factoryLines.push(`| \`${name}\` | \`${extractTsSignature(abs, name)}\` | \`${rel}\` |`)
  }

  return [
    '# Loom and web framework catalog',
    '',
    'Generated from source by `node scripts/generate-framework-catalog.mjs`. Do not edit by hand.',
    '',
    '## Views and core components',
    '',
    renderTable([...views, ...core]),
    '',
    '## Base and composite components',
    '',
    renderTable([...base, ...composites]),
    '',
    '## Form renderers (`defineForm`)',
    '',
    rendererLines.join('\n'),
    '',
    '## App display renderers and formatters',
    '',
    displayLines.join('\n'),
    '',
    `- Default parser formatters (\`@southneuhof/utilities/parse\`, configured in \`apps/web/src/main.ts\`): ${formatList(formatters)}`,
    '- Plain multi-line strings in `Detail` and `Table` preserve newlines automatically via `DisplayValue.vue` (`whitespace-pre-line`).',
    '',
    '## Core factories, composables, and utilities (`@southneuhof/loom`)',
    '',
    factoryLines.join('\n'),
    '',
    '## Resource and web transport helpers',
    '',
    `- \`@southneuhof/loom\` resource API: ${formatList(resourceApi)}`,
    `  - \`defineResource\` keys: ${formatList(resourceDeclProps)}`,
    `  - \`create\` / \`update\` / \`delete\` write options include: ${formatList(createDeclProps.filter((k) => ['permission', 'route', 'visible', 'invalidates', 'successMessage', 'backTo', 'defaultTo'].includes(k)))}`,
    `  - custom command options (\`actions.<name>\`): ${formatList(customCmdProps)}`,
    `- \`@/framework/hono\`: ${formatList(honoHelpers)}`,
    `- \`@/framework/schema\`: ${formatList(schemaHelpers)}`,
    '',
  ].join('\n')
}

function extractConstructorOptions(defPath, typeName) {
  const sf = parseTs(defPath)
  for (const stmt of sf.statements) {
    if (!ts.isTypeAliasDeclaration(stmt) || stmt.name.text !== typeName) continue
    if (!ts.isFunctionTypeNode(stmt.type) || !stmt.type.parameters[0]?.type) continue
    const paramType = stmt.type.parameters[0].type
    const keys = []
    const walk = (node) => {
      if (!node) return
      if (ts.isTypeLiteralNode(node)) {
        for (const m of node.members) {
          if (ts.isPropertySignature(m)) {
            const name = propertyNameText(m.name)
            if (name === 'query' && m.type && ts.isTypeLiteralNode(m.type)) {
              const nested = m.type.members.map((sub) => propertyNameText(sub.name)).filter(Boolean)
              keys.push(`query{${nested.join(',')}}`)
            } else if (name) {
              keys.push(name)
            }
          }
        }
      } else if (ts.isIntersectionTypeNode(node)) {
        for (const part of node.types) walk(part)
      } else if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'FilePipeline') {
        keys.push('authorize', 'before', 'validate', 'after', 'error')
      }
    }
    walk(paramType)
    return [...new Set(keys)]
  }
  return []
}

function buildSprindleCatalog(root) {
  const defPath = resolve(root, 'packages/sprindle/src/routes/definition.ts')
  const entityPath = resolve(root, 'packages/sprindle/src/entity/index.ts')
  const drizzleSourcePath = resolve(root, 'packages/sprindle/src/source/drizzle-source.ts')
  const lockRowPath = resolve(root, 'packages/sprindle/src/source/lock-row.ts')

  const routeConstructors = [
    { name: 'defineScope', options: collectTypeMembers(defPath, 'FileScopeConfig'), source: 'packages/sprindle/src/routes/define-scope.ts' },
    { name: 'defineRoute', options: ['authorize', 'before', 'validate', 'after', 'error', 'openapi', 'middleware', 'state', 'action'], source: 'packages/sprindle/src/routes/define-route.ts' },
    { name: 'list', options: extractConstructorOptions(defPath, 'DefineFileList'), source: 'packages/sprindle/src/routes/define-route.ts' },
    { name: 'detail', options: extractConstructorOptions(defPath, 'DefineFileDetail'), source: 'packages/sprindle/src/routes/define-route.ts' },
    { name: 'create', options: extractConstructorOptions(defPath, 'DefineFileCreate'), source: 'packages/sprindle/src/routes/define-route.ts' },
    { name: 'update', options: extractConstructorOptions(defPath, 'DefineFileUpdate'), source: 'packages/sprindle/src/routes/define-route.ts' },
    { name: 'deleteRoute', options: extractConstructorOptions(defPath, 'DefineFileDelete'), source: 'packages/sprindle/src/routes/define-route.ts' },
  ]

  const routeLines = ['| Constructor | Options | Source |', '|---|---|---|']
  for (const item of routeConstructors) {
    routeLines.push(`| \`${item.name}\` | ${formatList(item.options)} | \`${item.source}\` |`)
  }

  const readOptions = collectTypeMembers(drizzleSourcePath, 'CreateDrizzleSourceRead')
  const lockOptions = collectTypeMembers(lockRowPath, 'LockRowOptions')
  const errorsPath = resolve(root, 'packages/sprindle/src/errors.ts')
  const errorSignatures = ['HttpError', 'validationError', 'unauthorized', 'forbidden', 'notFound'].map((name) =>
    extractTsSignature(errorsPath, name),
  )
  const lockSignature = extractTsSignature(lockRowPath, 'lockRow')
  const entityHelpers = extractTsFunctionExports(entityPath)

  const appApiModules = [
    'apps/api/src/identity.ts',
    'apps/api/src/schema.ts',
    'apps/api/src/storage/assets.ts',
    'apps/api/src/storage/uploads.ts',
    'apps/api/src/soft-delete.ts',
    'apps/api/src/unique-violation.ts',
    'apps/api/src/audit.ts',
    'apps/api/src/request-body.ts',
  ]
  const appLines = ['| Module | Exports |', '|---|---|']
  for (const rel of appApiModules) {
    const abs = resolve(root, rel)
    if (!existsSync(abs)) continue
    appLines.push(`| \`${rel}\` | ${formatList(extractTsFunctionExports(abs))} |`)
  }

  return [
    '# Sprindle and API framework catalog',
    '',
    'Generated from source by `node scripts/generate-framework-catalog.mjs`. Do not edit by hand.',
    '',
    '## Route and scope constructors (`@southneuhof/sprindle`)',
    '',
    routeLines.join('\n'),
    '',
    '- Additional route helpers: `authenticated()`, `created(c, data)`.',
    '',
    '## Entity, source, locking, and errors',
    '',
    `- \`@southneuhof/sprindle/entity\`: ${formatList(entityHelpers)}`,
    `  - \`createEntity({ table, schemas, read })\` read options: ${formatList(readOptions)}`,
    `- \`@southneuhof/sprindle/source\`: \`${lockSignature}\` with options ${formatList(lockOptions)} (adds \`deletedAt IS NULL\` automatically, throws 404 or 409 \`invalid_transition\`).`,
    `- \`@southneuhof/sprindle\` errors: ${formatList(errorSignatures)}`,
    '',
    '## App API shared helpers (`apps/api/src/`)',
    '',
    appLines.join('\n'),
    '',
  ].join('\n')
}

export function buildFrameworkCatalogs(root = defaultRoot) {
  return [
    { path: resolve(root, 'packages/loom/CATALOG.md'), content: buildLoomCatalog(root) },
    { path: resolve(root, 'packages/sprindle/CATALOG.md'), content: buildSprindleCatalog(root) },
  ]
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const checkOnly = process.argv.includes('--check')
  const outputs = buildFrameworkCatalogs(defaultRoot)
  if (checkOnly) {
    const stale = outputs.filter((item) => !existsSync(item.path) || readFileSync(item.path, 'utf8') !== item.content)
    if (stale.length) {
      for (const item of stale) {
        console.error(`Framework catalog is out of date: ${posixPath(defaultRoot, item.path)}`)
      }
      console.error('Run `pnpm run catalog:generate` to update generated catalogs.')
      process.exit(1)
    }
    console.log('Framework catalogs are up to date.')
  } else {
    for (const item of outputs) {
      writeFileSync(item.path, item.content, 'utf8')
      console.log(`Wrote ${posixPath(defaultRoot, item.path)}`)
    }
  }
}
