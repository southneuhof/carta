import { defineDomainPart } from "@southneuhof/sprindle/model";
import { user, users } from "./users.entity";
import { userModel } from "./users.model";
import { createUser } from "./users.routes";

export const domain = defineDomainPart({
  tables: { users },
  entities: [user],
});

export { createUser, userModel };
export default { domain, userModel, createUser };
