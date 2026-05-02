/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin in production (e.g. https://api.example.com). Leave empty when using same-origin / proxy. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
