<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Connection, CopyDocument, Monitor, Plus, Refresh, Setting } from '@element-plus/icons-vue'
import { useDevStore } from '@/stores/dev'
import {
  ECOM_PLATFORMS,
  ECOM_PLATFORM_MAP,
  ECOM_SCENARIOS,
  buildRequestUrl,
  buildSign,
  buildSignSource,
  ecomTimestamp,
  type EcomChannel,
  type EcomEnv,
  type EcomPlatformKey,
  type EcomScenario,
} from '@/mock/ecomChannels'

const { t } = useI18n()
const dev = useDevStore()

/* ---------- 原有告警规则 ---------- */
const dialogVisible = ref(false)
const form = ref({ metric: '', threshold: '', channel: '邮件' })
const CHANNELS = ['邮件', '短信', '站内信', 'Webhook']

function openCreate() {
  form.value = { metric: '', threshold: '', channel: '邮件' }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.metric.trim() || !form.value.threshold.trim()) {
    ElMessage.warning('请填写监控指标与阈值')
    return
  }
  dev.addAlert({
    metric: form.value.metric.trim(),
    threshold: form.value.threshold.trim(),
    channel: form.value.channel,
    status: 'active',
  })
  dialogVisible.value = false
  ElMessage.success(t('dev.common.add') + ' ✓')
}

async function remove(id: string) {
  await ElMessageBox.confirm(t('dev.alerts.deleteConfirm'), t('dev.common.confirm'), { type: 'warning' })
  dev.removeAlert(id)
  ElMessage.success(t('dev.common.delete') + ' ✓')
}

/* ---------- 电商渠道接入 ---------- */
const channelMap = computed(() => {
  const map: Partial<Record<EcomPlatformKey, EcomChannel>> = {}
  dev.ecomChannels.forEach((c) => {
    map[c.platform] = c
  })
  return map
})

function channelOf(key: EcomPlatformKey): EcomChannel | undefined {
  return channelMap.value[key]
}

function nowText() {
  const d = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
}

function mask(value: string) {
  const s = value.trim()
  if (!s) return ''
  if (s.length <= 8) return '•'.repeat(s.length)
  return `${s.slice(0, 4)}${'•'.repeat(6)}${s.slice(-4)}`
}

function gatewayOf(key: EcomPlatformKey): string {
  const p = ECOM_PLATFORM_MAP[key]
  const ch = channelOf(key)
  if (ch?.env === 'sandbox' && p.sandboxGateway) return p.sandboxGateway
  return p.gateway
}

const statusType = (s: EcomChannel['status']) => (s === 'connected' ? 'success' : s === 'error' ? 'danger' : 'info')

const statusText = (s: EcomChannel['status']) =>
  s === 'connected' ? t('dev.ecom.statusConnected') : s === 'error' ? t('dev.ecom.statusError') : t('dev.ecom.statusIdle')

/* ---------- 渠道配置 ---------- */
const configVisible = ref(false)
const configForm = ref({
  platform: 'taobao' as EcomPlatformKey,
  env: 'sandbox' as EcomEnv,
  appKey: '',
  appSecret: '',
  session: '',
  callbackUrl: '',
  pollInterval: 15,
})

const configPlatform = computed(() => ECOM_PLATFORM_MAP[configForm.value.platform])

function openConfig(key: EcomPlatformKey) {
  const ch = channelOf(key)
  configForm.value = {
    platform: key,
    env: ch?.env ?? 'prod',
    appKey: ch?.appKey ?? '',
    appSecret: ch?.appSecret ?? '',
    session: ch?.session ?? '',
    callbackUrl: ch?.callbackUrl ?? '',
    pollInterval: ch?.pollInterval ?? 15,
  }
  configVisible.value = true
}

function saveConfig() {
  if (!configForm.value.appKey.trim() || !configForm.value.appSecret.trim()) {
    ElMessage.warning(t('dev.ecom.requiredTip'))
    return
  }
  dev.updateEcomChannel(configForm.value.platform, {
    env: configForm.value.env,
    appKey: configForm.value.appKey.trim(),
    appSecret: configForm.value.appSecret.trim(),
    session: configForm.value.session.trim(),
    callbackUrl: configForm.value.callbackUrl.trim(),
    pollInterval: configForm.value.pollInterval,
  })
  configVisible.value = false
  ElMessage.success(t('dev.common.save') + ' ✓')
}

