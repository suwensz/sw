/**
 * 素衡OS · 开发端数据
 * 应用 / 密钥 / Webhook / 告警规则，均为前端 Mock + localStorage 持久化。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  SEED_DEV_APPS,
  SEED_DEV_KEYS,
  SEED_WEBHOOKS,
  SEED_ALERT_RULES,
  type DevApp,
  type DevKey,
  type WebhookRecord,
  type AlertRule,
} from '@/mock/devData'

const APPS_KEY = 'qh_dev_apps'
const KEYS_KEY = 'qh_dev_keys'
const WEBHOOKS_KEY = 'qh_dev_webhooks'
const ALERTS_KEY = 'qh_dev_alerts'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useDevStore = defineStore('dev', () => {
  const apps = ref<DevApp[]>(load(APPS_KEY, SEED_DEV_APPS))
  const keys = ref<DevKey[]>(load(KEYS_KEY, SEED_DEV_KEYS))
  const webhooks = ref<WebhookRecord[]>(load(WEBHOOKS_KEY, SEED_WEBHOOKS))
  const alerts = ref<AlertRule[]>(load(ALERTS_KEY, SEED_ALERT_RULES))

  // ---- 应用 ----
  function addApp(app: Omit<DevApp, 'id' | 'createdAt'>) {
    apps.value.unshift({
      ...app,
      id: `app${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    save(APPS_KEY, apps.value)
  }
  function updateApp(id: string, patch: Partial<DevApp>) {
    const target = apps.value.find((a) => a.id === id)
    if (target) {
      Object.assign(target, patch)
      save(APPS_KEY, apps.value)
    }
  }
  function removeApp(id: string) {
    apps.value = apps.value.filter((a) => a.id !== id)
    keys.value = keys.value.filter((k) => k.appId !== id)
    save(APPS_KEY, apps.value)
    save(KEYS_KEY, keys.value)
  }

  // ---- 密钥 ----
  function generateKey(appId: string): DevKey {
    const rand = () => Math.random().toString(36).slice(2, 10)
    const key: DevKey = {
      id: `k${Date.now().toString(36)}`,
      appId,
      appKey: `ak_${rand()}${rand()}`,
      appSecret: `sk_${rand()}${rand()}${rand()}`,
      scope: 'read',
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    keys.value.unshift(key)
    save(KEYS_KEY, keys.value)
    return key
  }
  function revokeKey(id: string) {
    const target = keys.value.find((k) => k.id === id)
    if (target) {
      target.status = 'revoked'
      save(KEYS_KEY, keys.value)
    }
  }

  // ---- Webhook ----
  function addWebhook(wh: Omit<WebhookRecord, 'id' | 'lastDelivery'>) {
    webhooks.value.unshift({ ...wh, id: `w${Date.now().toString(36)}`, lastDelivery: '—' })
    save(WEBHOOKS_KEY, webhooks.value)
  }
  function toggleWebhook(id: string) {
    const target = webhooks.value.find((w) => w.id === id)
    if (target) {
      target.status = target.status === 'active' ? 'disabled' : 'active'
      save(WEBHOOKS_KEY, webhooks.value)
    }
  }
  function removeWebhook(id: string) {
    webhooks.value = webhooks.value.filter((w) => w.id !== id)
    save(WEBHOOKS_KEY, webhooks.value)
  }

  // ---- 告警规则 ----
  function addAlert(rule: Omit<AlertRule, 'id' | 'lastTrigger'>) {
    alerts.value.unshift({ ...rule, id: `al${Date.now().toString(36)}`, lastTrigger: '—' })
    save(ALERTS_KEY, alerts.value)
  }
  function toggleAlert(id: string) {
    const target = alerts.value.find((a) => a.id === id)
    if (target) {
      target.status = target.status === 'active' ? 'disabled' : 'active'
      save(ALERTS_KEY, alerts.value)
    }
  }
  function removeAlert(id: string) {
    alerts.value = alerts.value.filter((a) => a.id !== id)
    save(ALERTS_KEY, alerts.value)
  }

  return {
    apps,
    keys,
    webhooks,
    alerts,
    addApp,
    updateApp,
    removeApp,
    generateKey,
    revokeKey,
    addWebhook,
    toggleWebhook,
    removeWebhook,
    addAlert,
    toggleAlert,
    removeAlert,
  }
})
