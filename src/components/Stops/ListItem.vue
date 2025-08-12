<template>
  <div
      class="stop-item flex items-center h-20 px-0 cursor-pointer transition-colors duration-150"
      :class="{
        'selected': item.selected,
        'inactive': !stop.is_active,
        'major-stop': stop.is_major_stop && stop.is_active
      }"
      @click="handleRowClick"
  >
    <span class="track-number">
      <div class="order-circle">
        {{ stop.displayOrder || '—' }}
      </div>
    </span>

    <span class="title-stop">
      <div class="stop-info">
        <div class="stop-name-row">
          <h3 class="stop-name">{{ stop.stop_name }}</h3>
          <div v-if="stop.is_major_stop" class="major-indicator" title="Главная остановка">
            <Icon :icon="['fas', 'star']" />
          </div>
        </div>

        <div class="mobile-meta md:hidden">
          <span class="city-badge" v-if="cityName">{{ cityName }}</span>
          <span class="coordinates-mobile">{{ formattedCoordinates }}</span>
          <span v-if="stop.is_major_stop" class="major-badge-mobile">Главная</span>
        </div>
      </div>
    </span>

    <span class="turkmen-name hidden md:flex">
      <span class="text-content">{{ stop.name_tm || '—' }}</span>
    </span>

    <span class="english-name hidden lg:flex">
      <span class="text-content">{{ stop.name_en || '—' }}</span>
    </span>

    <span class="city-name hidden lg:flex">
      <span class="text-content">{{ cityName || '—' }}</span>
    </span>

    <span class="coordinates hidden md:flex">
      <div class="coordinates-info">
        <span class="coordinates-desktop">{{ formattedCoordinates }}</span>
        <button
            v-if="stop.latitude && stop.longitude"
            @click.stop="showOnMap"
            class="map-button"
            title="Показать на карте"
        >
          <Icon :icon="['fas', 'map-marker-alt']" />
        </button>
      </div>
    </span>

    <span class="type hidden md:flex">
      <div class="type-indicator">
        <Icon
            :icon="stop.is_major_stop ? ['fas', 'star'] : ['far', 'star']"
            :class="['type-icon', { 'major': stop.is_major_stop }]"
            :title="stop.is_major_stop ? 'Главная остановка' : 'Обычная остановка'"
        />
      </div>
    </span>

    <span class="status">
      <StatusBadge :is-active="stop.is_active" size="small" />
    </span>

    <span class="action">
      <div class="actions-menu">
        <BtnComponent
            @click.stop="showFormEdit"
            small
            class="edit-button"
            title="Изменить"
        >
          <Icon :icon="['fas', 'edit']" />
          <span class="hidden sm:inline ml-2">Изменить</span>
        </BtnComponent>

        <BtnComponent
            @click.stop="confirmDelete"
            small
            danger
            class="delete-button"
            title="Удалить"
        >
          <Icon :icon="['fas', 'trash']" />
          <span class="hidden sm:inline ml-2">Удалить</span>
        </BtnComponent>
      </div>
    </span>
  </div>
</template>

<script>
import { useDialogBox, useMessageToaster } from '@/composables';
import { mapGetters } from 'vuex';

import StatusBadge from '../Ui/StatusBadge.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import {eventBus} from "@/utils/index.js";

export default {
  name: 'StopListItem',

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
    const { toastError } = useMessageToaster();

    return {
      showConfirmDialog,
      toastError
    };
  },

  computed: {
    ...mapGetters('cities', ['getCityById']),

    stop() {
      return this.item.stop;
    },

    cityName() {
      if (!this.stop.cityId && !this.stop.city_id) return null;
      const cityId = this.stop.cityId || this.stop.city_id;
      const city = this.getCityById(cityId);
      return city?.name || null;
    },

    formattedCoordinates() {
      if (!this.stop.latitude || !this.stop.longitude) {
        return '—';
      }

      const lat = parseFloat(this.stop.latitude).toFixed(4);
      const lng = parseFloat(this.stop.longitude).toFixed(4);
      return `${lat}, ${lng}`;
    }
  },

  methods: {
    handleRowClick() {
      this.$emit('edit', this.stop);
    },

    async confirmDelete() {
      const result = await this.showConfirmDialog(
          `Вы действительно хотите удалить остановку "${this.stop.stop_name}"?`,
      );

      if (result) {
        this.$emit('delete', this.stop);
      }
    },

    showFormEdit() {
      eventBus.emit('MODAL_SHOW_EDIT_STOP_FORM', this.item.stop);
    },

    showOnMap() {
      if (!this.stop.latitude || !this.stop.longitude) {
        this.toastError('Координаты остановки не указаны');
        return;
      }

      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.stop.latitude},${this.stop.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  }
};
</script>