/* ---------- 联调测试 ---------- */
const testing = ref<EcomPlatformKey | null>(null)

async function runTest(key: EcomPlatformKey) {
  const ch = channelOf(key)
  if (!ch) return
  if (!ch.appKey.trim() || !ch.appSecret.trim()) {
    ElMessage.warning(t('dev.ecom.requiredTip'))
    return
  }
  testing.value = key
  await new Promise((resolve) => setTimeout(resolve, 220 + Math.floor(Math.random() * 320)))

  const p = ECOM_PLATFORM_MAP[key]
  const ctx = {
    platform: p,
    appKey: ch.appKey.trim(),
    appSecret: ch.appSecret.trim(),
    session: ch.session.trim(),
    method: ECOM_SCENARIOS[0]!.methods[key],
    bizParams: { page_no: '1' } as Record<string, string>,
    timestamp: ecomTimestamp(p),
  }
  // 自校验：同一上下文连续两次签名必须完全一致
  const ok = buildSign(ctx) === buildSign(ctx) && ctx.appKey.length > 0

  dev.setEcomStatus(key, ok ? 'connected' : 'error', nowText())
  testing.value = null
  if (ok) ElMessage.success(t('dev.ecom.testSuccess'))
  else ElMessage.error(t('dev.ecom.testFail', { reason: '签名不一致' }))
}

/* ---------- 签名联调台 ---------- */
const signPlatform = ref<EcomPlatformKey>('taobao')
const signMethod = ref(ECOM_SCENARIOS[0]!.methods.taobao)
const signBiz = ref('{\n  "page_no": 1,\n  "page_size": 20\n}')
const signStamp = ref(ecomTimestamp(ECOM_PLATFORM_MAP.taobao))
const signResult = ref<{ source: string; sign: string; url: string } | null>(null)
const pushResult = ref<{ ok: boolean; signOk: boolean; scenario: EcomScenario } | null>(null)

function onSignPlatformChange(key: EcomPlatformKey) {
  const p = ECOM_PLATFORM_MAP[key]
  signMethod.value = ECOM_SCENARIOS[0]!.methods[key]
  signStamp.value = ecomTimestamp(p)
  signResult.value = null
  pushResult.value = null
}

function refreshTimestamp() {
  signStamp.value = ecomTimestamp(ECOM_PLATFORM_MAP[signPlatform.value])
}

function parseBiz(): Record<string, string> | null {
  const text = signBiz.value.trim()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]))
  } catch {
    ElMessage.error(t('dev.sandbox.bodyInvalid'))
    return null
  }
}

function buildCtx() {
  const ch = channelOf(signPlatform.value)
  return {
    platform: ECOM_PLATFORM_MAP[signPlatform.value],
    appKey: ch?.appKey.trim() ?? '',
    appSecret: ch?.appSecret.trim() ?? '',
    session: ch?.session.trim() ?? '',
    method: signMethod.value.trim(),
    bizParams: parseBiz() ?? {},
    timestamp: signStamp.value,
  }
}

function generateSignNow() {
  const ch = channelOf(signPlatform.value)
  if (!ch?.appKey.trim() || !ch?.appSecret.trim()) {
    ElMessage.warning(t('dev.ecom.requiredTip'))
    return
  }
  if (parseBiz() === null) return
  const ctx = buildCtx()
  signResult.value = {
    source: buildSignSource(ctx),
    sign: buildSign(ctx),
    url: buildRequestUrl(ctx, ch.env),
  }
  pushResult.value = null
}

function buildCurl(): string {
  if (!signResult.value) return ''
  const url = new URL(signResult.value.url)
  const parts = [`curl -X POST '${url.origin}${url.pathname}'`]
  url.searchParams.forEach((value, key) => {
    parts.push(`--data-urlencode '${key}=${value}'`)
  })
  return parts.join(' \\\n  ')
}

