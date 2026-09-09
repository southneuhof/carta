// Proof only. Production uses the bundled manifest from Sprindle tooling.
import { readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Hono } from '../../../packages/sprindle/node_modules/hono/dist/index.js';
import { list, detail, defineRoute, defineScope } from '../../../packages/sprindle/src/routes/index';
import { installSprindle, sprindleOnError } from '../../../packages/sprindle/src/hono/index';

export { list, detail, defineRoute, defineScope };

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  }))).flat().sort();
}

export async function compile(root: string, cache: string, revision: number) {
  const all = await files(root);
  const imports: string[] = [];
  const entries: string[] = [];
  const scopeNames = new Map<string, string>();
  for (const file of all.filter((file) => file.endsWith('/+scope.ts'))) {
    const name = `scope${scopeNames.size}`;
    scopeNames.set(dirname(file), name);
    imports.push(`import ${name} from ${JSON.stringify(pathToFileURL(file).href + '?v=' + revision)};`);
  }
  for (const file of all.filter((file) => file.endsWith('/+server.ts'))) {
    const directory = dirname(file);
    const segments = relative(root, directory).split('/').filter(Boolean);
    for (const segment of segments) if (!/^(?:[a-zA-Z0-9_.-]+|\([a-zA-Z0-9_-]+\)|\[[a-zA-Z][a-zA-Z0-9]*\])$/.test(segment)) throw new Error(`${file}: unsupported segment ${segment}`);
    const httpPath = '/' + segments.filter((segment) => !segment.startsWith('(')).map((segment) => segment.replace(/^\[(.+)\]$/, ':$1')).join('/');
    const parameters = segments.flatMap((segment) => /^\[(.+)\]$/.exec(segment)?.slice(1) ?? []);
    const scopes = [root, ...segments.map((_, index) => join(root, ...segments.slice(0, index + 1)))];
    const name = `route${entries.length}`;
    imports.push(`import * as ${name} from ${JSON.stringify(pathToFileURL(file).href + '?v=' + revision)};`);
    entries.push(`{sourcePath:${JSON.stringify(file)},httpPath:${JSON.stringify(httpPath)},parameters:${JSON.stringify(parameters)},methods:Object.keys(${name}),scopes:[${scopes.map((scope) => scopeNames.get(scope)).filter(Boolean).join(',')}],handlers:${name}}`);
  }
  await mkdir(cache, { recursive: true });
  const manifest = join(cache, `manifest-${revision}.mjs`);
  await writeFile(manifest + '.tmp', imports.join('\n') + `\nexport default [${entries.join(',\n')}];\n`);
  await rename(manifest + '.tmp', manifest);
  const routes = (await import(pathToFileURL(manifest).href)).default;
  routes.sort((left: { httpPath: string }, right: { httpPath: string }) => {
    const a = left.httpPath.split('/'), b = right.httpPath.split('/');
    for (let index = 0; index < Math.min(a.length, b.length); index++) {
      const difference = Number(a[index].startsWith(':')) - Number(b[index].startsWith(':'));
      if (difference) return difference;
    }
    return left.httpPath.localeCompare(right.httpPath);
  });
  return installSprindle(new Hono().onError(sprindleOnError), routes);
}

export async function development(root: string, cache: string) {
  let revision = 0;
  let app: Hono;
  let error: Error | undefined;
  let queue = Promise.resolve();
  const rebuild = () => { queue = queue.then(async () => { try { app = await compile(root, cache, ++revision); error = undefined; } catch (caught) { error = caught as Error; } }); };
  const watcher = watch(root, { recursive: true }, rebuild);
  rebuild(); await queue;
  return { request: (...args: Parameters<Hono['request']>) => { if (error) throw error; return app.request(...args); }, close: async () => { watcher.close(); await queue; } };
}
