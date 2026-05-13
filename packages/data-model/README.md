# @client/data-model

Client-owned model definitions package.

## Structure

```txt
src/
  define-data-model.ts
  define-data-model.web.ts
  define-data-model.native.ts
  define-data-model.server.ts
  models/
    users.model.ts
    roles.model.ts
    tasks.model.ts
```

## Model definition

```ts
import type { ModelConfig } from "@southneuhof/is-data-model";
import { defineDataModel } from "../define-data-model";

const users = defineDataModel({
  base: {
    name: "users",
    title: "Users",
  } satisfies ModelConfig,
  web: {
    title: "Web Users",
  },
  mobile: {
    icon: "team",
    description: "Manage application users.",
  },
  server: {
    title: "Server Users",
  },
});

export default users;
```

`web`, `mobile`, and `server` are optional. Missing platform blocks fall back to `base`.

Platform blocks are deep-merged over `base`; arrays are replaced, not concatenated.

## App imports

```ts
import users from "@client/data-model/models/users.model";
```
