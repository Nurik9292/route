<template>
  <div
      :class="[
      'route-item flex items-center h-20 px-0 cursor-pointer transition-colors duration-150',
      {
        'selected': selected,
        'inactive': !route.is_active
      }
    ]"
      @click="$emit('click', $event)"
  >
    <!-- Route Number -->
    <span class="track-number">
      <div class="order-circle">
        {{ route.route_number }}
      </div>
    </span>

    <!-- Route Name & Details -->
    <span class="title-route">
      <div class="route-info">
        <div class="route-name-row">
          <h3 class="route-name">{{ route.route_name }}</h3>
        </div>

        <div class="mobile-meta md:hidden">
          <span v-if="route.name_tm" class="tm-badge">{{ route.name_tm }}</span>
          <span v-if="route.name_en" class="en-badge">{{ route.name_en }}</span>
        </div>

        <div class="hidden md:block">
          <div class="flex items-center gap-2 mt-1">
            <div v-if="route.name_tm" class="text-sm text-orange-300 truncate font-medium">
              {{ route.name_tm }}
            </div>
            <div v-if="route.name_en" class="text-xs text-gray-400 truncate">
              {{ route.name_en }}
            </div>
          </div>
        </div>
      </div>
    </span>

    <!-- Color -->
    <span class="route-color">
      <div class="color-indicator">
        <div
            class="color-square"
            :style="{ backgroundColor: route.route_color || '#3B82F6' }"
            :title="`Цвет: ${route.route_color || '#3B82F6'}`"
        ></div>
        <div v-if="hasGeometry" class="geometry-dot" title="Геометрия настроена">
          <Icon :icon="['fas', 'map']" />
        </div>
      </div>
    </span>

    <!-- Status -->
    <span class="status">
      <StatusBadge :is-active="route.isActive" size="small" />
    </span>

    <!-- Actions -->
    <span class="action">
      <div class="actions-menu">
        <BtnComponent
            @click.stop="$emit('edit', route)"
            small
            class="action-button edit-button"
            title="Изменить"
        >
          <Icon :icon="['fas', 'edit']" />
        </BtnComponent>

        <BtnComponent
            @click.stop="$emit('toggle-geometry', route)"
            small
            class="action-button geometry-button"
            :title="hasGeometry ? 'Редактировать геометрию' : 'Добавить геометрию'"
        >
          <Icon :icon="hasGeometry ? ['fas', 'map'] : ['fas', 'plus']" />
        </BtnComponent>

        <BtnComponent
            @click.stop="$emit('view-stops', route)"
            small
            class="action-button stops-button"
            title="Остановки маршрута"
        >
          <Icon :icon="['fas', 'map-marker-alt']" />
        </BtnComponent>

        <BtnComponent
            @click.stop="$emit('delete', route)"
            small
            danger
            class="action-button delete-button"
            title="Удалить"
        >
          <Icon :icon="['fas', 'trash']" />
        </BtnComponent>
      </div>
    </span>

    <!-- Loading Overlay -->
    <div
        v-if="loading"
        class="absolute inset-0 bg-black/10 rounded-md flex items-center justify-center"
    >
      <Icon :icon="['fas', 'spinner']" class="animate-spin text-k-text-secondary text-xl" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useMessageToaster, useErrorHandler } from '@/composables';
import { mapActions } from 'vuex';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import StatusBadge from '../Ui/StatusBadge.vue';

