<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Остановки

        <template v-if="stops.length > 0" #meta>
          <span>{{ pluralizes() }}</span>
        </template>

        <template #controls>
          <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
            <ListFilter
                v-if="stops.length > 0 && !isPhone"
                v-model="filterKeywords"
                @update:modelValue="handleFilter"
                placeholder="Поиск остановок..."
            />

            <SelectBox
                v-if="cities.length > 0 && !isPhone"
                v-model="selectedCityFilter"
                placeholder="Все города"
                :options="cityFilterOptions"
                value-key="value"
                label-key="label"
                @update:modelValue="handleCityFilter"
                class="w-48"
            />
          </div>

          <BtnGroup uppercase>
            <BtnComponent success @click="showAddStopForm">
              <Icon :icon="['fas', 'plus']" />
              Добавить
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <ListSkeleton v-if="showSkeletons" class="-m-6" />

    <template v-else>
      <TableList
          v-if="stops.length > 0"
          ref="stopsList"
          class="-m-6"
          :stops="filteredStops"
          :config="tableConfig"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :is-loading="isLoadingMore"
          :has-more-data="hasMorePages"
          :total-count="totalCount"
          @sort="sort"
          @edit="showEditStopForm"
          @delete="handleDeleteStop"
          @load-more="loadMoreStops"
      />

      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'map-marker-alt']" />
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
              @click="showAddStopForm"
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
import TableList from '@/components/Stops/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useRouter, useMessageToaster } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, debounce } from 'lodash';

