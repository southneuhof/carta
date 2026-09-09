import { defineRoute } from '@southneuhof/sprindle'
import { deleteFileConfig, fileObjectConfig } from '../../../files/files'

export const GET = defineRoute(fileObjectConfig)
export const DELETE = defineRoute(deleteFileConfig)
