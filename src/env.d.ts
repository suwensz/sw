/// <reference types="vite/client" />

// 补充 vite 类型（本地 node_modules 裁剪了 types/importMeta.d.ts）
interface ImportMetaEnv {
  readonly VITE_LLM_PROXY?: string
  readonly [key: string]: string | boolean | undefined
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
