import { spawn } from 'node:child_process'

const children = [
  spawn('tsx', ['watch', 'scripts/generate-rpc.ts'], { stdio: 'inherit' }),
  spawn('tsx', ['watch', '--env-file-if-exists=.env', 'src/server.ts'], { stdio: 'inherit' }),
]

for (const child of children) {
  child.on('exit', (code) => {
    for (const sibling of children) {
      if (sibling !== child) sibling.kill()
    }
    process.exit(code ?? 0)
  })
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal)
  })
}
