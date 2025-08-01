<template>
  <div class="welcome-card bg-gradient-to-r from-k-primary/10 to-k-primary/5 border border-k-border rounded-lg p-6">
    <div class="flex items-center gap-4">
      <AdminAvatar :admin="admin" :width="64" show-status show-super-badge />

      <div class="flex-1">
        <h2 class="text-xl font-semibold text-k-text-primary">
          Добро пожаловать, {{ adminName }}!
        </h2>
        <p class="text-k-text-secondary mt-1">
          {{ welcomeMessage }}
        </p>
        <div class="flex items-center gap-4 mt-2 text-sm text-k-text-secondary">
          <span>Последний вход: {{ lastLoginFormatted }}</span>
          <span v-if="admin?.isSuperAdmin" class="text-k-primary font-medium">
            Супер-администратор
          </span>
        </div>
      </div>

      <div class="text-right">
        <div class="text-2xl font-bold text-k-primary">
          {{ currentTime }}
        </div>
        <div class="text-sm text-k-text-secondary">
          {{ currentDate }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdminAvatar from '@/components/Admin/AdminAvatar.vue';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'WelcomeCard',

  components: {
    AdminAvatar
  },

  props: {
    admin: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      currentTime: '',
      currentDate: '',
      timeInterval: null
    };
  },

  computed: {
    adminName() {
      return this.admin?.fullName || this.admin?.name || this.admin?.username || 'Администратор';
    },

    welcomeMessage() {
      const hour = new Date().getHours();
      if (hour < 6) return 'Доброй ночи! Работаете поздно?';
      if (hour < 12) return 'Доброе утро! Хорошего рабочего дня!';
      if (hour < 18) return 'Добро пожаловать в панель управления';
      return 'Добрый вечер! Завершаете рабочий день?';
    },

    lastLoginFormatted() {
      const lastLogin = this.admin?.lastLoginAt || this.admin?.last_login_at;
      if (!lastLogin) return 'никогда';

      try {
        return format(new Date(lastLogin), 'dd.MM.yyyy HH:mm', { locale: ru });
      } catch {
        return 'неизвестно';
      }
    }
  },

  mounted() {
    this.updateTime();
    this.timeInterval = setInterval(this.updateTime, 1000);
  },

  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  methods: {
    updateTime() {
      const now = new Date();
      this.currentTime = format(now, 'HH:mm:ss');
      this.currentDate = format(now, 'dd MMMM yyyy', { locale: ru });
    }
  }
};
</script>