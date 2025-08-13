<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Маршруты

        <template #meta>
          <span v-if="routes.length > 0">{{ pluralizeRoutes() }}</span>
        </template>

        <template #controls>
          <div class="controls min-h-[32px] flex justify-between items-center gap-4">
            <ListFilter
                v-if="routes.length > 0 && !isPhone"
                placeholder="Поиск маршрутов..."
                @change="onFilterChanged"
            />


            <SelectBox
                v-if="routes.length > 0"
                v-model="statusFilter"
                :options="statusFilterOptions"
                placeholder="Все статусы"
                value-key="value"
                label-key="label"
                @change="onStatusFilterChanged"
                class="min-w-[120px]"
            />
          </div>

          <BtnGroup uppercase>
            <BtnComponent
                v-if="routes.length > 0"
                @click="exportRoutes"
                white
                :loading="exporting"
            >
              <Icon :icon="['fas', 'download']" class="mr-2" />
              Экспорт
            </BtnComponent>

            <BtnComponent
                @click="showImportModal"
                blue
            >
              <Icon :icon="['fas', 'upload']" class="mr-2" />
              Импорт
            </BtnComponent>

            <BtnComponent
                success
                @click="showAddRouteForm"
            >
              <Icon :icon="['fas', 'plus']" class="mr-2" />
              Добавить маршрут
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <!-- Loading Skeleton -->
    <ListSkeleton v-if="isLoading && routes.length === 0" class="-m-6" />

    <template v-else>
      <!-- Statistics Cards -->
      <div v-if="routes.length > 0" class="stats-grid grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card bg-k-bg-secondary p-4 rounded-lg border border-k-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-k-text-secondary">Всего маршрутов</p>
              <p class="text-2xl font-bold text-k-text-primary">{{ totalCount }}</p>
            </div>
            <Icon :icon="['fas', 'route']" class="text-3xl text-blue-500" />
          </div>
        </div>

        <div class="stat-card bg-k-bg-secondary p-4 rounded-lg border border-k-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-k-text-secondary">Активных</p>
              <p class="text-2xl font-bold text-green-600">{{ activeRoutesCount }}</p>
            </div>
            <Icon :icon="['fas', 'check-circle']" class="text-3xl text-green-500" />
          </div>
        </div>

        <div class="stat-card bg-k-bg-secondary p-4 rounded-lg border border-k-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-k-text-secondary">Средний интервал</p>
              <p class="text-2xl font-bold text-k-text-primary">{{ averageFrequency }} мин</p>
            </div>
            <Icon :icon="['fas', 'clock']" class="text-3xl text-orange-500" />
          </div>
        </div>

        <div class="stat-card bg-k-bg-secondary p-4 rounded-lg border border-k-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-k-text-secondary">С геометрией</p>
              <p class="text-2xl font-bold text-purple-600">{{ routesWithGeometry }}</p>
            </div>
            <Icon :icon="['fas', 'map']" class="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      <TableList
          v-if="filteredRoutes.length > 0"
          :routes="filteredRoutes"
          :config="{ sortable: true }"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :is-loading="isLoading"
          :has-more-data="hasMorePages"
          :total-count="totalCount"
          @sort="sort"
          @edit="showEditRouteForm"
          @delete="handleDeleteRoute"
          @load-more="loadMoreRoutes"
          @geometry-updated="refreshRoutes"
          @status-updated="onRouteStatusUpdated"
      />

      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'route']" />
        </template>

        <template #title>
          Список маршрутов пуст
        </template>

        {{ emptyStateMessage }}

        <template #action>
          <BtnComponent
              v-if="hasAppliedFilters"
              @click="clearAllFilters"
              white
          >
            Очистить фильтры
          </BtnComponent>

          <BtnComponent
              v-else
              @click="showAddRouteForm"
              success
          >
            {{ emptyStateActionText }}
          </BtnComponent>
        </template>
      </EmptyState>
    </template>

    <Transition name="toast">
      <div v-if="showSuccessMessage" class="success-toast">
        <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-2" />
        {{ successMessage }}
      </div>
    </Transition>

    <div v-if="showImportDialog" class="import-modal-overlay">
      <div class="import-modal">
        <h3>Импорт маршрутов</h3>
        <input type="file" @change="handleFileImport" accept=".csv,.json" />
        <div class="modal-buttons">
          <button @click="showImportDialog = false">Отмена</button>
          <button @click="processImport" :disabled="!importFile">Импорт</button>
        </div>
      </div>
    </div>
  </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import SelectBox from '@/components/Ui/Form/SelectBox.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/Routes/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useDialogBox, useMessageToaster } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import routeAPI from '@/api/routeAPI';

