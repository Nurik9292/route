<template>
  <div class="avatar-section">
    <div class="avatar-wrapper">
      <AdminAvatar
          :admin="avatarData"
          class="avatar-display"
          :width="105"
          :key="avatarKey"
      />

      <div class="avatar-overlay">
        <button
            class="control-btn upload"
            title="Загрузить новый аватар"
            type="button"
            @click.prevent="openFileDialog"
            :disabled="loading"
        >
          <Icon :icon="['fas', 'upload']" />
        </button>

        <button
            v-if="avatarChanged"
            class="control-btn reset"
            title="Вернуть исходный аватар"
            type="button"
            @click.prevent="resetAvatar"
            :disabled="loading"
        >
          <Icon :icon="['fa', 'rotate-left']" />
        </button>

        <button
            v-else
            class="control-btn remove"
            title="Удалить аватар"
            type="button"
            @click.prevent="removeAvatar"
            :disabled="loading"
        >
          <Icon :icon="['fas', 'trash']" />
        </button>
      </div>

      <div v-if="loading" class="loading-overlay">
        <Icon :icon="['fas', 'refresh']" class="animate-spin text-white" />
      </div>
    </div>

    <ImageCropper
        v-if="cropperSource"
        :source="cropperSource"
        @cancel="onCropCancel"
        @crop="onCropComplete"
    />

    <div class="avatar-info mt-2 text-center">
      <p class="text-sm text-k-text-secondary">
        Рекомендуемый размер: 200x200px
      </p>
      <p class="text-xs text-k-text-secondary mt-1">
        Поддерживаемые форматы: JPG, PNG, GIF (макс. 2MB)
      </p>
    </div>
  </div>
</template>

<script>
import { useFileDialog } from '@vueuse/core';
import { useAuthorization, useFileReader, useMessageToaster } from '@/composables';

import AdminAvatar from '@/components/Admin/AdminAvatar.vue';
import ImageCropper from '../Utils/ImageCropper.vue';
import {mapActions} from "vuex";