<style lang="postcss" scoped>
.stop-item {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  min-height: 80px;
}

.stop-item:hover {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 90%, var(--color-accent) 10%);
}

.stop-item.inactive {
  @apply opacity-60;
}

.stop-item.major-stop {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 95%, #ffd700 5%);
  border-left: 3px solid #ffd700;
}

.stop-item.major-stop:hover {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 85%, #ffd700 15%);
}

.stop-item.selected {
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.stop-item > span {
  @apply p-3 text-left align-middle overflow-hidden;

  &.track-number {
    min-width: 5rem;
    max-width: 5rem;
    @apply flex-shrink-0 justify-center;
  }

  &.title-stop {
    flex: 1;
    min-width: 16rem;
    @apply min-w-0;
  }

  &.turkmen-name {
    min-width: 10rem;
    max-width: 12rem;
    @apply flex-shrink-0 items-center;
  }

  &.english-name {
    min-width: 10rem;
    max-width: 12rem;
    @apply flex-shrink-0 items-center;
  }

  &.city-name {
    min-width: 8rem;
    max-width: 10rem;
    @apply flex-shrink-0 items-center;
  }

  &.coordinates {
    min-width: 10rem;
    max-width: 12rem;
    @apply flex-shrink-0 items-center;
  }

  &.type {
    min-width: 5rem;
    max-width: 5rem;
    @apply flex-shrink-0 justify-center items-center;
  }

  &.status {
    min-width: 6rem;
    max-width: 6rem;
    @apply flex-shrink-0 justify-center items-center;
  }

  &.action {
    min-width: 14rem;
    max-width: 16rem;
    @apply flex-shrink-0 justify-center items-center;
  }
}

.text-content {
  @apply block;
  color: var(--color-text-secondary);
  word-wrap: break-word;
  line-height: 1.4;
}

.order-circle {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.stop-info {
  @apply min-w-0 w-full;
}

.stop-name-row {
  @apply flex items-center gap-2;
}

.stop-name {
  @apply font-medium text-base truncate;
  color: var(--color-accent);
}

.major-indicator {
  @apply flex-shrink-0;
  color: #ffd700;
  font-size: 14px;
}

.mobile-meta {
  @apply flex flex-wrap items-center gap-2 mt-1;
}

.city-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
  background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  color: var(--color-accent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.major-badge-mobile {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
  background-color: color-mix(in srgb, #ffd700 20%, transparent);
  color: #b8860b;
  border: 1px solid color-mix(in srgb, #ffd700 30%, transparent);
}

.coordinates-info {
  @apply flex items-center space-x-2 w-full;
}

.type-indicator {
  @apply flex justify-center;
}

.type-icon {
  @apply text-lg transition-colors duration-200;
  color: var(--color-text-secondary);
}

.type-icon.major {
  color: #ffd700;
}

.coordinates-desktop,
.coordinates-mobile {
  @apply font-mono text-xs truncate;
  color: var(--color-text-secondary);
}

.map-button {
  @apply p-1 rounded transition-colors duration-150 flex-shrink-0;
  color: var(--color-text-secondary);
}

.map-button:hover {
  color: var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.actions-menu {
  @apply flex items-center justify-center space-x-2;
}

.edit-button {
  @apply transition-all duration-200;
  background-color: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: white;
}

.edit-button:hover {
  background-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
  border-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
}

.delete-button {
  @apply transition-all duration-200;
  background-color: var(--color-danger);
  border: 1px solid var(--color-danger);
  color: white;
}

.delete-button:hover {
  background-color: color-mix(in srgb, var(--color-danger) 90%, black 10%);
  border-color: color-mix(in srgb, var(--color-danger) 90%, black 10%);
}

@media (max-width: 768px) {
  .stop-item {
    @apply p-4 h-auto;
    flex-direction: column;
    align-items: stretch;
    min-height: 100px;
  }

  .stop-item > span {
    padding: 0;
    min-width: auto !important;
    max-width: none !important;

    &.track-number {
      @apply absolute top-2 right-2 basis-auto;
    }

    &.title-stop {
      @apply mb-3 max-w-none;
      flex: none;
    }

    &.action {
      @apply basis-auto justify-start;
    }
  }

  .stop-name {
    @apply text-sm;
  }

  .actions-menu {
    @apply justify-start space-x-2;
  }

  .edit-button,
  .delete-button {
    @apply px-3 py-2 text-xs;
  }
}
</style>