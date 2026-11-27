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

function namedImports(sf) {
  const imports = new Map()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const target = resolveTsFile(sf.fileName, stmt.moduleSpecifier.text)
    const bindings = stmt.importClause?.namedBindings
    if (!target || !bindings || !ts.isNamedImports(bindings)) continue
    for (const el of bindings.elements) {
      imports.set(el.name.text, { file: target, exported: (el.propertyName ?? el.name).text })
    }
  }
  return imports
}

function membersOfType(node, sf, visited) {
  if (!node) return []
  if (ts.isTypeLiteralNode(node)) return [...node.members]
  if (ts.isMappedTypeNode(node)) return [node]
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    return node.types.flatMap((part) => membersOfType(part, sf, visited))
  }
  if (ts.isParenthesizedTypeNode(node)) return membersOfType(node.type, sf, visited)
  if (!ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) return []
  const name = node.typeName.text
  if (['Omit', 'Pick', 'Partial', 'Required'].includes(name) && node.typeArguments?.length) {
    const base = membersOfType(node.typeArguments[0], sf, visited)
    const keys = new Set(extractStringLiterals(node.typeArguments[1]))
    if (name === 'Omit') return base.filter((member) => !keys.has(propertyNameText(member.name)))
    if (name === 'Pick') return base.filter((member) => keys.has(propertyNameText(member.name)))
    return base
  }
  return resolveMembers(sf, name, visited)
}

function resolveMembers(sf, name, visited = new Set()) {
  const key = `${sf.fileName}#${name}`
  if (visited.has(key)) return []
  const next = new Set(visited).add(key)
  const imported = namedImports(sf).get(name)
  if (imported && !imported.file.endsWith('.vue')) return resolveMembers(parseTs(imported.file), imported.exported, next)

  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) {
      const inherited = (stmt.heritageClauses ?? []).flatMap((clause) =>
        clause.types.flatMap((entry) => ts.isIdentifier(entry.expression) ? resolveMembers(sf, entry.expression.text, next) : []),
      )
      return [...inherited, ...stmt.members]
    }
    if (ts.isTypeAliasDeclaration(stmt) && stmt.name.text === name) return membersOfType(stmt.type, sf, next)
  }
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const target = resolveTsFile(sf.fileName, stmt.moduleSpecifier.text)
    if (!target || target.endsWith('.vue')) continue
    if (!stmt.exportClause) {
      const found = resolveMembers(parseTs(target), name, next)
      if (found.length) return found
    } else if (ts.isNamedExports(stmt.exportClause)) {
      const match = stmt.exportClause.elements.find((el) => el.name.text === name)
      if (match) return resolveMembers(parseTs(target), (match.propertyName ?? match.name).text, next)
    }
  }
  return []
}

function propNames(members) {
  return [...new Set(members.filter(ts.isPropertySignature).map((member) => propertyNameText(member.name)).filter(Boolean))]
}

function collectTypeMembers(filePath, typeName) {
  return propNames(resolveMembers(parseTs(filePath), typeName))
}

function extractStringLiterals(node) {
  if (!node) return []
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text]
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(extractStringLiterals)
  return []
}

function typeText(node) {
  return node.getText().replace(/\s+/g, ' ').trim()
}

