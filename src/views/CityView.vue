<template>
  <BaseView>
    <template #header>
      <ScreenHeader :layout="headerLayout">
        Города

        <template v-if="totalCount > 0" #meta>
          <span>{{ pluralizeText }} ({{ activeCount }} активных)</span>
        </template>

        <template #controls>
          <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
            <ListFilter
                v-if="totalCount > 0 && !isPhone"
                placeholder="Поиск по названию города..."
                :disabled="isLoading"
                @change="onFilterChanged"
            />
          </div>
          <BtnGroup uppercase>
            <BtnComponent
                success
                :disabled="isLoading"
                @click="showAddCityForm"
            >
              <Icon :icon="['fas', 'plus']" class="mr-2" />
              Добавить
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <!-- Loading State -->
    <ListSkeleton v-if="showSkeletons" class="-m-6" />

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state p-6 text-center">
      <div class="error-icon mb-4">
        <Icon :icon="['fas', 'exclamation-triangle']" class="text-4xl text-red-500" />
      </div>
      <h3 class="text-lg font-semibold text-k-text-primary mb-2">
        Ошибка загрузки данных
      </h3>
      <p class="text-k-text-secondary mb-4">{{ errorMessage }}</p>
      <BtnComponent
          @click="retryLoad"
          :disabled="isLoading"
          class="inline-flex items-center"
      >
        <Icon :icon="['fa', 'rotate-right']" class="mr-2" />
        Повторить попытку
      </BtnComponent>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Cities Table -->
      <TableList
          v-if="cities.length > 0"
          ref="cityList"
          class="-m-6"
          :cities="filteredCities"
          :selected-cities="selectedCities"
          :config="tableConfig"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :is-loading="isLoadingMore"
          @sort="handleSort"
          @scroll-breakpoint="onScrollBreakpoint"
          @scrolled-to-end="loadMoreCities"
      />

      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'building-circle-exclamation']" />
        </template>

        <template #title>
          {{ isFiltering ? 'Города не найдены' : 'Список городов пуст' }}
        </template>

        <template #description>
                    <span v-if="isFiltering">
                        Попробуйте изменить поисковый запрос или очистить фильтры
                    </span>
          <span v-else>
                        Добавьте первый город для начала работы с системой
                    </span>
        </template>

        <template #action>
          <div class="flex gap-3">
            <BtnComponent
                v-if="isFiltering"
                outline
                @click="clearFilters"
            >
              <Icon :icon="['fas', 'times']" class="mr-2" />
              Очистить фильтры
            </BtnComponent>

            <BtnComponent
                success
                @click="showAddCityForm"
                :disabled="isLoading"
            >
              <Icon :icon="['fas', 'plus']" class="mr-2" />
              {{ isFiltering ? 'Добавить новый город' : 'Добавить первый город' }}
            </BtnComponent>
          </div>
        </template>
      </EmptyState>
    </template>

    <div v-if="hasMorePages && cities.length > 0" class="load-more-section">
      <div class="load-more-content">
        <BtnComponent
            @click="loadMoreCities"
            :disabled="isLoading"
            outline
            class="load-more-button"
        >
          <div v-if="isLoading" class="spinner"></div>
          <Icon v-else :icon="['fas', 'chevron-down']" class="mr-2" />
          {{ isLoading ? 'Загрузка...' : 'Загрузить ещё' }}
        </BtnComponent>

        <div class="load-more-info">
          <p class="text-sm text-k-text-secondary">
            Показано <span class="font-medium">{{ cities.length }}</span>
            из <span class="font-medium">{{ totalCount }}</span> городов
          </p>
          <div class="progress-bar">
            <div
                class="progress-fill"
                :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
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
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/City/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useRouter, useFuzzySearch, useMessageToaster } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle, debounce } from 'lodash';

