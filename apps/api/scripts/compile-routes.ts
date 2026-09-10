import { compileRouteManifest } from '@southneuhof/sprindle/tooling'
const target = await compileRouteManifest(new URL('..', import.meta.url).pathname, 'src/routes', process.argv[2] ?? '.sprindle-test/routes.mjs', false)
process.stdout.write(`${target}\n`)
