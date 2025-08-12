<template>
  <div class="image-input-container">
    <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
    />

    <!-- Image Preview Area -->
    <div class="image-preview-area">
      <!-- Has Image -->
      <div v-if="value && !uploading" class="image-preview-wrapper">
        <div class="image-preview" :style="{ backgroundImage: `url(${displayUrl})` }">
          <!-- Overlay with actions -->
          <div class="image-overlay">
            <div class="overlay-actions">
              <button
                  type="button"
                  class="action-btn change-btn"
                  @click="changeImage"
                  title="Изменить изображение"
              >
                <Icon :icon="['fas', 'camera']" />
                Изменить
              </button>
              <button
                  type="button"
                  class="action-btn remove-btn"
                  @click="removeImage"
                  title="Удалить изображение"
              >
                <Icon :icon="['fas', 'trash']" />
                Удалить
              </button>
            </div>
          </div>
        </div>

        <div class="image-info">
          <p class="image-name">{{ fileName || 'Изображение загружено' }}</p>
          <p v-if="fileSize" class="image-size">{{ formatFileSize(fileSize) }}</p>
        </div>
      </div>

      <div v-else-if="!value && !uploading" class="upload-area">
        <button type="button" class="upload-button" @click="selectImage">
          <div class="upload-content">
            <div class="upload-icon">
              <Icon :icon="['fas', 'cloud-upload-alt']" class="upload-icon-svg" />
            </div>
            <h3 class="upload-title">Загрузить изображение</h3>
            <p class="upload-description">
              Нажмите для выбора файла
            </p>
            <p class="upload-formats">
              Поддерживаемые форматы: JPG, PNG, GIF (макс. 10MB)
            </p>
          </div>
        </button>
      </div>

      <div v-else-if="uploading" class="upload-loading-area">
        <div class="upload-loading">
          <div class="loading-spinner">
            <Icon :icon="['fas', 'spinner']" class="animate-spin" />
          </div>
          <p class="loading-text">Загрузка изображения...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="upload-error">
      <Icon :icon="['fas', 'exclamation-triangle']" class="error-icon" />
      <p class="error-text">{{ error }}</p>
      <button type="button" class="retry-btn" @click="clearError">
        <Icon :icon="['fas', 'redo']" class="mr-1" />
        Попробовать снова
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageInput",

  props: {
    modelValue: {
      type: String,
      default: null
    },
    maxSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    }
  },

  emits: ["update:modelValue", "file-selected", "upload-complete", "upload-error"],

  data() {
    return {
      uploading: false,
      uploadProgress: 0,
      error: null,
      fileName: null,
      fileSize: null
    };
  },

  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        this.$emit("update:modelValue", newValue);
      }
    },

    displayUrl() {
      if (!this.value) return null;

      // If it's a data URL (base64), use as is
      if (this.value.startsWith('data:')) {
        return this.value;
      }

      // If it's already a full URL, use as is
      if (this.value.startsWith('http')) {
        return this.value;
      }

      // If it's a relative path, make it absolute
      if (this.value.startsWith('/')) {
        return `${window.location.origin}${this.value}`;
      }

      // If it starts with banners/, create the proper URL
      if (this.value.startsWith('banners/')) {
        return `http://localhost:8081/admin/banners/image/${this.value.replace('banners/', '')}`;
      }

      // Default case - assume it's a relative path to banner image
      return `http://localhost:8081/admin/banners/image/${this.value}`;
    }
  },

  methods: {
    selectImage() {
      if (this.uploading) return;
      this.$refs.fileInput.click();
    },

    changeImage() {
      if (this.uploading) return;
      this.$refs.fileInput.click();
    },

    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        // Сразу очищаем input чтобы избежать повторных событий
        this.$nextTick(() => {
          event.target.value = '';
        });
        this.handleFile(file);
      }
    },

    async handleFile(file) {
      // Предотвращаем повторную обработку того же файла
      if (this.uploading) {
        return;
      }

      this.clearError();

      // Validate file
      if (!this.validateFile(file)) {
        return;
      }

      this.fileName = file.name;
      this.fileSize = file.size;

      this.$emit('file-selected', file);

      try {
        this.uploading = true;
        this.uploadProgress = 0;

        // Read file as data URL for preview immediately
        const dataUrl = await this.readFileAsDataURL(file);
        this.value = dataUrl;

        // Simulate upload progress for visual feedback
        const progressInterval = setInterval(() => {
          if (this.uploadProgress < 95) {
            this.uploadProgress += Math.random() * 5;
          }
        }, 50);

        // Complete progress after a short delay
        setTimeout(() => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;

          setTimeout(() => {
            this.uploading = false;
            this.$emit('upload-complete', file);
          }, 200);
        }, 300);

      } catch (error) {
        this.uploading = false;
        this.setError('Ошибка при загрузке файла');
        this.$emit('upload-error', error);
      }
    },

    validateFile(file) {
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        this.setError('Неподдерживаемый формат файла');
        return false;
      }

      // Check file size
      if (file.size > this.maxSize) {
        this.setError(`Файл слишком большой. Максимальный размер: ${this.formatFileSize(this.maxSize)}`);
        return false;
      }

      return true;
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    removeImage() {
      this.value = null;
      this.fileName = null;
      this.fileSize = null;
      this.clearError();
      this.$refs.fileInput.value = '';
    },

    setError(message) {
      this.error = message;
    },

    clearError() {
      this.error = null;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
};
</script>

<style scoped>
.image-input-container {
  width: 100%;
}

.image-preview-area {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 16rem;
  background-size: cover;
  background-position: center;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-preview:hover {
  border-color: var(--color-accent);
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.change-btn {
  background-color: var(--color-accent);
  color: white;
}

.change-btn:hover {
  background-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
}

.remove-btn {
  background-color: var(--color-danger);
  color: white;
}

.remove-btn:hover {
  background-color: color-mix(in srgb, var(--color-danger) 90%, black 10%);
}

.image-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
}

.image-size {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.upload-area {
  width: 100%;
  height: 16rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.upload-button {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.upload-button:hover {
  background-color: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.upload-button:hover .upload-area {
  border-color: var(--color-accent);
}

.upload-loading-area {
  width: 100%;
  height: 16rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
}

.upload-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.upload-icon {
  margin-bottom: 16px;
}

.upload-icon-svg {
  font-size: 2.5rem;
  color: var(--color-text-secondary);
}

.upload-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.upload-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 4px 0;
}

.upload-formats {
  font-size: 12px;
  color: var(--color-text-secondary);
  opacity: 0.7;
  margin: 0;
}

.upload-loading {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
}

.loading-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 0.3s ease;
}

.upload-error {
  margin-top: 16px;
  padding: 16px;
  background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-icon {
  color: var(--color-danger);
  font-size: 20px;
}

.error-text {
  font-size: 14px;
  color: var(--color-danger);
  margin: 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-danger);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.hidden {
  display: none;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.mr-1 {
  margin-right: 0.25rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .image-preview,
  .upload-area {
    height: 12rem;
  }

  .overlay-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 14px;
  }

  .upload-title {
    font-size: 16px;
  }
}
</style>