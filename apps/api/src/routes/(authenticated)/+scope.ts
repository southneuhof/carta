import { authenticated, defineScope } from '@southneuhof/sprindle'

export default defineScope({ authorize: authenticated() })
