# File Manager plugin

File Manager is optional and backend-neutral. Install it after FrameworkPlugin:

```ts
import { FrameworkPlugin } from '@southneuhof/is-vue-framework'
import {
  FileManagerPlugin,
  type FileManagerPluginOptions,
} from '@southneuhof/is-vue-framework/file-manager'

app.use(FrameworkPlugin)
app.use(FileManagerPlugin, fileManagerOptions)
```

App supplies opaque `root`, canonical `ManagedAsset` operations, and value
conversion. Adapter may map backend paths to asset IDs, but framework never
parses IDs or assumes endpoint vocabulary.

```ts
const fileManagerOptions: FileManagerPluginOptions<string> = {
  root: 'root-id',
  operations: {
    list: ({ parentId, signal }) => api.assets.list({ parentId, signal }),
    upload: (file, { parentId, signal, onProgress }) =>
      api.assets.upload(file, { parentId, signal, onProgress }),
  },
  values: {
    fromModel: (id) => api.assets.resolve(id),
    toModel: (asset) => asset.id,
  },
}
```

Optional operations control UI capability. Missing upload, create-folder, or
remove operations hide corresponding actions. File and Image inputs show picker
only when plugin exists. Mutations invalidate affected parent list; subtree
removal also evicts known child listings. Plugin adds no route. App may create a
route with lazy import, owns permissions, and installs one provider per app.
