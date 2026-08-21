<template>
  <div class="main-layout">
    <AppNavbar />
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <AppFooter />
    <InquiryAssistant />
    <SocialChatDialog />
    <AgentWakeOverlay />
    <VoiceAssistant />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import InquiryAssistant from '@/components/InquiryAssistant.vue'
import SocialChatDialog from '@/components/SocialChatDialog.vue'
import AgentWakeOverlay from '@/components/AgentWakeOverlay.vue'
import VoiceAssistant from '@/components/VoiceAssistant.vue'
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content {
  flex: 1;
}
</style>
