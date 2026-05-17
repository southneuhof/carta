/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly GOOGLE_MAP_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_APP_BYPASS_ALL_PERMISSIONS: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
