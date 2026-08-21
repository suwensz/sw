<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDevStore } from '@/stores/dev'

const { t } = useI18n()
const dev = useDevStore()

const dialogVisible = ref(false)
const editing = ref<string | null>(null)
const form = ref({ endpoint: '', events: [] as string[] })

const EVENT_OPTIONS = ['order.created', 'order.paid', 'product.updated', 'health.alert', 'listing.failed']

function openCreate() {
  editing.value = null
  form.value = { endpoint: '', events: [] }
  dialogVisible.value = true
}

function openEdit(id: string) {
  const target = dev.webhooks.find((w) => w.id === id)
  if (!target) return
  editing.value = id
  form.value = { endpoint: target.endpoint, events: [...target.events] }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.endpoint.trim() || form.value.events.length === 0) {
    ElMessage.warning('请填写回调地址并至少选择一个事件')
    return
  }
  if (editing.value) {
    const target = dev.webhooks.find((w) => w.id === editing.value)
    if (target) {
      target.endpoint = form.value.endpoint
      target.events = [...form.value.events]
    }
    ElMessage.success(t('dev.common.save') + ' ✓')
  } else {
    dev.addWebhook({ endpoint: form.value.endpoint.trim(), events: [...form.value.events], status: 'active' })
    ElMessage.success(t('dev.common.add') + ' ✓')
  }
  dialogVisible.value = false
}

async function remove(id: string) {
  await ElMessageBox.confirm(t('dev.webhooks.deleteConfirm'), t('dev.common.confirm'), { type: 'warning' })
  dev.removeWebhook(id)
  ElMessage.success(t('dev.common.delete') + ' ✓')
}

function testHook(id: string) {
  const target = dev.webhooks.find((w) => w.id === id)
  if (target) target.lastDelivery = '投递中…'
  setTimeout(() => {
    if (target) {
      target.lastDelivery = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    ElMessage.success(t('dev.webhooks.test') + ' → 200 OK')
  }, 800)
}
</script>

<template>
  <div class="portal-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0">{{ t('dev.menu.webhooks') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('dev.webhooks.addWebhook') }}
      </el-button>
    </div>

    <el-table :data="dev.webhooks">
      <el-table-column :label="t('dev.webhooks.endpoint')" min-width="260">
        <template #default="{ row }">
          <code class="wh-endpoint">{{ row.endpoint }}</code>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.webhooks.events')" min-width="220">
        <template #default="{ row }">
          <el-tag v-for="e in row.events" :key="e" size="small" style="margin: 2px 4px 2px 0">{{ e }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.webhooks.lastDelivery')" width="150">
        <template #default="{ row }">{{ row.lastDelivery }}</template>
      </el-table-column>
      <el-table-column :label="t('dev.common.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.common.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.common.actions')" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="testHook(row.id)">{{ t('dev.webhooks.test') }}</el-button>
          <el-button size="small" @click="dev.toggleWebhook(row.id)">
            {{ row.status === 'active' ? t('dev.common.disabled') : t('dev.common.enabled') }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">{{ t('dev.common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? t('dev.common.edit') : t('dev.webhooks.addWebhook')" width="520px">
      <el-form label-width="90px">
        <el-form-item :label="t('dev.webhooks.endpoint')" required>
          <el-input v-model="form.endpoint" placeholder="https://example.com/webhook" />
        </el-form-item>
        <el-form-item :label="t('dev.webhooks.events')" required>
          <el-checkbox-group v-model="form.events">
            <el-checkbox v-for="e in EVENT_OPTIONS" :key="e" :label="e" :value="e">{{ e }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('dev.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.wh-endpoint {
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
}
</style>
