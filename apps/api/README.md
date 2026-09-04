# API

## Environment

Copy `.env.example` to `.env` and configure the database and auth settings. Copy `.env.example` to `.env`. The API trusts `APP_ORIGIN` only. API port 5180, database `carta`, admin seed via `CARTA_ADMIN_EMAIL` and `CARTA_ADMIN_PASSWORD`.

Auth is served at `/api/auth/*`. All routes except `/health` and `/api/auth/*` require a valid Better Auth session cookie.

`src/routes/` is the public API surface. Group related route files in folders.

## Direct S3/MinIO uploads

The API can issue an authenticated, short-lived `PUT` URL. The API does not
receive the file bytes.

Configure these variables in `.env`:

```text
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
```

Request a URL:

```sh
curl -c cookies.txt -b cookies.txt -X POST "$API_URL/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  --data '{"email":"admin@example.com","password":"demo-password"}'

curl -c cookies.txt -b cookies.txt -X POST "$API_URL/files/presigned-url" \
  -H 'Content-Type: application/json' \
  --data '{"filename":"sample.txt","contentType":"text/plain","size":12}'
```

Copy `data.uploadUrl` from the response, then upload the file directly to
MinIO with the returned `Content-Type` header:

```sh
curl -X PUT '<paste-data.uploadUrl-here>' \
  -H 'Content-Type: text/plain' \
  --upload-file ./sample.txt
```

The response includes `data.downloadUrl`, a stable authenticated API URL for
displaying the object. The API creates a short-lived MinIO `GET` signature when
the browser opens that URL. The API does not store file metadata.

List objects under the application prefix:

```sh
curl -b cookies.txt "$API_URL/files?prefix=uploads/"
```

Delete an object with its server-generated key:

```sh
curl -b cookies.txt -X DELETE "$API_URL/files/object" \
  -H 'Content-Type: application/json' \
  --data '{"key":"uploads/<object-key>"}'
```

`S3_ENDPOINT` must be reachable by the browser that performs the `PUT`. The
MinIO bucket CORS policy must allow `PUT` from the browser origin and allow the
signed request headers, including `Content-Type`.

Naming:

- `*.ts`: route entry
- `*.model.ts`: model entry
- `*.entity.ts`: entity entry
- `*.routes.ts`: custom model routes

Example:

```txt
src/routes/uoms/uoms.ts
src/routes/uoms/uoms.entity.ts
src/routes/quality-inspection/quality-inspection.routes.ts
src/routes/quality-inspection/quality-inspection.service.ts
```

Export first-class routes and models directly:

```ts
export const exampleModel = defineModel({
  path: '/example',
  entity: example,
  routes: { list: list(), detail: detail() },
})

export const healthRoute = defineRoute({
  path: '/health',
  method: 'get',
  action: () => ({ ok: true }),
})
```

Register routes explicitly in `src/routes/index.ts`, then install them with `installSprindle(app, routes)`. Model route RPC types come from their Sprindle route tree.
