import { createDrizzleModelFactory } from '@southneuhof/domain/source'
import { getDb } from './db'

export const createEntity = createDrizzleModelFactory(getDb())
