// Run from the repository root:
// apps/api/node_modules/.bin/tsx plans/proofs/file-routing/proof.ts
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rename, rm, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { compile, development } from './runtime';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const scratch = await mkdtemp(join(repo, 'node_modules/.sprindle-routing-proof-'));
const root = join(scratch, 'routes');
const cache = join(scratch, '.sprindle');
const runtime = pathToFileURL(resolve('plans/proofs/file-routing/runtime.ts')).href;
const testing = pathToFileURL(join(repo, 'packages/sprindle/src/testing/test-entity.ts')).href;
const guards = pathToFileURL(join(repo, 'packages/sprindle/src/routes/authenticated.ts')).href;
const prelude = `import { defineRoute, defineScope, list, detail } from ${JSON.stringify(runtime)};\n`;
let passed = 0;
async function put(file: string, body: string) {
  await mkdir(join(root, file, '..'), { recursive: true });
  await writeFile(join(root, file), prelude + body);
}
async function check(name: string, run: () => Promise<void>) {
  await run(); passed++; process.stdout.write(`PASS ${name}\n`);
}
const headers = { authorization: 'alice' };
const trace: string[] = [];
(globalThis as any).__routingProof = { trace, childCalls: 0, identities: 0 };
let dev: Awaited<ReturnType<typeof development>> | undefined;
try {
  await writeFile(join(scratch, 'package.json'), '{"type":"module"}');
  await put('+scope.ts', `export default defineScope({
    identity: ({c}) => { globalThis.__routingProof.identities++; return c.req.header('authorization') || null; },
    context: () => ({ trace: [], requestValue: null }),
    after: ({response}) => { globalThis.__routingProof.trace.push('root'); return response; },
    error: ({c,error}) => { if(error.message !== 'expected') return; globalThis.__routingProof.trace.push('root-error'); return c.json({error:'root-caught'}, 500); }
  });`);
  await put('health/+server.ts', `export const GET = defineRoute({action: () => ({ok:true})});`);
  await put('(authenticated)/+scope.ts', `import { authenticated } from ${JSON.stringify(guards)};
    export default defineScope({ authorize: [authenticated()],
      after: ({response}) => { globalThis.__routingProof.trace.push('auth'); return response; } });`);
  await put('(authenticated)/users/+scope.ts', `import { createTestEntity } from ${JSON.stringify(testing)};
    export default defineScope({
      entity: createTestEntity({rows:[{id:'a',name:'Alice'},{id:'b',name:'Bob'}]}),
      context: async ({identity}) => { globalThis.__routingProof.childCalls++; return {requestValue: await identity()}; },
      after: ({response}) => { globalThis.__routingProof.trace.push('users'); return response; }
    });`);
  await put('(authenticated)/users/list/+server.ts', 'export const GET = list({});');
  await put('(authenticated)/users/detail/[id]/+server.ts', 'export const GET = detail({});');
  await put('(authenticated)/users/[userId]/+server.ts', `export const GET = defineRoute({action: async ({params,context,identity}) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return {params, value:context.requestValue, identity:await identity()};
  }});`);
  dev = await development(root, cache);
  await check('cold start creates the manifest; public route works', async () => {
    assert.deepEqual(await (await dev!.request('/health')).json(), { ok: true });
    assert.match(await readFile(join(cache, 'manifest-1.mjs'), 'utf8'), /\/users\/detail\/:id/);
  });
  await check('parent rejection prevents child context work', async () => {
    const count = (globalThis as any).__routingProof.childCalls;
    assert.equal((await dev!.request('/users/list')).status, 401);
    assert.equal((globalThis as any).__routingProof.childCalls, count);
  });
  await check('real Sprindle list parsing, records, envelope, and static priority', async () => {
    trace.length = 0;
    const response = await dev!.request('/users/list?limit=1', { headers });
    assert.deepEqual(await response.json(), {data:[{id:'a',name:'Alice'}],page:1,limit:1,total:2});
    assert.deepEqual(trace, ['users', 'auth', 'root']);
    assert.equal((await dev!.request('/users/list?page=0', { headers })).status, 400);
  });
  await check('real Sprindle detail does not append another id segment', async () => {
    assert.deepEqual(await (await dev!.request('/users/detail/a', { headers })).json(), {data:{id:'a',name:'Alice'}});
    assert.equal((await dev!.request('/users/detail/missing', { headers })).status, 404);
  });
  await check('concurrent requests keep separate context and memoized identity', async () => {
    const count = (globalThis as any).__routingProof.identities;
    const responses = await Promise.all(['alice','bob'].map(async (name) =>
      (await dev!.request('/users/' + name, {headers:{authorization:name}})).json()));
    assert.deepEqual(responses, ['alice','bob'].map((name) => ({params:{userId:name},value:name,identity:name})));
    assert.equal((globalThis as any).__routingProof.identities - count, 2);
  });
  async function eventually(path: string, status: number, expected?: object) {
    const deadline = Date.now() + 5000;
    do {
      try {
        const response = await dev!.request(path, {headers});
        if (response.status === status) {
          if (expected) assert.deepEqual(await response.json(), expected);
          return;
        }
      } catch { /* A watch event can occur while the editor writes the file. */ }
      await new Promise(resolve => setTimeout(resolve, 15));
    } while (Date.now() < deadline);
    assert.fail(`watch did not produce ${status} for ${path}`);
  }
  await check('add, edit, move, and delete need no generator call', async () => {
    await put('(authenticated)/users/ping/+server.ts', `export const GET = defineRoute({action:()=>({version:1})});`);
    await eventually('/users/ping', 200, {version:1});
    await put('(authenticated)/users/ping/+server.ts', `export const GET = defineRoute({action:()=>({version:2})});`);
    await eventually('/users/ping', 200, {version:2});
    await rename(join(root,'(authenticated)/users/ping'), join(root,'(authenticated)/users/pong'));
    await eventually('/users/pong', 200, {version:2});
    // The parameter route receives the old path after the static route is moved.
    await eventually('/users/ping', 200, {params:{userId:'ping'},value:'alice',identity:'alice'});
    await rm(join(root,'(authenticated)/users/pong'), {recursive:true});
    await eventually('/users/pong', 200, {params:{userId:'pong'},value:'alice',identity:'alice'});
  });
  await check('child context errors reach an entered parent error hook', async () => {
    await put('(authenticated)/failure/+scope.ts', `export default defineScope({context:()=>{throw Error('expected')}});`);
    await put('(authenticated)/failure/+server.ts', `export const GET = defineRoute({action:()=>({unexpected:true})});`);
    await eventually('/failure', 500, {error:'root-caught'});
    assert.ok(trace.includes('root-error'));
  });
  await check('custom list persistence keeps the canonical response', async () => {
    await put('(authenticated)/users/custom-list/+server.ts', `export const GET = list({
      run: ({context}) => ({data:[{id:context.requestValue}],total:1})
    });`);
    await eventually('/users/custom-list', 200, {data:[{id:'alice'}],page:1,limit:20,total:1});
  });
  await check('custom methods can return a raw HTTP response', async () => {
    await put('(authenticated)/users/action/+server.ts', `export const POST = defineRoute({
      action: () => new Response('accepted',{status:202,headers:{'x-proof':'yes'}})
    });`);
    const deadline = Date.now()+5000;
    while (true) {
      const response = await dev!.request('/users/action', {method:'POST',headers});
      if (response.status === 202) {
        assert.equal(await response.text(),'accepted');
        assert.equal(response.headers.get('x-proof'),'yes');
        break;
      }
      assert.ok(Date.now()<deadline,'watch did not install POST');
      await new Promise(resolve=>setTimeout(resolve,15));
    }
  });
  await dev.close(); dev = undefined;
  let revision = 10000;
  async function invalid(file: string, body: string, message: RegExp) {
    await put(file, body);
    await assert.rejects(compile(root, cache, ++revision), message);
    await rm(join(root,file));
  }
  await check('duplicate routes across groups fail with source paths', async () => {
    await invalid('(other)/health/+server.ts', `export const GET = defineRoute({action:()=>({})});`, /\+server.ts: duplicate GET \/health; also/);
  });
  await check('ambiguous parameter names are rejected', async () => {
    await invalid('(authenticated)/users/[name]/+server.ts', `export const GET = defineRoute({action:()=>({})});`, /duplicate GET \/users\/:parameter/);
  });
  await check('resource method, entity, and id errors are rejected', async () => {
    await invalid('(authenticated)/users/wrong/+server.ts', 'export const POST = detail({});', /detail cannot be exported as POST/);
    await invalid('unbound/+server.ts', 'export const GET = list({});', /list needs an entity scope/);
    await invalid('(authenticated)/users/wrong/+server.ts', 'export const GET = detail({});', /detail needs parameter id/);
  });

  await check('TypeScript counterexample: manifest does not type the source callback', async () => {
    const types = join(scratch, 'type-proof');
    await mkdir(types);
    await writeFile(join(types,'tsconfig.json'), JSON.stringify({compilerOptions:{strict:true,noEmit:true,skipLibCheck:true,target:'ES2022',module:'ESNext',moduleResolution:'Bundler',types:[]},include:['*.ts']}));
    await writeFile(join(types,'framework.ts'), `
      export type Args<P=Record<string,string>,C=Record<string,unknown>> = {params:P;context:C};
      export type Route<P=Record<string,string>,C=Record<string,unknown>> = {action:(args:Args<P,C>)=>unknown};
      export function defineRoute(config:Route):Route {return config}
    `);
    await writeFile(join(types,'route.ts'), `import {defineRoute} from './framework';
      export const GET=defineRoute({action:({params,context})=>{
        const wrongParameter:string=params.notARealParameter;
        // @ts-expect-error A generated consumer does not supply this context type.
        const userId:string=context.user.id;
        return {wrongParameter,userId};
      }});
    `);
    await writeFile(join(types,'manifest.ts'), `import {GET} from './route'; import type {Route} from './framework';
      export const typed:Route<{userId:string},{user:{id:string}}>=GET;
    `);
    const tsc = spawnSync(join(repo,'node_modules/.bin/tsc'), ['-p',types,'--pretty','false'], {encoding:'utf8'});
    assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
    // Control: explicit source context rejects the same invalid parameter.
    await writeFile(join(types,'route.ts'), `import type {Route} from './framework';
      export const GET:Route<{userId:string},{user:{id:string}}>={action:({params,context})=>{
        return {wrong:params.notARealParameter, userId:context.user.id};
      }};
    `);
    const control = spawnSync(join(repo,'node_modules/.bin/tsc'), ['-p',types,'--pretty','false'], {encoding:'utf8'});
    assert.notEqual(control.status,0);
    assert.match(control.stdout + control.stderr, /TS2339.*notARealParameter/);
  });
  process.stdout.write(`\n${passed} checks passed. The final check proves a type-inference LIMIT, not full acceptance.\n`);
} finally {
  await dev?.close();
  delete (globalThis as any).__routingProof;
  await rm(scratch, {recursive:true,force:true});
}
