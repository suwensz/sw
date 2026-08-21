/**
 * preload.cjs — 渲染进程安全桥接
 * 通过 contextBridge 暴露受限的桌面能力给 Vue 应用
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('suhengOS', {
  // 应用信息
  getInfo: () => ipcRenderer.invoke('app:getInfo'),
  setAutoLaunch: (enable) => ipcRenderer.invoke('app:setAutoLaunch', enable),
  getAutoLaunch: () => ipcRenderer.invoke('app:getAutoLaunch'),

  // 窗口控制
  minimize: () => ipcRenderer.send('app:minimize'),
  maximize: () => ipcRenderer.send('app:maximize'),
  close: () => ipcRenderer.send('app:close'),

  // 手表悬浮窗
  openWatcher: () => ipcRenderer.send('watch:openWatcher'),
  hideWatcher: () => ipcRenderer.send('app:hideWatcher'),

  // 健康预警通知
  alert: (payload) => ipcRenderer.send('health:alert', payload),

  // 外部链接
  openExternal: (url) => ipcRenderer.send('shell:openExternal', url),

  // 事件监听（主进程 → 渲染进程）
  on: (channel, cb) => {
    const valid = ['nav:go', 'system:suspend', 'system:resume']
    if (!valid.includes(channel)) return
    const listener = (_e, data) => cb(data)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  // 平台标识
  isDesktop: true,
  platform: process.platform,
})
