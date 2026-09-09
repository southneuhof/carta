import { defineScope } from '@southneuhof/sprindle'
import { storedAssetModel } from '../../../storage/assets'
import { user, userPublicSchema } from './users.entity'

export default defineScope({ entity: user, enrich: storedAssetModel(userPublicSchema) })
