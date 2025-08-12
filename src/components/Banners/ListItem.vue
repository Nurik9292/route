<template>
  <article
      class="banner-item flex items-center cursor-pointer transition-all duration-150 hover:bg-white/5"
      :class="{ 'selected': item.selected }"
  >
    <!-- Display Order -->
    <span class="track-number">
      <div class="order-badge flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium">
        {{ item.banner.display_order || 0 }}
      </div>
    </span>

    <!-- Banner Title -->
    <span class="title-banner">
      <div class="banner-title-content">
        <h3 class="banner-title font-medium text-base mb-1 leading-tight">
          {{ item.banner.title }}
        </h3>
        <p v-if="item.banner.target_url" class="banner-url text-xs opacity-60 truncate">
          🔗 {{ item.banner.target_url }}
        </p>
      </div>
    </span>

    <!-- Image Preview -->
    <span class="image-preview hidden md:flex">
      <div class="image-container">
        <img
            v-if="item.banner.image_url"
            :src="bannerImageUrl(item.banner.image_url)"
            :alt="item.banner.title"
            class="banner-thumbnail w-16 h-12 object-cover rounded border border-k-border"
            @error="onImageError"
        />
        <div v-else class="banner-placeholder w-16 h-12 rounded border border-k-border flex items-center justify-center">
          <Icon :icon="['fas', 'image']" class="text-k-text-secondary opacity-50" />
        </div>
      </div>
    </span>

    <span class="target-url hidden lg:block">
      <div v-if="item.banner.target_url" class="url-content">
        <p class="truncate text-sm font-mono">{{ item.banner.target_url }}</p>
        <button
            @click.stop="copyUrl(item.banner.target_url)"
            class="url-copy-button p-1 rounded transition-colors duration-150 mt-1"
            title="Копировать ссылку"
        >
          <Icon :icon="['fas', 'copy']" class="text-xs" />
        </button>
      </div>
      <span v-else class="text-k-text-secondary italic text-sm">Без ссылки</span>
    </span>

    <!-- Dates -->
    <span class="dates hidden lg:block">
      <div class="dates-content text-xs">
        <div v-if="item.banner.start_date" class="date-item mb-1">
          <span class="text-k-success">Начало:</span>
          {{ formatDate(item.banner.start_date) }}
        </div>
        <div v-if="item.banner.end_date" class="date-item">
          <span class="text-k-danger">Конец:</span>
          {{ formatDate(item.banner.end_date) }}
        </div>
        <div v-if="!item.banner.start_date && !item.banner.end_date" class="text-k-text-secondary italic">
          Без ограничений
        </div>
      </div>
    </span>

    <span class="status">
      <div class="status-indicator flex items-center justify-center">
        <StatusBadge :is-active="item.banner.is_active" size="small" />
      </div>
    </span>

    <span class="action">
      <div class="actions-menu">
        <BtnComponent
            @click.stop="$emit('edit', item.banner)"
            class="edit-button px-3 py-2 rounded text-xs font-medium transition-all duration-200"
            title="Редактировать баннер"
        >
          <Icon :icon="['fas', 'edit']" class="mr-1" />
          Изменить
        </BtnComponent>

        <BtnComponent
            @click.stop="$emit('toggle-status', item.banner)"
             class="toggle-button px-3 py-2 rounded text-xs font-medium transition-all duration-200"
            :title="item.banner.is_active ? 'Деактивировать' : 'Активировать'"
        >
          <Icon :icon="toggleIcon" class="mr-1" />
          {{ toggleText }}
        </BtnComponent>

        <BtnComponent
            @click.stop="confirmDelete"
            class="delete-button px-3 py-2 rounded text-xs font-medium transition-all duration-200"
            title="Удалить баннер"
        >
          <Icon :icon="['fas', 'trash']" class="mr-1" />
          Удалить
        </BtnComponent>
      </div>
    </span>
  </article>
</template>

