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
import {process} from "@juggle/resize-observer/lib/utils/process.js";

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
      imageSize: null
    }
  },

  computed: {
    adminName() {
      return this.admin.fullName || this.admin.name || this.admin.username || 'Admin';
    },

    avatarUrl() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (this.imageError) {
        return defaultAvatar;
      }

      if (this.admin.avatar) {
        if (this.admin.avatar.startsWith('data:image')) {
          return this.admin.avatar;
        }
        if (this.admin.avatar.startsWith('http')) {
          return this.admin.avatar;
        }

        return `${baseUrl}${this.admin.avatar}`;
      }

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
    'admin.avatar': function() {
      this.imageError = false;
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