export default {
  name: 'StopsView',

  components: {
    BaseView,
    ScreenHeader,
    ListFilter,
    BtnGroup,
    BtnComponent,
    SelectBox,
    ListSkeleton,
    TableList,
    EmptyState,
  },

  setup() {
    const { go, onScreenActivated } = useRouter();
    const { toastSuccess, toastError } = useMessageToaster();
    const errorHandler = useErrorHandler();

    return {
      go,
      onScreenActivated,
      toastSuccess,
      toastError,
      errorHandler
    };
  },

  data() {
    return {
      fuzzySearch: null,
      filterKeywords: '',
      isFiltering: false,
      selectedCityFilter: null,

      isPhone: isMobile.any,
      headerLayout: 'collapsed',
      selectedStops: [],

      sortField: 'stopName',
      sortOrder: 'asc',
      isLoadingMore: false,

      initialized: false,

      tableConfig: {
        filterable: true,
        sortable: true,
        reorderable: false,
        collaborative: false,
        hasCustomOrderSort: false,
        clickable: true
      },

      showSuccessMessage: false,
      successMessage: '',
      successTimeout: null,

      debouncedSearch: null
    };
  },

  computed: {
    ...mapGetters('stops', [
      'getStops',
      'isLoading',
      'getError',
      'totalCount',
      'activeCount',
      'hasMorePages'
    ]),
    ...mapGetters('cities', ['getCities']),

    stops() {
      return this.getStops || [];
    },

    cities() {
      return this.getCities || [];
    },

    hasError() {
      return !!this.getError;
    },

    showSkeletons() {
      return this.isLoading && !this.initialized;
    },

    filteredStops() {
      let result = [...this.stops];

      if (this.selectedCityFilter) {
        result = result.filter(stop => stop.city_id === this.selectedCityFilter);
      }

      if (this.filterKeywords && this.fuzzySearch) {
        const searchResults = this.fuzzySearch.search(this.filterKeywords);
        const matchingIds = new Set(searchResults.map(item => item.item.id));
        result = result.filter(stop => matchingIds.has(stop.id));
      }

      return orderBy(result, [this.sortField], [this.sortOrder]);
    },

    hasAppliedFilters() {
      return this.filterKeywords || this.selectedCityFilter;
    },

    activeCities() {
      return this.cities.filter(city => city.is_active);
    },

    cityFilterOptions() {
      const options = [
        { value: null, label: 'Все города' }
      ];

      this.activeCities.forEach(city => {
        const stopsCount = this.stops.filter(stop => stop.city_id === city.id).length;
        options.push({
          value: city.id,
          label: `${city.name} (${stopsCount})`
        });
      });

      return options;
    },

    progressPercentage() {
      if (!this.totalCount || this.totalCount === 0) return 0;
      return Math.round((this.stops.length / this.totalCount) * 100);
    },

    emptyStateMessage() {
      return this.hasAppliedFilters
          ? 'По вашему запросу остановки не найдены'
          : 'Список остановок пуст';
    },

    emptyStateActionText() {
      return this.stops.length === 0
          ? 'Добавить первую остановку'
          : 'Добавить новую остановку';
    }
  },

  watch: {
    stops: {
      immediate: true,
      handler(newStops) {
        if (newStops && newStops.length > 0) {
          this.$nextTick(() => {
            this.initializeFuzzySearch(newStops);
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
    }
  },

  async created() {
    this.debouncedSearch = debounce(this.performSearch, 300);
    await this.initializeData();
  },

  mounted() {
    this.onScreenActivated(() => {
      if (!this.initialized) {
        this.initializeData();
      }
    });

    eventBus.on('stop:created', this.handleStopCreated);
    eventBus.on('stop:updated', this.handleStopUpdated);
    eventBus.on('stop:deleted', this.handleStopDeleted);
  },

  beforeUnmount() {
    eventBus.off('stop:created', this.handleStopCreated);
    eventBus.off('stop:updated', this.handleStopUpdated);
    eventBus.off('stop:deleted', this.handleStopDeleted);

    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  },

  methods: {
    ...mapActions('stops', ['fetchAll', 'paginate', 'destroy', 'setFilters']),
    ...mapActions('cities', { fetchCities: 'fetchAll' }),

    async initializeData() {
      try {
        await Promise.all([
          this.fetchStops(),
          this.fetchCities()
        ]);

        this.initialized = true;
      } catch (error) {
        await this.errorHandler.handleError(error);
      }
    },

    async fetchStops() {
      try {
        await this.fetchAll({
          page: 1,
          size: 25,
          sort: this.sortField,
          order: this.sortOrder,
          active: true,
        });
      } catch (error) {
        await this.errorHandler.handleError(error);
      }
    },

    async loadMoreStops() {
      if (this.isLoadingMore || !this.hasMorePages) return;

      this.isLoadingMore = true;

      try {
        await this.paginate({
          page: Math.floor(this.stops.length / 25) + 1,
          size: 25,
          sort: this.sortField,
          order: this.sortOrder,
          active: true,
        });
      } catch (error) {
        await this.errorHandler.handleError(error);
      } finally {
        this.isLoadingMore = false;
      }
    },

    initializeFuzzySearch(stops) {
      this.fuzzySearch = {
        search: (query) => {
          if (!query || !stops) return [];

          const searchQuery = query.toLowerCase();
          return stops
              .map(stop => ({ item: stop }))
              .filter(({ item }) => {
                return (
                    item.stop_name?.toLowerCase().includes(searchQuery) ||
                    item.name_tm?.toLowerCase().includes(searchQuery) ||
                    this.getCityName(item.cityId)?.toLowerCase().includes(searchQuery)
                );
              });
        }
      };
    },

    getCityName(cityId) {
      if (!cityId) return '';
      const city = this.cities.find(c => c.id === cityId);
      return city?.name || '';
    },

    getCityStopCount(cityId) {
      return this.stops.filter(stop => stop.cityId === cityId).length;
    },

    handleFilter(keywords) {
      this.filterKeywords = keywords;
      this.debouncedSearch();
    },

    handleCityFilter(cityId) {
      this.selectedCityFilter = cityId;
      this.performSearch();
    },

    performSearch() {
      this.isFiltering = false;
    },

    clearAllFilters() {
      this.filterKeywords = '';
      this.selectedCityFilter = null;
      this.setFilters({});
    },

    pluralizes() {
      return pluralize(this.stops.length, 'остановка', 'остановки', 'остановок');
    },

    onScrollBreakpoint(direction) {
      console.log('Scroll breakpoint:', direction);
    },

    sort(field, order) {
      this.sortField = field;
      this.sortOrder = order || (this.sortField === field && this.sortOrder === 'asc' ? 'desc' : 'asc');
      this.fetchStops();
    },

    showAddStopForm() {
      eventBus.emit('MODAL_SHOW_ADD_STOP_FORM');
    },

    showEditStopForm(stop) {
      this.go('StopsEditForm', { stopId: stop.id, stop });
    },

    async handleDeleteStop(stop) {
      try {
        await this.destroy(stop.id);
        this.showSuccessToast(`Остановка "${stop.stopName}" успешно удалена`);
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      }
    },

    handleStopCreated(stop) {
      this.showSuccessToast(`Остановка "${stop.stopName}" успешно создана`);
      this.fetchStops();
    },

    handleStopUpdated(stop) {
      this.showSuccessToast(`Остановка "${stop.stopName}" успешно обновлена`);
    },

    handleStopDeleted(stopName) {
      this.showSuccessToast(`Остановка "${stopName}" успешно удалена`);
    },

    showSuccessToast(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;

      if (this.successTimeout) {
        clearTimeout(this.successTimeout);
      }

      this.successTimeout = setTimeout(() => {
        this.showSuccessMessage = false;
      }, 4000);
    }
  }
};
</script>

<style lang="postcss" scoped>
.controls {
  @apply flex flex-wrap items-center gap-3;
}

.success-toast {
  @apply fixed top-4 right-4 z-50;
  @apply px-4 py-3 rounded-lg shadow-lg;
  @apply flex items-center font-medium;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Dark theme select */
:deep(.dark-select) {
  background-color: var(--color-bg-input);
  border-color: var(--color-border);
  border-radius: 0.5rem;
}

:deep(.dark-select select) {
  background-color: var(--color-bg-input);
  color: var(--color-text-input);
}

@media (max-width: 768px) {
  .controls {
    @apply flex-col items-stretch gap-2;
  }

  .success-toast {
    @apply top-2 right-2 left-2;
  }
}
</style>