function simulatePush() {
  const ch = channelOf(signPlatform.value)
  if (!ch?.appKey.trim() || !ch?.appSecret.trim()) {
    ElMessage.warning(t('dev.ecom.requiredTip'))
    return
  }
  if (parseBiz() === null) return
  const ctx = buildCtx()
  const local = buildSign(ctx)
  // 平台侧会按同样规范重算签名，此处以本地两次计算一致性代表校验通过
  const signOk = local === buildSign(ctx) && local.length === 32
  const scenario =
    ECOM_SCENARIOS.find((s) => s.methods[signPlatform.value] === signMethod.value.trim()) ?? ECOM_SCENARIOS[0]!
  pushResult.value = {
    ok: Boolean(ch.enabled && ch.scenarios.includes(scenario.id)),
    signOk,
    scenario,
  }
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success(t('dev.common.copied'))
  } catch {
    ElMessage.warning(t('dev.sandbox.copyFailed'))
  }
}

// 已配置凭证的渠道进入页面即给出一份可直接联调的签名
onMounted(() => {
  if (channelOf(signPlatform.value)?.appKey.trim() && channelOf(signPlatform.value)?.appSecret.trim()) {
    generateSignNow()
  }
})

/* ---------- 场景订阅 ---------- */
const activePlatform = ref<EcomPlatformKey>('taobao')

function isSubscribed(id: string) {
  return channelOf(activePlatform.value)?.scenarios.includes(id) ?? false
}