function camelCase(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function extractSlots(templateContent, bindings) {
  if (!templateContent) return []
  const slots = []
  const visit = (node) => {
    if (node.type === 1 && node.tag === 'slot') {
      const nameAttr = node.props.find((prop) => prop.type === 6 && prop.name === 'name')
      const dynamicName = node.props.find((prop) => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'name')
      const name = nameAttr?.value?.content ?? (dynamicName ? '[dynamic]' : 'default')
      const shape = node.props.flatMap((prop) => {
        if (prop.type !== 7 || prop.name !== 'bind') return []
        if (prop.arg) return prop.arg.content === 'name' ? [] : [camelCase(prop.arg.content)]
        const value = prop.exp?.content
        if (!value) return []
        if (bindings.has(value)) return bindings.get(value)
        const expression = ts.createSourceFile('binding.ts', `(${value})`, ts.ScriptTarget.Latest, true).statements[0]?.expression?.expression
        if (!expression || !ts.isObjectLiteralExpression(expression)) return [`...${value}`]
        return expression.properties.flatMap((property) => {
          if (ts.isSpreadAssignment(property)) return [`...${typeText(property.expression)}`]
          const key = propertyNameText(property.name)
          return key ? [key] : []
        })
      })
      const label = dynamicName?.exp?.content.match(/^`([^$]+)\$\{/)?.[1]
      slots.push({ name, label: label ? `${label}${'{key}'}` : name, shape: [...new Set(shape)].join(', ') })
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(vueDom.baseParse(templateContent))
  return slots
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

const runtimeTypes = new Map([
  ['String', 'string'], ['Boolean', 'boolean'], ['Number', 'number'],
  ['Object', 'object'], ['Function', 'Function'], ['Array', 'unknown[]'],
])

function runtimeValue(expression) {
  if (!ts.isIdentifier(expression)) return expression
  const sf = expression.getSourceFile()
  const imported = namedImports(sf).get(expression.text)
  const declarationFile = imported ? parseTs(imported.file) : sf
  const name = imported?.exported ?? expression.text
  for (const statement of declarationFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    const declaration = statement.declarationList.declarations.find((entry) => propertyNameText(entry.name) === name)
    if (declaration?.initializer) return declaration.initializer
  }
  return expression
}

function runtimeType(expression) {
  if (ts.isAsExpression(expression) && ts.isTypeReferenceNode(expression.type) &&
      expression.type.typeName.getText() === 'PropType' && expression.type.typeArguments?.length) {
    return typeText(expression.type.typeArguments[0])
  }
  if (ts.isArrayLiteralExpression(expression)) return expression.elements.map(runtimeType).join(' | ')
  return runtimeTypes.get(expression.getText()) ?? typeText(expression)
}

function runtimeProps(object) {
  return object.properties.flatMap((prop) => {
    if (ts.isSpreadAssignment(prop)) {
      const source = runtimeValue(prop.expression)
      return ts.isObjectLiteralExpression(source) ? runtimeProps(source) : []
    }
    const name = propertyNameText(prop.name)
    if (!name || !ts.isPropertyAssignment(prop)) return []
    let type = prop.initializer
    let required = false
    if (ts.isObjectLiteralExpression(type)) {
      const options = type.properties.flatMap((entry) => {
        if (!ts.isSpreadAssignment(entry)) return [entry]
        const source = runtimeValue(entry.expression)
        return ts.isObjectLiteralExpression(source) ? [...source.properties] : []
      }).filter(ts.isPropertyAssignment)
      required = options.some((entry) => propertyNameText(entry.name) === 'required' && entry.initializer.kind === ts.SyntaxKind.TrueKeyword)
      type = options.find((entry) => propertyNameText(entry.name) === 'type')?.initializer
    }
    return type ? [`${name}${required ? '' : '?'}: ${runtimeType(type)}`] : []
  })
}

function slotContract(member) {
  const index = ts.isIndexSignatureDeclaration(member)
  const mapped = ts.isMappedTypeNode(member)
  const name = index ? member.parameters[0].type : mapped ? member.nameType : member.name
  const label = (name && (index || mapped ? typeText(name).replaceAll('`', '') : propertyNameText(name))) ?? '[dynamic]'
  const type = member.type
  if (!type || !ts.isFunctionTypeNode(type)) return undefined
  const shape = type.parameters[0]?.type
  if (!shape) return [label, '']
  const keys = ts.isTypeReferenceNode(shape) ? propNames(membersOfType(shape, shape.getSourceFile())) : []
  return [label, keys.length ? `${typeText(shape)} { ${keys.join(', ')} }` : typeText(shape)]
}

function extractVueComponent(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor } = vueSfc.parse(source, { filename: filePath })
  const scriptContent = descriptor.scriptSetup?.content ?? descriptor.script?.content ?? ''
  const sf = ts.createSourceFile(filePath, scriptContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

  const props = []
  const models = []
  const typedProps = []
  const typedSlots = new Map()
  const slotBindings = new Map()
  let propDeclaration
  let commonProps = false

  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer &&
        ts.isCallExpression(node.initializer) && node.initializer.typeArguments?.length) {
      const keys = propNames(membersOfType(node.initializer.typeArguments[0], sf))
      if (keys.length) slotBindings.set(node.name.text, keys)
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text
      const type = node.typeArguments?.[0]
      if (callee === 'defineModel') {
        const first = node.arguments[0]
        const model = first && ts.isStringLiteral(first) ? `v-model:${first.text}` : 'v-model'
        models.push(model)
        if (type) typedProps.push(`${model}: ${typeText(type)}`)
      }
      if (callee === 'defineSlots' && type) {
        for (const member of membersOfType(type, sf)) {
          const slot = slotContract(member)
          if (slot) typedSlots.set(...slot)
        }
      }
      if (callee === 'defineProps') {
        if (type) {
          const members = membersOfType(type, sf)
          propDeclaration = typeText(type)
          props.push(...propNames(members))
          for (const member of members.filter(ts.isPropertySignature)) {
            const name = propertyNameText(member.name)
            if (member.type && name && !isDomNoiseProp(name)) {
              typedProps.push(`${name}${member.questionToken ? '?' : ''}: ${typeText(member.type)}`)
            }
          }
        } else if (node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
          typedProps.push(...runtimeProps(node.arguments[0]))
          for (const prop of node.arguments[0].properties) {
            if (ts.isSpreadAssignment(prop)) {
              if (ts.isIdentifier(prop.expression)) {
                if (prop.expression.text === 'commonProps') commonProps = true
                else props.push(`...${prop.expression.text}`)
              }
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

  const slots = extractSlots(descriptor.template?.content, slotBindings)
  const uniqueProps = [...new Set(props)].filter((name) => !isDomNoiseProp(name))
  if (commonProps) uniqueProps.push('...commonProps')
  const slotContracts = new Map(typedSlots)
  for (const { name, label, shape } of slots) {
    if (name === '[dynamic]' && label === name && [...typedSlots.keys()].some((key) => key.includes('${'))) continue
    if (!slotContracts.has(label)) slotContracts.set(label, shape && `{ ${shape} }`)
  }
  return {
    models: [...new Set(models)], props: uniqueProps, slots: [...new Set(slots.map((slot) => slot.name))],
    propDeclaration, typedProps: [...new Set(typedProps)],
    typedSlots: [...slotContracts].map(([name, shape]) => shape ? `${name}: ${shape}` : name),
  }
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
  const direct = collectBarrelVueExports(resolve(root, 'packages/loom/src/index.ts'))
  const components = new Map([...views, ...core, ...base, ...composites, ...direct].map((item) => [item.name, item]))
  const highTraffic = ['ListView', 'DetailView', 'Form', 'TableInput', 'DateInput', 'DateRangeInput', 'SelectInput', 'DrawingCanvas', 'Drawer', 'MapView']
  const contractLines = highTraffic.flatMap((name) => {
    const { file } = components.get(name)
    const { propDeclaration, typedProps, typedSlots } = extractVueComponent(file)
    const source = posixPath(root, file).replace(/^packages\/loom\//, '')
    const declaration = propDeclaration && !propDeclaration.startsWith('{') ? ` (${formatList([propDeclaration])})` : ''
    return [
      `### [${name}](${source})`,
      '',
      `- Props${declaration} ${formatList(typedProps)}`,
      `- Slots ${formatList(typedSlots, 'None')}`,
      '',
    ]
  })
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

  const operations = parseTs(resolve(root, 'packages/loom/src/resources/operations.ts'))
  const exports = parseTs(resolve(root, 'packages/loom/src/exports/contracts.ts'))
  const context = propNames(resolveMembers(operations, 'ResourceCustomContext'))
  const handles = propNames(resolveMembers(operations, 'ResourceCustomHandle'))
  const download = resolveMembers(exports, 'ExportDownloadOption').map((member) => typeText(member))
  const downloadList = resolveMembers(exports, 'ListExportConfiguration').find((member) => propertyNameText(member.name) === 'downloads')
  const resourceContracts = [
    '- Declare custom commands in `defineResource({ actions: { name: { permission, run } } })`. Use a function in the same map for a read action.',
    `- Command options ${formatList(customCmdProps)}. Use the bound command at \`resource.actions.name\`.`,
    `- Bound command members ${formatList(handles)}. Call \`withContext({ ${context.join(', ')} })\` for record access checks. Pass the same operation arguments to \`can(...args)\` and \`run(...args)\`. \`run\` checks access and invalidates queries after success.`,
    `- Set \`exports.list.downloads\` for custom downloads in the list export menu. Type ${formatList([typeText(downloadList)])}. Each entry has ${formatList(download)}.`,
  ]

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
    '## High-traffic component contracts',
    '',
    'See each declaration for constraints on combinations of props.',
    '',
    ...contractLines,
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
    '## Resource custom commands and exports',
    '',
    ...resourceContracts,
    '',
    '## Resource and web transport helpers',
    '',
    `- \`@southneuhof/loom\` resource API: ${formatList(resourceApi)}`,
    `  - \`defineResource\` keys: ${formatList(resourceDeclProps)}`,
    `  - \`create\` / \`update\` / \`delete\` write options include: ${formatList(createDeclProps.filter((k) => ['permission', 'route', 'visible', 'invalidates', 'successMessage', 'backTo', 'defaultTo'].includes(k)))}`,
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
