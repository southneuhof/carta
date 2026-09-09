import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,renameSync,rmSync,readdirSync } from 'node:fs';
import { join,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { language,typedImport } from './language-core.mjs';

const repo=fileURLToPath(new URL('../../../',import.meta.url));
const project=mkdtempSync(join(repo,'node_modules/.sprindle-language-proof-'));
const root=join(project,'routes');
const prefix=`import {defineScope,defineRoute,list,detail} from '@southneuhof/sprindle';\n`;
const put=(file,text)=>{const path=join(root,file);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,prefix+text);return path;};
let editor;
let checks=0;
function check(name,run){run();console.log('PASS '+name);checks++;}
try {
  mkdirSync(root);
  writeFileSync(join(project,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true,skipLibCheck:false,target:'ES2022',module:'ESNext',moduleResolution:'Bundler',types:[]},include:['routes/**/*.ts']}));
  const command='node '+JSON.stringify(join(repo,'plans/proofs/file-routing/language-check.mjs'));
  writeFileSync(join(project,'package.json'),JSON.stringify({private:true,scripts:{'type-check':command,build:command}}));
  put('+scope.ts',`export default defineScope({context:async()=>({user:{id:'alice'}})});`);
  const group=put('(authenticated)/+scope.ts',`export default defineScope({context:({context})=>({owner:context.user.id})});`);
  const zod=join(repo,'packages/sprindle/node_modules/zod/v4/index.js');
  put('(authenticated)/users/+scope.ts',`import {z} from ${JSON.stringify(zod)};
    export default defineScope({entity:{schemas:{select:z.object({id:z.string(),name:z.string()})}}});`);
  const custom=put('(authenticated)/users/[userId]/+server.ts',`export const GET=defineRoute({action:({params,context})=>({id:params.userId,owner:context.owner,user:context.user.id})});`);
  const listFile=put('(authenticated)/users/list/+server.ts',`export const GET=list({run:({context,state})=>({data:[{id:context.user.id,name:'Alice'}],total:state.query.page})});`);
  put('(authenticated)/users/detail/[id]/+server.ts',`export const GET=detail({});`);
  editor=language(project);
  check('cold editor start: exact parent types, custom params, list and detail',()=>{
    assert.deepEqual(editor.diagnostics(),[]);
    assert.equal(editor.type(custom,readFileSync(custom,'utf8').indexOf('params.userId')+7),'string');
  });
  check('unsaved parameter error points to the original source offset',()=>{
    const source=readFileSync(custom,'utf8').replace('params.userId','params.wrong');
    editor.open(custom,source);
    const errors=editor.diagnostics();
    assert.equal(errors.length,1,JSON.stringify(errors));
    assert.equal(errors[0].code,2339);
    assert.equal(errors[0].fileName,custom);
    assert.equal(errors[0].pos,source.indexOf('params.wrong')+7);
    editor.closeDocument(custom);
  });
  check('completion exposes only the file parameter',()=>{
    const source=readFileSync(custom,'utf8');
    const entries=editor.completions(custom,source.indexOf('params.userId')+7);
    assert.ok(entries.includes('userId'),JSON.stringify(entries));
    assert.ok(!entries.includes('id'));
    assert.ok(!entries.includes('wrong'));
  });
  check('wrong list record shape fails with inferred entity type',()=>{
    editor.open(listFile,readFileSync(listFile,'utf8').replace("name:'Alice'","label:'Alice'"));
    const errors=editor.diagnostics();
    assert.ok(errors.some(error=>error.fileName===listFile && /name/.test(error.text)),JSON.stringify(errors));
    editor.closeDocument(listFile);
  });
  check('unsaved parent edit updates child diagnostics without a dev server',()=>{
    editor.open(group,readFileSync(group,'utf8').replace('owner:','account:'));
    assert.ok(editor.diagnostics().some(error=>error.fileName===custom && /owner/.test(error.text)));
    editor.closeDocument(group);
    assert.deepEqual(editor.diagnostics(),[]);
  });
  check('adding a route needs no generated file or manual refresh',()=>{
    const added=put('(authenticated)/users/[userId]/orders/[orderId]/+server.ts',`export const GET=defineRoute({action:({params,context})=>({order:params.orderId,user:params.userId,owner:context.owner})});`);
    assert.deepEqual(editor.diagnostics(),[]);
    const source=readFileSync(added,'utf8');
    const entries=editor.completions(added,source.indexOf('params.orderId')+7);
    assert.ok(entries.includes('orderId') && entries.includes('userId'),JSON.stringify(entries));
  });
  check('moving a route changes its context and parameters automatically',()=>{
    const target=join(root,'public/[slug]/+server.ts');
    mkdirSync(dirname(target),{recursive:true});
    renameSync(custom,target);
    const errors=editor.diagnostics();
    assert.ok(errors.some(error=>error.fileName===target && /userId/.test(error.text)));
    assert.ok(errors.some(error=>error.fileName===target && /owner/.test(error.text)));
    assert.ok(!errors.some(error=>/Property 'user' does not exist/.test(error.text)),JSON.stringify(errors));
    const source=readFileSync(target,'utf8');
    assert.ok(editor.completions(target,source.indexOf('params.userId')+7).includes('slug'));
    rmSync(target);
    assert.deepEqual(editor.diagnostics(),[]);
  });
  check('deleting a parent scope removes its context from descendants',()=>{
    const saved=readFileSync(group,'utf8');rmSync(group);
    assert.ok(editor.diagnostics().some(error=>/owner/.test(error.text)));
    writeFileSync(group,saved);
    assert.deepEqual(editor.diagnostics(),[]);
  });
  check('build and editor use the same checks and original source paths',()=>{
    for (const task of ['type-check','build']) {
      const result=spawnSync('pnpm',['--silent','--dir',project,'run',task],{encoding:'utf8'});
      assert.equal(result.status,0,result.stdout+result.stderr);
    }
    const invalid=put('broken/[id]/+server.ts',`export const GET=defineRoute({action:({params})=>params.missing});`);
    const result=spawnSync('pnpm',['--silent','--dir',project,'run','type-check'],{encoding:'utf8'});
    assert.equal(result.status,1,result.stdout+result.stderr);
    assert.deepEqual(result.stdout.trim().split('\n').map(line=>JSON.parse(line)),editor.diagnostics());
    rmSync(invalid);
  });
  check('no generated files or source changes exist on disk',()=>{
    function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):[entry.name]);}
    assert.ok(!walk(project).some(name=>name==='.route.d.ts'||name==='.scope.d.ts'));
    assert.ok(readFileSync(listFile,'utf8').includes("from '@southneuhof/sprindle'"));
    const text=`// from '@southneuhof/sprindle'\n`+prefix;
    const transformed=typedImport(text,'./.route');
    assert.equal(transformed.length,text.length);
    assert.ok(transformed.startsWith(`// from '@southneuhof/sprindle'`));
  });
  console.log(`\n${checks} language checks passed. No development server or generated files were used.`);
} finally {editor?.close();rmSync(project,{recursive:true,force:true});}
