<template>
  <img
      :alt="`Avatar of ${adminName}`"
      :src="avatarUrl"
      :title="adminName"
      @error="onError"
      class="object-cover rounded-full aspect-square bg-k-bg-primary"
      :width="width"
      :height="width"
  >
</template>

<script>
import { defaultAvatar } from '@/utils'

export default {
  name: 'AdminAvatar',

  props: {
    admin: {
      type: Object,
      required: true,
      validator: function(value) {
        return value && (value.name || value.username || value.fullName);
      }
    },

    width: {
      type: [String, Number],
      default: 40
    }
  },

  data() {
    return {
      imageError: false
    }
  },

  computed: {
    adminName() {
      return this.admin.fullName || this.admin.name || this.admin.username || 'Admin';
    },

    avatarUrl() {
      // Если произошла ошибка загрузки, показываем дефолтный аватар
      if (this.imageError) {
        return defaultAvatar;
      }

      // Если есть аватар в профиле
      if (this.admin.avatar) {
        // Проверяем, является ли это data URL (base64)
        if (this.admin.avatar.startsWith('data:image')) {
          return this.admin.avatar;
        }
        // Если это URL файла
        if (this.admin.avatar.startsWith('http')) {
          return this.admin.avatar;
        }
        // Если это относительный путь
        return `/avatars/${this.admin.avatar}`;
      }

      // Если аватара нет, показываем дефолтный
      return defaultAvatar;
    }
  },

  methods: {
    onError() {
      console.warn('Avatar loading error for admin:', this.adminName);
      this.imageError = true;
    }
  },

  watch: {
    // Сбрасываем ошибку при изменении аватара
    'admin.avatar': function() {
      this.imageError = false;
    }
  }
}
</script>

<style scoped>
/* Обеспечиваем правильное отображение */
img {
  min-width: var(--width, 40px);
  min-height: var(--width, 40px);
}
</style>