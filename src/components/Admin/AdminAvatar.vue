<template>
  <img
      :alt="`Avatar of ${adminName}`"
      :src="avatarUrl"
      :title="adminName"
      @error="onError"
      class="object-cover rounded-full aspect-square bg-k-bg-primary"
      :width="width"
      :height="width"
      :key="avatarKey"
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
      isLoading: false,
      imageError: false,
      imageSize: null,
      forceReload: 0
    }
  },

  computed: {
    adminName() {
      return this.admin.fullName || this.admin.name || this.admin.username || 'Admin';
    },

    avatarKey() {
      return `${this.admin.id || 'no-id'}-${this.admin.avatar || 'no-avatar'}-${this.forceReload}`;
    },

    avatarUrl() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      console.log('🖼️ AdminAvatar computing URL:', {
        adminId: this.admin.id,
        avatar: this.admin.avatar,
        imageError: this.imageError,
        baseUrl
      });

      if (this.imageError) {
        console.log('🚫 Using default avatar due to image error');
        return defaultAvatar;
      }

      if (this.admin.avatar) {
        if (this.admin.avatar.startsWith('data:image')) {
          console.log('📄 Using base64 avatar');
          return this.admin.avatar;
        }
        if (this.admin.avatar.startsWith('http')) {
          console.log('🌐 Using HTTP avatar');
          return this.admin.avatar;
        }

        const fullUrl = `${baseUrl}${this.admin.avatar}`;
        console.log('🔗 Using relative avatar:', fullUrl);
        return fullUrl;
      }

      console.log('🎭 Using default avatar (no avatar set)');
      return defaultAvatar;
    }
  },

  methods: {
    onError() {
      console.warn('Avatar loading error for admin:', this.adminName);
      this.imageError = true;
      this.forceReload++;
    },

    onLoad() {
      console.log('✅ Avatar loaded successfully for admin:', this.adminName);
      this.imageError = false;
    }
  },

  watch: {
    'admin.avatar': {
      handler(newAvatar, oldAvatar) {
        console.log('🔄 AdminAvatar: avatar changed', {
          adminName: this.adminName,
          oldAvatar,
          newAvatar
        });

        this.imageError = false;
        this.forceReload++;
      },
      immediate: false
    },

    admin: {
      handler(newAdmin, oldAdmin) {
        if (newAdmin?.avatar !== oldAdmin?.avatar) {
          console.log('👤 AdminAvatar: admin object changed, avatar updated');
          this.imageError = false;
          this.forceReload++;
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
img {
  min-width: var(--width, 40px);
  min-height: var(--width, 40px);
}
</style>