export default {
  name: 'CityView',

  components: {
    BaseView,
    ScreenHeader,
    ListFilter,
    BtnGroup,
    BtnComponent,
    ListSkeleton,
    TableList,
    EmptyState,
  },

  setup() {
    const { go, onScreenActivated } = useRouter();
    const { toastSuccess, toastError } = useMessageToaster();

    return {
      go,
      onScreenActivated,
      toastSuccess,
      toastError
    };
  },

  data() {
    return {
      fuzzySearch: null,
      filterKeywords: '',
      isFiltering: false,

      isPhone: isMobile.any,
      headerLayout: 'collapsed',
      selectedCities: [],

      sortField: 'name',
      sortOrder: 'asc',
      currentPage: 1,
      hasMorePages: true,
      isLoadingMore: false,

      initialized: false,


      tableConfig: {
        filterable: true,
        sortable: true,
        reorderable: false,
        collaborative: false,
        hasCustomOrderSort: true
      },


      showSuccessMessage: false,
      successMessage: '',
      successTimeout: null,


      debouncedSearch: null
    };
  },

  computed: {
    ...mapGetters('cities', [
      'getCities',
      'isLoading',
      'getError',
      'totalCount',
      'activeCount',
      'hasMorePages'
    ]),

    cities() {
      return this.getCities || [];
    },

    hasError() {
      return !!this.getError;
    },

    errorMessage() {
      return this.getError || 'Неизвестная ошибка';
    },

    showSkeletons() {
      return this.isLoading && this.cities.length === 0 && !this.hasError;
    },

    filteredCities() {
      let result = [...this.cities];

      if (this.filterKeywords && this.fuzzySearch) {
        result = this.fuzzySearch.search(this.filterKeywords);
      }

      if (this.sortField) {
        result = orderBy(result, [this.sortField], [this.sortOrder]);
      }

      return result;
    },

    pluralizeText() {
      return pluralize(this.totalCount, 'город', 'города', 'городов');
    },

    progressPercentage() {
      if (this.totalCount === 0) return 0;
      return Math.min((this.cities.length / this.totalCount) * 100, 100);
    }
  },

  watch: {

    cities: {
      immediate: true,
      handler(newCities) {
        if (newCities && newCities.length > 0) {

          this.fuzzySearch = useFuzzySearch(newCities, ['name', 'nameTm']);
        }
      }
    },


    hasError(newValue) {
      if (newValue) {
        this.toastError('Ошибка загрузки данных');
      }
    }
  },

  async mounted() {

    this.debouncedSearch = debounce((value) => {
      this.filterKeywords = value;
      this.isFiltering = !!value;
    }, 300);


    await this.initializeData();


    this.setupEventListeners();
  },

  beforeUnmount() {

    this.cleanup();
  },

  methods: {
    ...mapActions('cities', [
      'fetchAll',
      'paginate',
      'clearError',
      'resetPagination'
    ]),

    async initializeData() {
      if (this.initialized) return;

      try {
        this.initialized = true;
        await this.loadInitialData();
      } catch (error) {
        console.error('Failed to initialize city data:', error);
        useErrorHandler().handleHttpError(error);
      }
    },

    async loadInitialData() {
      try {
        await this.fetchAll({
          sort: this.sortField,
          order: this.sortOrder
        });
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    },

    async loadMoreCities() {
      if (this.isLoading || !this.hasMorePages) return;

      try {
        await this.paginate({
          sort: this.sortField,
          order: this.sortOrder
        });
      } catch (error) {
        console.error('Failed to load more cities:', error);
      }
    },

    async retryLoad() {
      this.clearError();
      this.resetPagination();
      await this.loadInitialData();
    },

    async handleSort(field, order) {
      this.sortField = field;
      this.sortOrder = order;

      this.resetPagination();
      await this.loadInitialData();
    },


    getSortPath(field) {

      const fieldMap = {
        'name': 'name',
        'nameTm': 'nameTm',
        'displayOrder': 'displayOrder',
        'isActive': 'isActive'
      };
      return fieldMap[field] || field;
    },

    onFilterChanged(value) {

      this.debouncedSearch(value);
    },

    clearFilters() {
      this.filterKeywords = '';
      this.isFiltering = false;
    },


    showAddCityForm() {
      eventBus.emit('MODAL_SHOW_ADD_CITY_FORM');
    },


    setupEventListeners() {

      eventBus.on('MODAL_SHOW_ADD_CITY_FORM', this.showAddCityForm);
      eventBus.on('MODAL_SUCCESS', this.handleModalSuccess);


      eventBus.on('CITY_CREATED', this.handleCityCreated);
      eventBus.on('CITY_UPDATED', this.handleCityUpdated);
      eventBus.on('CITY_DELETED', this.handleCityDeleted);
    },

    cleanup() {

      eventBus.off('MODAL_SHOW_ADD_CITY_FORM', this.showAddCityForm);
      eventBus.off('MODAL_SUCCESS', this.handleModalSuccess);
      eventBus.off('CITY_CREATED', this.handleCityCreated);
      eventBus.off('CITY_UPDATED', this.handleCityUpdated);
      eventBus.off('CITY_DELETED', this.handleCityDeleted);


      if (this.successTimeout) {
        clearTimeout(this.successTimeout);
      }
    },





    handleModalSuccess() {

      if (this.cities.length > 0) {
        this.fuzzySearch = useFuzzySearch(this.cities, ['name', 'nameTm']);
      }
    },

    handleCityCreated(city) {
      this.showSuccessToast(`Город "${city.name}" успешно создан`);
    },

    handleCityUpdated(city) {
      this.showSuccessToast(`Город "${city.name}" успешно обновлен`);
    },

    handleCityDeleted(city) {
      this.showSuccessToast(`Город "${city.name}" успешно удален`);
    },

    showSuccessToast(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;


      if (this.successTimeout) {
        clearTimeout(this.successTimeout);
      }

      this.successTimeout = setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },





    onScrollBreakpoint: throttle(function (direction) {
      this.headerLayout = direction === 'down' ? 'collapsed' : 'expanded';
    }, 200)
  }
};
</script>

<style lang="postcss" scoped>
.load-more-section {
  @apply mt-8 mb-6;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.02));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.load-more-content {
  @apply px-6 py-8 text-center;
  max-width: 400px;
  margin: 0 auto;
}