<script>
import {formatDate, useDialogBox} from "@/composables/index.js";
import StatusBadge from '@/components/Ui/StatusBadge.vue';
import BtnComponent from "@/components/Ui/Form/BtnComponent.vue";

export default {
  name: 'BannerListItem',

  components: {
    StatusBadge,
    BtnComponent
  },

  props: {
    item: {
      type: Object,
      required: true
    }
  },

  setup() {
    const { showConfirmDialog } = useDialogBox();

    return {
      showConfirmDialog,
    }
  },

  emits: ['edit', 'delete', 'toggle-status'],

  computed: {

    toggleText() {
      return this.item.banner.is_active ? 'Выключить' : 'Включить';
    },

    toggleIcon() {
      return this.item.banner.is_active ? ['fas', 'eye-slash'] : ['fas', 'eye'];
    },

    toggleButtonClass() {
      return this.item.banner.is_active;
    }
  },

  methods: {
    bannerImageUrl(imageFileName) {
      return import.meta.env.VITE_API_BASE_URL +
          (imageFileName.includes('banners')
              ?  imageFileName
              : `/banners/${imageFileName}`);
    },

    formatDate(dateString) {
      if (!dateString) return '';
      try {
        return formatDate(dateString);
      } catch (error) {
        return dateString;
      }
    },

    onImageError(event) {
      event.target.style.display = 'none';
      event.target.nextElementSibling?.classList.remove('hidden');
    },

    async copyUrl(url) {
      try {
        await navigator.clipboard.writeText(url);
        this.$toast?.success('Ссылка скопирована');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    },

    async confirmDelete() {
        this.$emit('delete', this.item.banner);
    },


  }
};
</script>

<style lang="postcss" scoped>
.banner-item {
  @apply min-h-[80px] border-b border-k-border;
}

.banner-item:hover {
  background-color: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.order-badge {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.banner-title {
  color: var(--color-text-primary);
}

.banner-url {
  color: var(--color-text-secondary);
}

.banner-thumbnail {
  transition: transform 0.2s ease;
}

.banner-thumbnail:hover {
  transform: scale(1.05);
}

.banner-placeholder {
  background-color: var(--color-bg-secondary);
}

.url-copy-button {
  color: var(--color-text-secondary);
}

.url-copy-button:hover {
  color: var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.actions-menu {
  @apply flex items-center justify-center space-x-2;
}

.edit-button {
  background-color: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: white;
}

.edit-button:hover {
  background-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
  border-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
}

.delete-button {
  background-color: var(--color-danger);
  border: 1px solid var(--color-danger);
  color: white;
}

.delete-button:hover {
  background-color: color-mix(in srgb, var(--color-danger) 90%, black 10%);
  border-color: color-mix(in srgb, var(--color-danger) 90%, black 10%);
}

.status-badge {
  min-width: 80px;
  text-align: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .banner-item {
    @apply p-4 h-auto;
    flex-direction: column;
    align-items: stretch;
    min-height: 100px;
  }

  .banner-item > span {
    padding: 0;
    min-width: auto !important;
    max-width: none !important;

    &.track-number {
      @apply absolute top-2 right-2 basis-auto;
    }

    &.title-banner {
      @apply mb-3 max-w-none;
      flex: none;
    }

    &.action {
      @apply basis-auto justify-start;
    }
  }

  .banner-title {
    @apply text-sm;
  }

  .actions-menu {
    @apply justify-start space-x-2 flex-wrap;
  }

  .edit-button,
  .toggle-button,
  .delete-button {
    @apply px-2 py-1 text-xs;
    min-width: 70px;
  }
}

/* Animation for status changes */
.status-badge {
  transition: all 0.3s ease;
}

/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Selection state */
.banner-item.selected {
  background-color: color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-primary));
  border-color: var(--color-accent);
}

.banner-item.selected .banner-title,
.banner-item.selected .order-badge {
  color: var(--color-accent);
}
</style>