export default {
  name: 'EditableProfileAvatar',

  setup() {
    const { currentAdmin } = useAuthorization();
    const { toastError, toastSuccess } = useMessageToaster();

    return {
      currentAdmin,
      toastError,
      toastSuccess
    };
  },

  components: {
    AdminAvatar,
    ImageCropper,
  },

  props: {
    profile: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      cropperSource: null,
      loading: false,
      fileDialog: null,
      avatarUpdateKey: 0
    }
  },

  computed: {
    avatarChanged() {
      return this.profile.avatar !== this.currentAdmin?.avatar;
    },

    avatarKey() {
      return `${this.profile.id}-${this.avatarUpdateKey}-${this.profile.avatar ? 'has' : 'no'}-avatar`;
    },

    avatarData() {
      return {
        id: this.profile.id,
        username: this.profile.username || '',
        avatar: this.profile.avatar,
        fullName: this.profile.name || this.currentAdmin?.fullName
      };
    }
  },

  methods: {

    ...mapActions('admin', ['removeCurrentAdminAvatar']),

    openFileDialog() {
      if (this.loading) return;
      this.fileDialog?.open();
    },

    removeAvatar() {
      if (this.loading) return;
      this.profile.avatar = null;


      this.$forceUpdate();


      this.$emit('avatar-changed', null);

      this.toastSuccess('Аватар удален');
    },

    resetAvatar() {
      if (this.loading) return;
      this.profile.avatar = this.currentAdmin?.avatar || null;
      this.cropperSource = null;


      this.$forceUpdate();


      this.$emit('avatar-changed', this.profile.avatar);

      this.toastSuccess('Аватар восстановлен');
    },

    onCropComplete(croppedImageData) {

      const sizeKB = Math.round(croppedImageData.length / 1024);
      const sizeMB = (croppedImageData.length / 1024 / 1024).toFixed(2);

      console.log('✂️ After optimized cropping:', {
        format: croppedImageData.includes('jpeg') ? 'JPEG' : 'PNG',
        sizeKB: sizeKB + ' KB',
        sizeMB: sizeMB + ' MB',
        reductionFromOriginal: ((180904 / croppedImageData.length) * 100).toFixed(1) + 'x smaller',
        acceptable: sizeKB < 500 ? '✅ Отличный размер!' :
            sizeKB < 1000 ? '⚠️ Приемлемый размер' :
                '❌ Все еще большой'
      });

      if (croppedImageData.length > 2_000_000) {
        this.toastError(`Изображение все еще слишком большое: ${sizeKB} KB. Попробуйте уменьшить качество в кропере.`);
        return;
      }

      this.profile.avatar = croppedImageData;
      this.cropperSource = null;

      this.avatarUpdateKey++;
      this.$nextTick(() => {
        this.$forceUpdate();
      });

      this.$emit('avatar-changed', croppedImageData);

      this.toastSuccess(`Аватар обновлен: ${sizeKB} KB`);
    },

    onCropCancel() {
      this.cropperSource = null;
    },

    validateFile(file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.toastError('Поддерживаются только файлы JPG, PNG и GIF');
        return false;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toastError('Размер файла не должен превышать 10MB');
        return false;
      }

      return true;
    },

    processSelectedFile(files) {
      if (!files?.length) return;

      const file = files[0];


      console.log('📁 Original file:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        sizeKB: Math.round(file.size / 1024) + ' KB',
        type: file.type
      });

      if (!this.validateFile(file)) return;

      this.loading = true;

      const fileReader = useFileReader();

      fileReader.readAsDataUrl(file, (dataUrl) => {
        this.loading = false;

        if (dataUrl) {
          const sizeKB = Math.round(dataUrl.length / 1024);
          console.log('📊 Base64 encoded (FileReader):', {
            length: dataUrl.length,
            sizeKB: sizeKB + ' KB',
            expectedSize: Math.round(file.size * 1.33 / 1024) + ' KB',
            increasePercent: ((dataUrl.length / file.size - 1) * 100).toFixed(1) + '%'
          });

          this.cropperSource = dataUrl;
        } else {
          this.toastError('Ошибка при чтении файла');
        }
      }, (error) => {
        this.loading = false;
        console.error('FileReader error:', error);
        this.toastError('Ошибка при загрузке файла');
      });
    },

    async preOptimizeImage(file) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const maxDimension = 1200;
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          console.log('🔧 Pre-optimization:', {
            originalSize: file.size,
            newSize: optimizedDataUrl.length,
            reduction: ((file.size / optimizedDataUrl.length) * 100).toFixed(1) + '%'
          });

          resolve(optimizedDataUrl);
        };

        img.src = URL.createObjectURL(file);
      });
    }
  },

  watch: {
    'profile.avatar': {
      handler(newAvatar, oldAvatar) {
        if (newAvatar !== oldAvatar) {
          console.log('Avatar changed from', oldAvatar?.substring(0, 20), 'to', newAvatar?.substring(0, 20));
          this.avatarUpdateKey++;
        }
      },
      immediate: false
    }
  },

  created() {
    const { open, onChange } = useFileDialog({
      accept: 'image/*',
      multiple: false,
      reset: true
    });

    this.fileDialog = { open };

    onChange(this.processSelectedFile);
  },
}
</script>

<style lang="postcss" scoped>
.avatar-section {
  @apply flex flex-col items-center;
}

.avatar-wrapper {
  @apply relative w-[105px] h-[105px] rounded-full overflow-hidden ring-4 ring-white shadow-lg;
}

.avatar-display {
  @apply w-full h-full object-cover;
}

.avatar-overlay {
  @apply absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300;
  @apply flex items-center justify-center gap-2;
}

.control-btn {
  @apply w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full;
  @apply flex items-center justify-center text-white transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn:hover:not(:disabled) {
  @apply bg-white/40;
}

.control-btn.upload {
  @apply hover:bg-blue-500/70;
}

.control-btn.reset {
  @apply hover:bg-yellow-500/70;
}

.control-btn.remove {
  @apply hover:bg-red-500/70;
}

.loading-overlay {
  @apply absolute inset-0 bg-black/30 flex items-center justify-center;
}

.avatar-info {
  @apply max-w-xs;
}

@media (prefers-color-scheme: dark) {
  .avatar-wrapper {
    @apply ring-gray-700;
  }

  .control-btn {
    @apply bg-gray-800/60 hover:bg-gray-700/80;
  }
}

@media (max-width: 640px) {
  .avatar-wrapper {
    @apply w-20 h-20;
  }

  .control-btn {
    @apply w-6 h-6 text-sm;
  }

  .avatar-info p {
    @apply text-xs;
  }
}
</style>