/**
 * useDesktop — 素衡OS 桌面端能力桥接
 *
 * 自动检测是否运行在 Electron 中，提供安全的桌面 API：
 * - 系统通知（健康预警）
 * - 开机自启
 * - 手表悬浮窗
 * - 窗口控制
 *
 * 在浏览器中运行时，所有方法降级为空实现。
 */
import { ref, onMounted } from 'vue'

export function useDesktop() {
  const isDesktop = ref(false)
  const appInfo = ref<Awaited<ReturnType<NonNullable<Window['suhengOS']>['getInfo']>> | null>(null)
  const autoLaunch = ref(false)
  const api = typeof window !== 'undefined' ? window.suhengOS : undefined

  onMounted(async () => {
    isDesktop.value = !!api?.isDesktop
    if (isDesktop.value && api) {
      appInfo.value = await api.getInfo()
      autoLaunch.value = await api.getAutoLaunch()
    }
  })

  /** 发送健康预警系统通知 */
  const sendAlert = (payload: {
    title?: string
    body?: string
    level?: 'info' | 'warning' | 'danger' | 'success'
  }) => {
    if (api?.isDesktop) {
      api.alert(payload)
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`[素衡健康] ${payload.title || '健康预警'}`, {
        body: payload.body || '',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(`[素衡健康] ${payload.title || '健康预警'}`, {
            body: payload.body || '',
          })
        }
      })
    }
  }

  /** 设置开机自启动 */
  const setAutoLaunch = async (enable: boolean) => {
    if (api?.isDesktop) {
      autoLaunch.value = await api.setAutoLaunch(enable)
    }
  }

  /** 打开手表监测悬浮窗 */
  const openWatcher = () => {
    api?.openWatcher?.()
  }

  /** 最小化/最大化/关闭 */
  const minimize = () => api?.minimize()
  const maximize = () => api?.maximize()
  const close = () => api?.close()

  /** 用系统浏览器打开外链 */
  const openExternal = (url: string) => {
    if (api?.isDesktop) {
      api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  /** 监听主进程导航事件 */
  const onNavigate = (cb: (path: string) => void) => {
    return api?.on('nav:go', (data) => cb(data as string))
  }

  return {
    isDesktop,
    appInfo,
    autoLaunch,
    sendAlert,
    setAutoLaunch,
    openWatcher,
    minimize,
    maximize,
    close,
    openExternal,
    onNavigate,
  }
}