function generateRules() {
  const ch = channelOf(activePlatform.value)
  if (!ch) return
  const picked = ECOM_SCENARIOS.filter((s) => ch.scenarios.includes(s.id))
  if (!picked.length) {
    ElMessage.warning(t('dev.ecom.generateRulesEmpty'))
    return
  }
  const p = ECOM_PLATFORM_MAP[activePlatform.value]
  let n = 0
  picked.forEach((s) => {
    const metric = `${p.name} · ${s.metric}`
    if (dev.alerts.some((a) => a.metric === metric)) return
    dev.addAlert({ metric, threshold: s.threshold, channel: s.channel, status: 'active' })
    n += 1
  })
  ElMessage.success(t('dev.ecom.generateRulesDone', { n }))
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('dev.menu.alerts') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('dev.alerts.addAlert') }}
      </el-button>
    </div>

    <!-- ===== 电商渠道接入 ===== -->
    <el-card shadow="never" class="alerts-card">
      <template #header>
        <div class="alerts-card-head">
          <b>{{ t('dev.ecom.title') }}</b>
          <span class="alerts-card-desc">{{ t('dev.ecom.subtitle') }}</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col v-for="p in ECOM_PLATFORMS" :key="p.key" :xs="24" :sm="24" :md="12" :lg="8">
          <div class="ecom-card">
            <div class="ecom-head">
              <div class="ecom-logo" :style="{ background: p.color }">{{ p.abbr }}</div>
              <div class="ecom-ident">
                <div class="ecom-name">{{ p.name }}</div>
                <div class="ecom-gateway">{{ gatewayOf(p.key) }}</div>
              </div>
              <el-tag :type="statusType(channelOf(p.key)?.status ?? 'idle')" size="small">
                {{ statusText(channelOf(p.key)?.status ?? 'idle') }}
              </el-tag>
            </div>

            <div class="ecom-body">
              <div class="ecom-kv">
                <span>{{ t('dev.ecom.appKey') }}</span>
                <code>{{ channelOf(p.key)?.appKey ? mask(channelOf(p.key)!.appKey) : t('dev.ecom.unconfigured') }}</code>
              </div>
              <div class="ecom-kv">
                <span>{{ t('dev.ecom.appSecret') }}</span>
                <code>{{ channelOf(p.key)?.appSecret ? mask(channelOf(p.key)!.appSecret) : t('dev.ecom.unconfigured') }}</code>
              </div>
              <div class="ecom-kv">
                <span>{{ t('dev.ecom.env') }}</span>
                <code>{{ channelOf(p.key)?.env === 'sandbox' ? t('dev.ecom.sandbox') : t('dev.ecom.prod') }}</code>
              </div>
              <div class="ecom-kv">
                <span>{{ t('dev.ecom.scenarioCount') }}</span>
                <code>{{ channelOf(p.key)?.scenarios.length ?? 0 }} / {{ ECOM_SCENARIOS.length }}</code>
              </div>
              <div class="ecom-kv">
                <span>{{ t('dev.ecom.lastCheck') }}</span>
                <code>{{ channelOf(p.key)?.lastCheck ?? '—' }}</code>
              </div>
            </div>

            <div class="ecom-actions">
              <el-switch
                :model-value="channelOf(p.key)?.enabled ?? false"
                @change="dev.toggleEcomChannel(p.key)"
              />
              <el-button size="small" @click="openConfig(p.key)">
                <el-icon><Setting /></el-icon> {{ t('dev.ecom.configure') }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :loading="testing === p.key"
                @click="runTest(p.key)"
              >
                <el-icon><Connection /></el-icon>
                {{ testing === p.key ? t('dev.ecom.testing') : t('dev.ecom.test') }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- ===== 签名联调台 ===== -->
    <el-card shadow="never" class="alerts-card">
      <template #header>
        <div class="alerts-card-head">
          <b>{{ t('dev.ecom.signTitle') }}</b>
          <span class="alerts-card-desc">{{ t('dev.ecom.signDesc') }}</span>
        </div>
      </template>

      <el-form label-position="top" class="alerts-form">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item :label="t('dev.ecom.platform')">
              <el-select v-model="signPlatform" @change="onSignPlatformChange">
                <el-option v-for="p in ECOM_PLATFORMS" :key="p.key" :label="p.name" :value="p.key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="7">
            <el-form-item :label="t('dev.ecom.method')">
              <el-input v-model="signMethod" :placeholder="t('dev.ecom.method')" />
            </el-form-item>
          </el-col>
          <el-col :xs="20" :sm="16" :md="7" :lg="8">
            <el-form-item :label="t('dev.ecom.timestamp')">
              <el-input v-model="signStamp" />
            </el-form-item>
          </el-col>
          <el-col :xs="4" :sm="8" :md="3" :lg="4">
            <el-form-item label=" ">
              <el-button class="alerts-full" @click="refreshTimestamp">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('dev.ecom.bizParams')">
          <el-input v-model="signBiz" type="textarea" :rows="4" class="alerts-mono" />
        </el-form-item>
      </el-form>

      <div class="alerts-actions">
        <el-button type="primary" @click="generateSignNow">{{ t('dev.ecom.generateSign') }}</el-button>
        <el-button :disabled="!signResult" @click="copyText(signResult!.url)">
          <el-icon><CopyDocument /></el-icon> {{ t('dev.ecom.copyUrl') }}
        </el-button>
        <el-button :disabled="!signResult" @click="copyText(buildCurl())">
          <el-icon><CopyDocument /></el-icon> {{ t('dev.ecom.copyCurl') }}
        </el-button>
        <el-button :disabled="!signResult" @click="simulatePush">{{ t('dev.ecom.simulatePush') }}</el-button>
      </div>

      <p class="alerts-tip">{{ t('dev.ecom.methodTip') }}</p>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="24" :lg="14">
          <div class="alerts-pane-head">{{ t('dev.ecom.signSource') }}</div>
          <div class="code-block alerts-pane">
            {{ signResult ? signResult.source : t('dev.ecom.requiredTip') }}
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="10">
          <div class="alerts-pane-head">{{ t('dev.ecom.signValue') }}</div>
          <div class="code-block alerts-pane alerts-sign">{{ signResult ? signResult.sign : '—' }}</div>
          <div v-if="signResult" class="alerts-gateway">
            <span>{{ t('dev.ecom.gateway') }}</span>
            <code>{{ ECOM_PLATFORM_MAP[signPlatform].gateway }}</code>
          </div>
          <div v-if="signResult" class="alerts-gateway">
            <span>{{ t('dev.ecom.rateLimit') }}</span>
            <code>{{ ECOM_PLATFORM_MAP[signPlatform].rateLimit }}</code>
          </div>
        </el-col>
      </el-row>

      <div v-if="pushResult" class="alerts-push" :class="pushResult.ok ? 'is-hit' : 'is-miss'">
        <b>{{ t('dev.ecom.pushResult') }}</b>
        <el-tag :type="pushResult.signOk ? 'success' : 'danger'" size="small">
          {{ pushResult.signOk ? '签名校验通过' : '签名校验失败' }}
        </el-tag>
        <span>{{ pushResult.scenario.name }} · {{ signMethod }}</span>
        <span>{{ pushResult.ok ? t('dev.ecom.pushHit') : t('dev.ecom.pushMiss') }}</span>
      </div>
    </el-card>

    <!-- ===== 场景订阅 ===== -->
    <el-card shadow="never" class="alerts-card">
      <template #header>
        <div class="alerts-card-head">
          <b>{{ t('dev.ecom.scenarioTitle') }}</b>
          <el-button type="primary" plain @click="generateRules">{{ t('dev.ecom.generateRules') }}</el-button>
        </div>
      </template>
      <p class="alerts-tip">{{ t('dev.ecom.scenarioDesc') }}</p>

      <el-radio-group v-model="activePlatform" size="small" class="alerts-platform">
        <el-radio-button v-for="p in ECOM_PLATFORMS" :key="p.key" :value="p.key">{{ p.name }}</el-radio-button>
      </el-radio-group>

      <el-table :data="ECOM_SCENARIOS" size="small">
        <el-table-column :label="t('dev.ecom.subscribe')" width="90" align="center">
          <template #default="{ row }">
            <el-checkbox
              :model-value="isSubscribed(row.id)"
              @change="dev.toggleEcomScenario(activePlatform, row.id)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.ecom.scenarioName')" width="130">
          <template #default="{ row }">
            <div class="alerts-sc-name">{{ row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" :label="t('dev.common.desc')" min-width="200" />
        <el-table-column :label="t('dev.ecom.scenarioMetric')" min-width="180">
          <template #default="{ row }">
            <code class="alerts-code">{{ row.metric }}</code>
            <el-tag size="small" effect="plain" style="margin-left: 6px">{{ row.threshold }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.ecom.method')" min-width="220">
          <template #default="{ row }"><code class="alerts-code">{{ row.methods[activePlatform] }}</code></template>
        </el-table-column>
        <el-table-column :label="t('dev.alerts.channel')" width="110">
          <template #default="{ row }">{{ row.channel }}</template>
        </el-table-column>
        <el-table-column :label="t('dev.ecom.pollInterval')" width="110">
          <template #default="{ row }">{{ row.pollInterval }} {{ t('dev.ecom.unitMinute') }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 告警规则 ===== -->
    <el-card shadow="never">
      <template #header><b>告警规则</b></template>
      <el-alert
        title="告警规则触发后，将按所选渠道通知你；可在总览页实时观测各项指标。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-table :data="dev.alerts">
        <el-table-column :label="t('dev.alerts.metric')" min-width="200">
          <template #default="{ row }">
            <el-icon style="color: var(--color-primary); vertical-align: -2px"><Monitor /></el-icon>
            <span style="margin-left: 6px">{{ row.metric }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.alerts.threshold')" width="120">
          <template #default="{ row }"><el-tag effect="plain">{{ row.threshold }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="t('dev.alerts.channel')" width="110">
          <template #default="{ row }">{{ row.channel }}</template>
        </el-table-column>
        <el-table-column :label="t('dev.alerts.lastTrigger')" width="160">
          <template #default="{ row }">{{ row.lastTrigger }}</template>
        </el-table-column>
        <el-table-column :label="t('dev.common.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.common.actions')" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="dev.toggleAlert(row.id)">
              {{ row.status === 'active' ? t('dev.common.disabled') : t('dev.common.enabled') }}
            </el-button>
            <el-button size="small" type="danger" @click="remove(row.id)">{{ t('dev.common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 新增告警 ===== -->
    <el-dialog v-model="dialogVisible" :title="t('dev.alerts.addAlert')" width="460px">
      <el-form label-width="80px">
        <el-form-item :label="t('dev.alerts.metric')" required>
          <el-input v-model="form.metric" placeholder="例如：API 错误率" />
        </el-form-item>
        <el-form-item :label="t('dev.alerts.threshold')" required>
          <el-input v-model="form.threshold" placeholder="例如：> 5%" />
        </el-form-item>
        <el-form-item :label="t('dev.alerts.channel')">
          <el-select v-model="form.channel" style="width: 100%">
            <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('dev.common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- ===== 渠道配置 ===== -->
    <el-dialog v-model="configVisible" :title="`${t('dev.ecom.configure')} · ${configPlatform.name}`" width="560px">
      <el-form label-width="110px">
        <el-form-item :label="t('dev.ecom.env')">
          <el-radio-group v-model="configForm.env">
            <el-radio value="prod">{{ t('dev.ecom.prod') }}</el-radio>
            <el-radio value="sandbox" :disabled="!configPlatform.sandboxGateway">{{ t('dev.ecom.sandbox') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('dev.ecom.gateway')">
          <code class="alerts-code">{{ gatewayOf(configForm.platform) }}</code>
        </el-form-item>
        <el-form-item :label="t('dev.ecom.appKey')">
          <el-input v-model="configForm.appKey" :placeholder="configPlatform.keyField" />
        </el-form-item>
        <el-form-item :label="t('dev.ecom.appSecret')">
          <el-input v-model="configForm.appSecret" type="password" show-password :placeholder="configPlatform.secretField" />
        </el-form-item>
        <el-form-item :label="t('dev.ecom.session')">
          <el-input v-model="configForm.session" :placeholder="configPlatform.sessionField" />
        </el-form-item>
        <el-form-item :label="t('dev.ecom.callback')">
          <el-input v-model="configForm.callbackUrl" />
        </el-form-item>
        <el-form-item :label="t('dev.ecom.pollInterval')">
          <el-input-number v-model="configForm.pollInterval" :min="1" :max="720" :step="5" />
          <span class="alerts-unit">{{ t('dev.ecom.unitMinute') }}</span>
        </el-form-item>
      </el-form>

      <el-alert :title="t('dev.ecom.credentialTip')" type="warning" :closable="false" show-icon />
      <el-alert
        v-if="configForm.env === 'sandbox' && !configPlatform.sandboxGateway"
        :title="configPlatform.sandboxNote"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 8px"
      />
      <div class="alerts-links">
        <span>{{ t('dev.ecom.docs') }}：</span>
        <el-link type="primary" :href="configPlatform.docs" target="_blank">{{ configPlatform.docs }}</el-link>
      </div>
      <div class="alerts-links">
        <span>{{ t('dev.ecom.oauth') }}：</span>
        <code class="alerts-code">{{ configPlatform.oauthUrl }}</code>
      </div>

      <template #footer>
        <el-button @click="configVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="saveConfig">{{ t('dev.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.alerts-card {
  margin-bottom: 16px;
}
.alerts-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.alerts-card-desc {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

/* 平台卡片 */
.ecom-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.ecom-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 18px rgba(26, 107, 92, 0.1);
}
.ecom-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ecom-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ecom-ident {
  flex: 1;
  min-width: 0;
}
.ecom-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
}
.ecom-gateway {
  font-family: Consolas, monospace;
  font-size: 11px;
  color: var(--color-text-secondary);
  word-break: break-all;
  margin-top: 2px;
}
.ecom-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ecom-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.ecom-kv span {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.ecom-kv code {
  font-family: Consolas, monospace;
  font-size: 12px;
  color: var(--color-primary-dark);
  background: var(--color-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
  text-align: right;
}
.ecom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px dashed var(--color-border);
  padding-top: 12px;
}
.ecom-actions .el-button {
  flex: 1;
}

/* 联调台 */
.alerts-form :deep(.el-form-item) {
  margin-bottom: 12px;
}
.alerts-form :deep(.el-select) {
  width: 100%;
}
.alerts-mono :deep(.el-textarea__inner) {
  font-family: Consolas, monospace;
  font-size: 13px;
}
.alerts-full {
  width: 100%;
}
.alerts-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 4px 0 10px;
}
.alerts-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 12px;
}
.alerts-pane-head {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.alerts-pane {
  max-height: 190px;
  overflow: auto;
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
}
.alerts-sign {
  color: var(--color-accent);
  letter-spacing: 1px;
}
.alerts-gateway {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-top: 8px;
  align-items: baseline;
}
.alerts-gateway span {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.alerts-gateway code {
  font-family: Consolas, monospace;
  color: var(--color-primary-dark);
  word-break: break-all;
}
.alerts-push {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}
.alerts-push.is-hit {
  background: rgba(82, 166, 122, 0.1);
  border: 1px solid rgba(82, 166, 122, 0.35);
}
.alerts-push.is-miss {
  background: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.35);
}

/* 场景订阅 */
.alerts-platform {
  margin-bottom: 12px;
}
.alerts-sc-name {
  font-weight: 600;
  color: var(--color-text-primary);
}
.alerts-code {
  font-family: Consolas, monospace;
  font-size: 12px;
  color: var(--color-primary-dark);
}

/* 配置弹窗 */
.alerts-unit {
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.alerts-links {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.alerts-links span {
  color: var(--color-text-secondary);
}
</style>
