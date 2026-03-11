/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_MODE?: 'mock' | 'strapi' | 'custom'
  readonly VITE_STRAPI_URL?: string
  readonly VITE_STRAPI_TOKEN?: string
  readonly VITE_CUSTOM_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.graphql?raw' {
  const content: string
  export default content
}
