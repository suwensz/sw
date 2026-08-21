/**
 * 素衡OS 桌面端类型声明
 * window.suhengOS 由 electron/preload.cjs 注入
 */
export interface SuhengOSAPI {
  getInfo: () => Promise<{
    version: string
    electron: string
    chrome: string
    node: string
    platform: NodeJS.Platform
    arch: string
    os: string
    isPackaged: boolean
  }>
  setAutoLaunch: (enable: boolean) => Promise<boolean>
  getAutoLaunch: () => Promise<boolean>
  minimize: () => void
  maximize: () => void
  close: () => void
  openWatcher: () => void
  hideWatcher: () => void
  alert: (payload: { title?: string; body?: string; level?: 'info' | 'warning' | 'danger' | 'success' }) => void
  openExternal: (url: string) => void
  on: (
    channel: 'nav:go' | 'system:suspend' | 'system:resume',
    cb: (data: unknown) => void,
  ) => (() => void) | undefined
  isDesktop: boolean
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    suhengOS?: SuhengOSAPI
  }
}

export {}
