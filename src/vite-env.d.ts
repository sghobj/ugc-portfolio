/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_MODE?: 'mock' | 'strapi' | 'custom'
  readonly VITE_STRAPI_URL?: string
  readonly VITE_STRAPI_TOKEN?: string
  readonly VITE_CUSTOM_API_URL?: string
  readonly VITE_UPLOAD_STAGE?: string
  readonly VITE_FEEDBACK_FORM_PATH?: string
  readonly VITE_FEEDBACK_SUBMIT_URL?: string
  readonly VITE_STRAPI_FEEDBACK_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.graphql?raw' {
  const content: string
  export default content
}