export default {
  name: 'RouteListItem',

  components: {
    BtnComponent,
    StatusBadge
  },

  props: {
    selected: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: () => ({})
    }
  },

  emits: [
    'click',
    'edit',
    'delete',
    'toggle-geometry',
    'view-stops',
    'status-updated'
  ],

  setup() {
    const { toastSuccess, toastError } = useMessageToaster();
    const errorHandler = useErrorHandler('toast');
    const loading = ref(false);
    const statusLoading = ref(false);

    return {
      toastSuccess,
      toastError,
      errorHandler,
      loading,
      statusLoading
    };
  },

  computed: {

    route(){
      return this.item.route;
    },

    hasGeometry() {
      // return this.route.hasGeometry ||
      //     this.route.geometry ||
      //     (this.route.routePoints && this.route.routePoints.length > 0);

      return false;
    }
  },

  methods: {
    ...mapActions('routes', ['update']),

    formatTime(time) {
      if (!time) return '--:--';

      // Handle different time formats
      if (typeof time === 'string') {
        if (time.includes(':')) {
          return time.substring(0, 5); // HH:MM format
        }
        // Handle ISO time format
        if (time.includes('T')) {
          return new Date(time).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      return time;
    },

    formatPrice(price) {
      if (price === null || price === undefined || price === 0) {
        return 'Бесплатно';
      }

      if (typeof price === 'number') {
        return price.toFixed(1);
      }

      return price.toString();
    },

    async toggleStatus() {
      if (this.statusLoading) return;

      this.statusLoading = true;

      try {
        const newStatus = !this.route.isActive;

        const updatedRoute = await this.update({
          routeId: this.route.id,
          data: { is_active: newStatus }
        });

        this.toastSuccess(
            `Маршрут ${this.route.routeNumber} ${newStatus ? 'активирован' : 'деактивирован'}`
        );

        this.$emit('status-updated', updatedRoute);
      } catch (error) {
        this.errorHandler.handleHttpError(error);
        this.toastError('Ошибка изменения статуса маршрута');
      } finally {
        this.statusLoading = false;
      }
    },

    // Helper method to format route distance if available
    formatDistance(distance) {
      if (!distance) return '';

      if (distance < 1000) {
        return `${Math.round(distance)}м`;
      }

      return `${(distance / 1000).toFixed(1)}км`;
    },

    // Helper method to get route statistics
    getRouteStats() {
      const stats = [];

      if (this.route.totalStops) {
        stats.push(`${this.route.totalStops} остановок`);
      }

      if (this.route.routeDistance) {
        stats.push(this.formatDistance(this.route.routeDistance));
      }

      if (this.route.averageSpeed) {
        stats.push(`${this.route.averageSpeed} км/ч`);
      }

      return stats.join(' • ');
    }
  }
};
</script>

<style lang="postcss" scoped>
.route-item {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  min-height: 80px;
  position: relative;
}

.route-item:hover {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 90%, var(--color-accent) 10%);
}

.route-item.inactive {
  @apply opacity-60;
}

.route-item.selected {
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.route-item > span {
  @apply p-3 text-left align-middle overflow-hidden;

  &.track-number {
    min-width: 5rem;
    max-width: 5rem;
    @apply flex-shrink-0 justify-center;
  }

  &.title-route {
    flex: 1;
    min-width: 20rem;
    @apply min-w-0;
  }

  &.route-color {
    min-width: 4rem;
    max-width: 4rem;
    @apply flex-shrink-0 justify-center;
  }

  &.status {
    min-width: 6rem;
    max-width: 6rem;
    @apply flex-shrink-0 text-center;
  }

  &.action {
    min-width: 16rem;
    max-width: 18rem;
    @apply flex-shrink-0 text-center;
  }
}

.order-circle {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm;
  background-color: var(--color-accent);
}

.route-info {
  @apply w-full;
}

.route-name-row {
  @apply flex items-center gap-2;
}

.route-name {
  @apply text-base font-medium truncate;
  color: var(--color-text-primary);
}

.mobile-meta {
  @apply flex flex-wrap items-center gap-2 mt-1;
}

.tm-badge, .en-badge {
  @apply text-xs px-2 py-1 rounded-full font-medium;
  background-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  color: var(--color-accent);
}

.tm-badge {
  background-color: color-mix(in srgb, #f97316 20%, transparent);
  color: #f97316;
}

.en-badge {
  background-color: color-mix(in srgb, #6b7280 20%, transparent);
  color: #6b7280;
}

.color-indicator {
  @apply flex justify-center relative;
}

.color-square {
  @apply w-6 h-6 rounded border border-gray-300;
}

.geometry-dot {
  @apply absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs;
  font-size: 8px;
  animation: pulse 2s infinite;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.actions-menu {
  @apply flex items-center justify-center space-x-1;
}

.action-button {
  @apply transition-all duration-200;
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
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

.geometry-button {
  background-color: #3B82F6;
  border: 1px solid #3B82F6;
  color: white;
}

.geometry-button:hover {
  background-color: color-mix(in srgb, #3B82F6 90%, black 10%);
  border-color: color-mix(in srgb, #3B82F6 90%, black 10%);
}

.stops-button {
  background-color: #8B5CF6;
  border: 1px solid #8B5CF6;
  color: white;
}

.stops-button:hover {
  background-color: color-mix(in srgb, #8B5CF6 90%, black 10%);
  border-color: color-mix(in srgb, #8B5CF6 90%, black 10%);
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

/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive design */
@media (max-width: 768px) {
  .route-item {
    @apply p-4 h-auto;
    flex-direction: column;
    align-items: stretch;
    min-height: 100px;
  }

  .route-item > span {
    padding: 0;
    min-width: auto !important;
    max-width: none !important;

    &.track-number {
      @apply absolute top-2 right-2 basis-auto;
    }

    &.title-route {
      @apply mb-3 max-w-none;
      flex: none;
    }

    &.action {
      @apply basis-auto justify-start;
    }
  }

  .route-name {
    @apply text-sm;
  }

  .actions-menu {
    @apply justify-start space-x-2;
  }

  .edit-button,
  .geometry-button,
  .stops-button,
  .delete-button {
    @apply px-2 py-1 text-xs;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
  }
}
</style>