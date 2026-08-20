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
  /** 登录 / 退出后向主进程上报当前角色（user/admin/ops/dev） */
  setRole: (role: 'user' | 'admin' | 'ops' | 'dev' | null) => void
  /** 请求主进程打开对应端窗口（受角色校验约束） */
  openPortal: (key: 'admin' | 'ops' | 'dev') => void
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