export default {
  name: 'RoutesView',

  components: {
    BaseView,
    ScreenHeader,
    ListFilter,
    BtnGroup,
    BtnComponent,
    SelectBox,
    ListSkeleton,
    TableList,
    EmptyState
  },

  setup() {
    const errorHandler = useErrorHandler('page');
    const { showConfirmDialog } = useDialogBox();
    const { toastSuccess, toastError } = useMessageToaster();

    return {
      errorHandler,
      showConfirmDialog,
      toastSuccess,
      toastError
    };
  },

  data() {
    return {
      isPhone: isMobile.any,
      searchQuery: '',
      statusFilter: '',
      sortField: 'routeNumber',
      sortOrder: 'asc',
      showSuccessMessage: false,
      successMessage: '',
      exporting: false,
      showImportDialog: false,
      importFile: null,


      statusFilterOptions: [
        { value: '', label: 'Все статусы' },
        { value: 'active', label: 'Активные' },
        { value: 'inactive', label: 'Неактивные' }
      ]
    };
  },

  computed: {
    ...mapGetters('routes', [
      'getRoutes',
      'isLoading',
      'totalCount',
      'hasMorePages',
      'activeRoutes',
      'averageFrequency'
    ]),

    routes() {
      return this.getRoutes || [];
    },

    filteredRoutes() {
      let filtered = [...this.routes];

      if (this.statusFilter === 'active') {
        filtered = filtered.filter(route => route.is_active);
      } else if (this.statusFilter === 'inactive') {
        filtered = filtered.filter(route => !route.is_active);
      }

      return filtered;
    },

    hasAppliedFilters() {
    },

    emptyStateMessage() {
      if (this.hasAppliedFilters) {
        return 'Маршруты по заданным критериям не найдены';
      }
      return 'Список маршрутов пуст';
    },

    emptyStateActionText() {
      return 'Добавить первый маршрут';
    },

    activeRoutesCount() {
      return this.activeRoutes?.length || 0;
    },

    routesWithGeometry() {
      return this.routes.filter(route => route.forward_geometry || route.backword_geometry).length;
    }
  },

  async mounted() {
    try {
      await this.loadRoutes();
    } catch (error) {
      this.errorHandler.handleHttpError(error);
    }

    eventBus.on('route:created', this.handleRouteCreated);
    eventBus.on('route:updated', this.handleRouteUpdated);
  },

  beforeUnmount() {
    eventBus.off('route:created', this.handleRouteCreated);
  },


  watch: {
    routes: {
      immediate: true,
      handler(newRoutes) {
        console.log('🔄 Store routes changed:', {
          newCount: newRoutes?.length || 0
        });
        if (newRoutes && newRoutes.length > 0) {
          this.$nextTick(() => {
            this.initializeFuzzySearch(newRoutes);
          });
        }
      }
    },

    hasError: {
      immediate: true,
      handler(hasError) {
        if (hasError) {
          this.errorHandler.handleError(this.getError);
        }
      }
    },
  },

  methods: {
    ...mapActions('routes', [
      'fetchAll',
      'paginate',
      'destroy'
    ]),

    initializeFuzzySearch(routes) {
      if (!routes || routes.length === 0) return;

      this.fuzzySearch = {
        search: (query) => {
          if (!query || !routes) return [];

          const searchQuery = query.toLowerCase();
          return routes
              .map(route => ({ item: route }))
              .filter(({ item }) => {
                const routeNumber = (item.route_number || item.routeNumber || '').toLowerCase();
                const routeName = (item.route_name || item.routeName || '').toLowerCase();
                const nameTm = (item.name_tm || item.nameTm || '').toLowerCase();
                const nameEn = (item.name_en || item.nameEn || '').toLowerCase();

                return routeNumber.includes(searchQuery) ||
                    routeName.includes(searchQuery) ||
                    nameTm.includes(searchQuery) ||
                    nameEn.includes(searchQuery);
              });
        }
      };
    },


    pluralizeRoutes() {
      return pluralize(this.totalCount, 'маршрут', 'маршрута', 'маршрутов');
    },

    async loadRoutes() {
      return this.fetchAll({ page: 1 });
    },

    async loadMoreRoutes() {
      if (this.isLoading || !this.hasMorePages) return;

      this.isLoading = true;
      try {
        return this.paginate({
          page: Math.floor(this.routes.length / 25) + 1,
          size: 25,
          active: true
        });

      } catch (error) {
        await this.errorHandler.handleError(error);
      } finally {
        this.isLoading = false;
      }
    },

    async refreshRoutes() {
      try {
        await this.loadRoutes();
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      }
    },

    onFilterChanged(query) {
      this.searchQuery = query;
    },

    onStatusFilterChanged() {

    },

    clearAllFilters() {
      this.searchQuery = '';
      this.statusFilter = '';
    },

    sort(field, order) {
      this.sortField = field;
      this.sortOrder = order;
    },

    showAddRouteForm() {
      eventBus.emit('MODAL_SHOW_ADD_ROUTE_FORM');
    },

    showEditRouteForm(route) {
      eventBus.emit('MODAL_SHOW_EDIT_ROUTE_FORM',  route);
    },

    async handleRouteCreated(createdRoute) {
      this.showSuccessToast(`Маршрут №${createdRoute.route_number} успешно создан`);

      await this.refreshRoutes();
    },

    async handleRouteUpdated(createdRoute) {
      await this.refreshRoutes();
    },

    async handleDeleteRoute(route) {
      const confirmed = await this.showConfirmDialog(
          `Удалить маршрут "${route.routeNumber} - ${route.routeName}"?`,
          'Это действие нельзя отменить. Все связанные данные (геометрия, остановки) будут удалены.'
      );

      if (!confirmed) return;

      try {
        await this.destroy(route.id);
        this.showSuccessToast(`Маршрут "${route.routeNumber}" удален`);
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      }
    },

    onRouteStatusUpdated(updatedRoute) {
      this.showSuccessToast(
          `Статус маршрута ${updatedRoute.routeNumber} изменен`
      );
    },

    showSuccessToast(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },

    async exportRoutes() {
      if (this.exporting) return;

      this.exporting = true;
      try {
        const blob = await routeAPI.exportRoutes({
          format: 'csv',
          includeGeometry: true,
          includeStops: true,
          activeOnly: false
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `routes_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toastSuccess('Маршруты экспортированы успешно');
      } catch (error) {
        this.errorHandler.handleHttpError(error);
        this.toastError('Ошибка экспорта маршрутов');
      } finally {
        this.exporting = false;
      }
    },

    showImportModal() {
      this.showImportDialog = true;
    },

    handleFileImport(event) {
      const file = event.target.files[0];
      if (file) {
        this.importFile = file;
      }
    },

    async processImport() {
      if (!this.importFile) return;

      try {
        const result = await routeAPI.importRoutes(this.importFile, {
          updateExisting: true,
          validateGeometry: true
        });

        this.showImportDialog = false;
        this.importFile = null;

        await this.refreshRoutes();

        this.toastSuccess(
            `Импорт завершен. Добавлено: ${result.created}, обновлено: ${result.updated}`
        );
      } catch (error) {
        this.errorHandler.handleHttpError(error);
        this.toastError('Ошибка импорта маршрутов');
      }
    }
  }
};
</script>

<style scoped>
.success-toast {
  @apply fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Statistics grid styling */
.stats-grid {
  margin-bottom: 1.5rem;
}

.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Import modal styling */
.import-modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.import-modal {
  @apply bg-k-bg-primary p-6 rounded-lg shadow-xl max-w-md w-full mx-4;
}

.import-modal h3 {
  @apply text-lg font-semibold text-k-text-primary mb-4;
}

.import-modal input[type="file"] {
  @apply w-full p-3 border border-k-border rounded-md mb-4;
}

.modal-buttons {
  @apply flex gap-3 justify-end;
}

.modal-buttons button {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.modal-buttons button:first-child {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}

.modal-buttons button:last-child {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-card p.text-2xl {
    font-size: 1.5rem;
  }

  .controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .controls > * {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Loading states */
.exporting {
  pointer-events: none;
  opacity: 0.6;
}

/* Smooth transitions */
.routes-view * {
  transition: all 0.2s ease;
}
</style>