.load-more-button {
  @apply inline-flex items-center px-6 py-3 text-base font-medium;
  @apply border-2 border-k-border rounded-lg;
  @apply bg-k-bg-secondary hover:bg-k-bg-primary;
  @apply text-k-text-primary hover:text-k-accent;
  @apply transition-all duration-300 ease-in-out;
  @apply shadow-sm hover:shadow-md;
  min-width: 160px;
}

.load-more-button:hover {
  @apply border-k-accent transform translate-y-[-1px];
}

.load-more-button:disabled {
  @apply opacity-60 cursor-not-allowed transform-none;
}

.load-more-info {
  @apply mt-6 space-y-3;
}

.progress-bar {
  @apply w-full h-2 bg-k-bg-secondary rounded-full overflow-hidden;
  @apply border border-k-border;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full;
  @apply transition-all duration-500 ease-out;
}

.spinner {
  @apply inline-block w-5 h-5 border-2 border-solid border-r-transparent rounded-full animate-spin mr-2;
  border-color: currentColor transparent currentColor transparent;
}


.error-state {
  @apply bg-k-bg-secondary rounded-lg border border-k-border mx-6;
}

.error-icon {
  @apply flex justify-center;
}

.success-toast {
  @apply fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50;
  @apply flex items-center font-medium;
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

/* Collapsed header styles */
.collapsed .controls {
  @apply w-auto;
}


@media (max-width: 768px) {
  .success-toast {
    @apply bottom-4 right-4 left-4;
  }

  .load-more-section {
    @apply mt-6 mb-4;
  }

  .load-more-content {
    @apply px-4 py-6;
  }

  .load-more-button {
    @apply px-4 py-2 text-sm;
    min-width: 140px;
  }
}


@media (prefers-color-scheme: dark) {
  .progress-fill {
    @apply from-blue-400 to-blue-500;
  }

  .load-more-section {
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));
  }
}
</style>