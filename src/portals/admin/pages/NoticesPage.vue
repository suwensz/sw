<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

const dialogVisible = ref(false)
const editing = ref<string | null>(null)
const form = ref({ title: '', content: '', status: 'draft' as 'published' | 'draft' })

function openCreate() {
  editing.value = null
  form.value = { title: '', content: '', status: 'draft' }
  dialogVisible.value = true
}

function openEdit(id: string) {
  const target = admin.notices.find((n) => n.id === id)
  if (!target) return
  editing.value = id
  form.value = { title: target.title, content: target.content, status: target.status }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    ElMessage.warning('请填写公告标题与内容')
    return
  }
  if (editing.value) {
    admin.updateNotice(editing.value, { ...form.value })
    ElMessage.success(t('admin.common.save') + ' ✓')
  } else {
    admin.addNotice({
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      status: form.value.status,
      publishedAt: form.value.status === 'published' ? new Date().toISOString().slice(0, 10) : '—',
    })
    ElMessage.success(t('admin.common.add') + ' ✓')
  }
  dialogVisible.value = false
}

function togglePublish(id: string) {
  const target = admin.notices.find((n) => n.id === id)
  if (!target) return
  const next = target.status === 'published' ? 'draft' : 'published'
  admin.updateNotice(id, {
    status: next,
    publishedAt: next === 'published' ? new Date().toISOString().slice(0, 10) : '—',
  })
  ElMessage.success(next === 'published' ? t('admin.notices.publish') + ' ✓' : t('admin.notices.draft'))
}

async function remove(id: string) {
  await ElMessageBox.confirm(t('admin.notices.deleteConfirm'), t('admin.common.confirm'), { type: 'warning' })
  admin.removeNotice(id)
  ElMessage.success(t('admin.common.delete') + ' ✓')
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('admin.menu.notices') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('admin.notices.addNotice') }}
      </el-button>
    </div>

    <el-table :data="admin.notices">
      <el-table-column :label="t('admin.notices.title')" min-width="200">
        <template #default="{ row }">
          <el-icon style="color: var(--color-primary); vertical-align: -2px"><Bell /></el-icon>
          <span style="margin-left: 6px; font-weight: 500">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.notices.content')" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">{{ row.content }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.common.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? t('admin.notices.published') : t('admin.notices.draft') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="publishedAt" :label="t('admin.common.time')" width="120" />
      <el-table-column :label="t('admin.common.actions')" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row.id)">
            {{ row.status === 'published' ? t('admin.common.edit') : t('admin.notices.publish') }}
          </el-button>
          <el-button size="small" @click="togglePublish(row.id)">
            {{ row.status === 'published' ? t('admin.notices.draft') : t('admin.notices.published') }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">{{ t('admin.common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? t('admin.common.edit') : t('admin.notices.addNotice')" width="520px">
      <el-form label-width="80px">
        <el-form-item :label="t('admin.notices.title')" required>
          <el-input v-model="form.title" placeholder="公告标题" />
        </el-form-item>
        <el-form-item :label="t('admin.notices.content')" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="公告内容" />
        </el-form-item>
        <el-form-item :label="t('admin.common.status')">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">{{ t('admin.notices.draft') }}</el-radio>
            <el-radio value="published">{{ t('admin.notices.published') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('admin.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
