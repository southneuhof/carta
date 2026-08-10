import {
  authenticated,
  detail,
  list,
  update,
} from "@southneuhof/sprindle/routes";
import { defineModel } from "@southneuhof/sprindle/model";
import { requirePermission } from "../../identity";
import { user } from "./users.entity";

export const userModel = defineModel({
  path: "/users",
  entity: user,
  routes: {
    list: list({
      authorize: [authenticated(), requirePermission("view-users")],
    }),
    detail: detail({
      authorize: [authenticated(), requirePermission("view-users")],
    }),
    update: update({
      authorize: [authenticated(), requirePermission("update-users")],
    }),
  },
});
