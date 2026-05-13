import users from '@client/data-model/models/users.model'
import type { MobileModelConfig } from '../../catalog.types'

const usersModel: MobileModelConfig = {
  ...users,
}

export default usersModel
