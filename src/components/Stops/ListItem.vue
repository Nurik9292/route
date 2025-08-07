<template>
  <div
      class="stop-item flex items-center h-24 px-0 cursor-pointer transition-colors duration-150"
      :class="{ 'selected': item.selected, 'inactive': !stop.is_active }"
      @click="handleRowClick"
  >
    <!-- Порядковый номер -->
    <span class="track-number" style="min-width: 7rem; max-width: 7rem; display: flex; justify-content: center;">
      <div class="order-circle">
        {{ stop.displayOrder || '—' }}
      </div>
    </span>

    <!-- Название остановки -->
    <span class="title-stop" style="flex: 1; max-width: 30%;">
      <div class="stop-info">
        <h3 class="stop-name">{{ stop.stop_name }}</h3>
        <p class="stop-name-tm" v-if="stop.name_tm">{{ stop.name_tm }}</p>
        <p class="stop-name-en" v-if="stop.name_en">{{ stop.name_en }}</p>

        <!-- Мобильная мета-информация -->
        <div class="mobile-meta md:hidden">
          <span class="city-badge" v-if="cityName">{{ cityName }}</span>
          <span class="coordinates-mobile">{{ formattedCoordinates }}</span>
        </div>
      </div>
    </span>

    <!-- Туркменское название (скрыто на мобильных) -->
    <span class="turkmen-name hidden md:block" style="min-width: 9rem; max-width: 9rem;">
      <span class="secondary-text">{{ stop.name_tm || '—' }}</span>
    </span>

    <!-- Английское название (скрыто на планшетах) -->
    <span class="english-name hidden lg:block" style="min-width: 9rem; max-width: 9rem;">
      <span class="secondary-text">{{ stop.name_en || '—' }}</span>
    </span>

    <!-- Город (скрыто на планшетах) -->
    <span class="city-name hidden lg:block" style="min-width: 7rem; max-width: 7rem;">
      <span class="secondary-text">{{ cityName || '—' }}</span>
    </span>

    <!-- Координаты (скрыто на мобильных) -->
    <span class="coordinates hidden md:block" style="min-width: 9rem; max-width: 9rem;">
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

    <!-- Статус -->
    <span class="status" style="min-width: 5rem; max-width: 5rem; display: flex; justify-content: center;">
      <StatusBadge :is-active="stop.isActive" size="small" />
    </span>

    <!-- Действия -->
    <span class="action" style="min-width: 13rem; display: flex; justify-content: center;">
      <div class="actions-menu">
        <BtnComponent
            @click.stop="edit()"
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
      if (!this.stop.cityId) return null;
      const city = this.getCityById(this.stop.cityId);
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
          {
            title: 'Подтверждение удаления',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            type: 'danger'
          }
      );

      if (result) {
        this.$emit('delete', this.stop);
      }
    },

    showOnMap() {
      if (!this.stop.latitude || !this.stop.longitude) {
        this.toastError('Координаты остановки не указаны');
        return;
      }

      // Открыть координаты в Google Maps
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
}

.stop-item:hover {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 90%, var(--color-accent) 10%);
}

.stop-item.inactive {
  @apply opacity-60;
}

.stop-item.selected {
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

/* Порядковый номер (как в Cities) */
.order-circle {
  @apply w-10 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  min-width: 2.5rem; /* Минимальная ширина для текста "ПОРЯДОК" */
}

.stop-info {
  @apply min-w-0;
}

.stop-name {
  @apply font-medium truncate text-base;
  color: var(--color-accent); /* Оранжевый как в Cities */
}

.stop-name-tm,
.stop-name-en {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
}

.secondary-text {
  color: var(--color-text-secondary);
}

.mobile-meta {
  @apply flex flex-wrap items-center gap-2 mt-2;
}

.city-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
  background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  color: var(--color-accent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.coordinates-info {
  @apply flex items-center space-x-2;
}

.coordinates-desktop,
.coordinates-mobile {
  @apply font-mono text-xs;
  color: var(--color-text-secondary);
}

.map-button {
  @apply p-1 rounded transition-colors duration-150;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .stop-name {
    @apply text-sm;
  }

  .actions-menu {
    @apply flex-col space-x-0 space-y-1;
  }

  .edit-button,
  .delete-button {
    @apply px-2 py-1 text-xs;
  }
}
</style>