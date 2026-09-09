import { defineRoute } from '@southneuhof/sprindle'
import { presignedUploadConfig } from '../../../files/files'

export const POST = defineRoute(presignedUploadConfig)
