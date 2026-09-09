// Proof only: file-specific helper types exist in memory, never in source files.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API } from 'typescript/unstable/sync';
import { createScanner } from 'typescript/unstable/ast/scanner';
const zod=fileURLToPath(new URL('../../../packages/sprindle/node_modules/zod/v4/index.js',import.meta.url));

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

// Only import module strings are replaced. Padding preserves every later offset.
// ponytail: scanner handles ordinary named imports; use an AST for full TS syntax.
export function typedImport(source, target) {
  const scanner = createScanner(true, undefined, source);
  let previous = '';
  const edits = [];
  while (scanner.scan() && scanner.getTokenText()) {
    const text = scanner.getTokenText();
    if (previous === 'from' && text.match(/^['"]@southneuhof\/sprindle['"]$/)) {
      const replacement = JSON.stringify(target);
      if (replacement.length > text.length) throw Error('Proof import exceeds source length');
      edits.push({start:scanner.getTokenStart(),end:scanner.getTokenEnd(),text:replacement.padEnd(text.length)});
    }
    previous = text;
  }
  for (const edit of edits.reverse()) source = source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  return source;
}

export function language(projectRoot) {
  const root = join(projectRoot,'routes');
  const config = join(projectRoot,'tsconfig.json');
  const open = new Map();
  let virtual = new Map();
  let snapshot;
  const start = () => new API({cwd:projectRoot,fs:{
    readFile: (file) => virtual.get(file),
    fileExists: (file) => virtual.has(file) ? true : undefined,
  }});
  let api=start();
  function refresh() {
    const paths = new Set([...walk(root),...open.keys()]);
    const next = new Map();
    for (const file of paths) {
      if (!/\/(\+scope|\+server)\.ts$/.test(file)) continue;
      const directory = dirname(file);
      const isScope = file.endsWith('/+scope.ts');
      const segments = relative(root,directory).split('/').filter(Boolean);
      const parents = [root,...segments.map((_,i)=>join(root,...segments.slice(0,i+1)))];
      const scope = parents.reverse().map((dir)=>join(dir,'+scope.ts'))
        .find((candidate)=>paths.has(candidate) && candidate!==file);
      const spec = scope ? './'+relative(directory,scope).replace(/\.ts$/,'') : undefined;
      const parent = scope ? `typeof import(${JSON.stringify(spec)}).default` : '{context:{};entity:never}';
      const params = '{'+segments.filter((segment)=>/^\[\w+\]$/.test(segment))
        .map((segment)=>`${JSON.stringify(segment.slice(1,-1))}:string`).join(';')+'}';
      const helper = isScope ? '.scope' : '.route';
      next.set(file,typedImport(open.get(file) ?? readFileSync(file,'utf8'),'./'+helper));
      next.set(join(directory,helper+'.d.ts'), `
        import type {z} from ${JSON.stringify(zod)};
        type Parent=${parent};
        type Params=${params};
        type Args={params:Params;context:Parent['context']};
        type Row=Parent['entity'] extends {schemas:{select:infer S extends z.ZodType}}?z.output<S>:never;
        export declare function defineScope<C extends object={}, E=Parent['entity']>(config:{
          context?:(args:Args)=>C|Promise<C>;
          entity?:E;
        }):{context:Omit<Parent['context'],keyof C>&C;entity:E};
        export declare function defineRoute<O>(config:{action:(args:Args)=>O}):{output:Awaited<O>};
        export declare function list(config:{run?:(args:Args & {state:{query:{page:number}}})=>
          {data:Row[];total:number}|Promise<{data:Row[];total:number}>}):{output:{data:Row[];total:number}};
        export declare function detail(config:{param?:keyof Params}):{output:{data:Row}};
      `);
    }
    // Supply new roots explicitly; the native API caches parsed project roots.
    next.set(config,JSON.stringify({...JSON.parse(readFileSync(config,'utf8')),files:[...paths].filter(file=>file.endsWith('.ts'))}));
    const created=[...next.keys()].filter(file=>!virtual.has(file));
    const deleted=[...virtual.keys()].filter(file=>!next.has(file));
    const changed=[...next.keys()].filter(file=>virtual.has(file) && virtual.get(file)!==next.get(file));
    virtual = next;
    // ponytail: reopen the compiler on tree changes; use project reload when measured startup cost matters.
    if (snapshot && (created.length || deleted.length)) {
      snapshot.dispose();api.close();api=start();snapshot=undefined;
    }
    snapshot?.dispose();
    snapshot=api.updateSnapshot({openProjects:snapshot?[]:[config],fileChanges:{created,deleted,changed}});
    const project=snapshot.getProject(config);
    if (!project) throw Error('Missing proof project');
    return project;
  }
  return {
    open(file,text) {open.set(file,text);},
    closeDocument(file) {open.delete(file);},
    diagnostics() {
      const project=refresh();
      return [...project.program.getSyntacticDiagnostics(),...project.program.getSemanticDiagnostics()]
        .map(({fileName,pos,end,code,text})=>({fileName,pos,end,code,text}));
    },
    completions(file,position) {
      return refresh().checker.getCompletionsAtPosition(file,position)?.entries.map((entry)=>entry.name) ?? [];
    },
    type(file,position) {
      const project=refresh();
      const type=project.checker.getTypeAtPosition(file,position);
      return type ? project.checker.typeToString(type) : undefined;
    },
    close() {snapshot?.dispose();api.close();},
  };
}
