import { generateRpc } from '@southneuhof/sprindle/rpc-generator'

generateRpc().catch((error) => {
  console.error(error)
  process.exit(1)
})
