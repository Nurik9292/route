<template>
  <BaseView>
    <template #header>
      <ScreenHeader :layout="headerLayout">
        Баннеры

        <template v-if="banners.length > 0" #meta>
          <span class="text-k-text-secondary">
            {{ pluralizeBanners() }} •
            <span class="text-k-success">{{ activeBannersCount }}</span> активных •
            <span class="text-k-danger">{{ inactiveBannersCount }}</span> неактивных
          </span>
        </template>

        <template #controls>
          <div class="controls-container">
            <!-- Search Filter -->
            <div class="search-container">
              <ListFilter
                  v-model="filterKeywords"
                  placeholder="Поиск по названию или ссылке..."
                  :class="{ 'hidden': headerLayout === 'collapsed' }"
              />
            </div>

            <BtnGroup uppercase>
              <BtnComponent
                  v-if="headerLayout === 'collapsed'"
                  secondary
                  @click="toggleSearch"
                  title="Поиск"
              >
                <Icon :icon="['fas', 'search']" />
              </BtnComponent>

              <BtnComponent
                  success
                  @click="showAddBannerForm"
                  :class="{ 'mobile-add-btn': headerLayout === 'collapsed' }"
              >
                <Icon :icon="['fas', 'plus']" />
                <span v-if="headerLayout !== 'collapsed'">Добавить баннер</span>
              </BtnComponent>
            </BtnGroup>
          </div>
        </template>
      </ScreenHeader>
    </template>

    <ListSkeleton v-if="showSkeletons" class="-m-6" />

    <template v-else>
      <div v-if="!showSkeletons" class="filters-bar bg-k-bg-secondary border-b border-k-border p-4 -m-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="filter-group">
            <label class="filter-label">Статус:</label>
            <SelectBox
                v-model="statusFilter"
                :options="statusFilterOptions"
                class="w-40"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Страница:</label>
            <SelectBox
                v-model="pageFilter"
                :options="pageFilterOptions"
                class="w-40"
            />
          </div>

          <!-- Sort Options -->
          <div class="filter-group">
            <label class="filter-label">Сортировка:</label>
            <SelectBox
                v-model="sortOption"
                :options="sortOptions"
                value-key="value"
                label-key="label"
                placeholder="Выберите тип баннера"
                class="w-48"
            />
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions ml-auto">
            <BtnComponent
                v-if="hasFilters"
                @click="clearAllFilters"
                secondary
                small
            >
              <Icon :icon="['fas', 'times']" class="mr-1" />
              Сбросить фильтры
            </BtnComponent>
          </div>
        </div>
      </div>

      <!-- Banner Table -->
      <TableList
          v-if="filteredBanners.length > 0"
          ref="bannerList"
          class="-m-6"
          :banners="filteredBanners"
          :config="config"
          :sortField="sortField"
          :sortOrder="sortOrder"
          :isLoading="loading"
          :hasMoreData="moreBannersAvailable"
          :totalCount="totalBanners"
          @sort="sort"
          @scroll-breakpoint="onScrollBreakpoint"
          @press:enter="onPressEnter"
          @scrolled-to-end="fetchBanners"
          @edit="showEditBannerForm"
          @delete="handleDeleteBanner"
          @toggle-status="handleToggleStatus"
          @load-more="loadMoreBanners"
      />

      <!-- Empty State -->
      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'images']" />
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
              @click="showAddBannerForm"
              success
          >
            {{ emptyStateActionText }}
          </BtnComponent>
        </template>
      </EmptyState>
    </template>

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
import SelectBox from '@/components/Ui/Form/SelectBox.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/Banners/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import { useErrorHandler, useRouter, useFuzzySearch, useDialogBox } from '@/composables';

import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle } from 'lodash';

export default {
  name: 'BannerView',

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
    const { showConfirmDialog } = useDialogBox();
    return { showConfirmDialog }
  },


  data() {
    return {
      banners: [],
      page: 1,
      loading: false,
      initialized: false,
      headerLayout: 'expanded',
      fuzzy: null,
      filterKeywords: '',
      statusFilter: 'all',
      pageFilter: 'all',
      sortOption: 'displayOrder_asc',
      showSearchMobile: false,
      showSuccessMessage: false,
      successMessage: '',
      config: {
        sortable: true,
        selectable: false,
      }
    };
  },

  computed: {
    ...mapGetters('banners', {
      getBanners: 'getBanners',
      moreBannersAvailable: 'moreBannersAvailable'
    }),

    banners() {
      return this.getBanners;
    },

    showSkeletons() {
      return this.loading && !this.initialized;
    },

    filteredBanners() {
      let result = this.banners;

      if (this.statusFilter !== 'all') {
        const isActive = this.statusFilter === 'active';
        result = result.filter(banner => banner.is_active === isActive);
      }

      if (this.pageFilter !== 'all') {
        result = result.filter(banner => banner.type === this.pageFilter);
      }

      if (this.filterKeywords.trim()) {
        result = this.fuzzy?.search(this.filterKeywords) || result;
      }

      const [field, order] = this.sortOption.split('_');
      return orderBy(result, [field], [order]);
    },

    sortField() {
      return this.sortOption.split('_')[0];
    },

    sortOrder() {
      return this.sortOption.split('_')[1];
    },

    activeBannersCount() {
      return this.banners.filter(banner => banner.is_active).length;
    },

    inactiveBannersCount() {
      return this.banners.filter(banner => !banner.is_active  ).length;
    },

    totalBanners() {
      return this.banners.length;
    },

    hasAppliedFilters() {
      return this.filterKeywords.trim() || this.statusFilter !== 'all' || this.pageFilter !== 'all';
    },

    hasFilters() {
      return this.hasAppliedFilters;
    },

    emptyStateMessage() {
      if (this.hasAppliedFilters) {
        return 'По вашему запросу ничего не найдено';
      }
      return 'Список баннеров пуст';
    },

    emptyStateActionText() {
      return 'Добавить первый баннер';
    },

    statusFilterOptions() {
      return [
        { value: 'all', label: 'Все баннеры' },
        { value: 'active', label: 'Активные' },
        { value: 'inactive', label: 'Неактивные' }
      ];
    },

    pageFilterOptions() {
      return [
        { value: 'all', label: 'Все страницы' },
        { value: 'main', label: 'Главная' },
        { value: 'stops', label: 'Остановки' },
        { value: 'routes', label: 'Маршруты' },
        { value: 'places', label: 'Места' }
      ];
    },

    sortOptions() {
      return [
        { value: 'displayOrder_asc', label: 'По порядку (возр.)' },
        { value: 'displayOrder_desc', label: 'По порядку (убыв.)' },
        { value: 'title_asc', label: 'По названию (А-Я)' },
        { value: 'title_desc', label: 'По названию (Я-А)' },
        { value: 'createdAt_desc', label: 'Сначала новые' },
        { value: 'createdAt_asc', label: 'Сначала старые' }
      ];
    }
  },


  async created() {
    await this.fetchInitialBanners();
  },

  watch: {
    getBanners: {
      immediate: true,
      handler(newBanners) {
        this.banners = newBanners || [];
      }
    },


    statusFilter() {
      this.updateUrl();
    },

    pageFilter() {
      this.updateUrl();
    },

    sortOption() {
      this.updateUrl();
    }
  },

  methods: {
    ...mapActions('banners', ['paginate', 'destroy', 'toggleStatus']),

    pluralizeBanners() {
      return pluralize(this.banners.length, 'баннер', 'баннера', 'баннеров');
    },

    async fetchInitialBanners() {
      if (this.loading || this.initialized) return;

      try {
        this.initialized = true;
        await this.fetchBanners();
        this.fuzzy = useFuzzySearch(this.banners, ['title', 'targetUrl']);
      } catch (error) {
        useErrorHandler().handleHttpError(error);
      }
    },

    async fetchBanners() {
      if (!this.moreBannersAvailable || this.loading) return;

      this.loading = true;

      try {
        this.page = await this.paginate({
          sort: this.sortField,
          order: this.sortOrder,
          page: this.page,
          active: true
        });
      } catch (error) {
        useErrorHandler().handleHttpError(error);
      } finally {
        this.loading = false;
      }
    },

    async loadMoreBanners() {
      await this.fetchBanners();
    },

    async sort(field, order) {
      this.page = 1;
      this.sortOption = `${field}_${order}`;
      await this.fetchBanners();
    },

    showAddBannerForm() {
      eventBus.emit('MODAL_SHOW_ADD_BANNER_FORM');
    },

    showEditBannerForm(banner) {
      console.log('log log log ', banner)
      eventBus.emit('MODAL_SHOW_EDIT_BANNER_FORM', banner);
    },

    async handleDeleteBanner(banner) {
      if (!await this.showConfirmDialog(`Удалить баннер "${banner.title}"?`)) return;

      try {
        await this.destroy(banner.id);
        this.showSuccess('Баннер успешно удален');
      } catch (error) {
        useErrorHandler().handleHttpError(error);
      }
    },

    async handleToggleStatus(banner) {
      if (this.loading) return;
      try {

        const newStatus = banner.is_active ? 'деактивирован' : 'активирован';
        const confirmed = await this.showConfirmDialog(
            `Подтвердите действие`,
            `Вы уверены, что хотите ${newStatus} администратора ${banner.id}?`
        );

        if (!confirmed) return;

        this.loading = true;

        await this.toggleStatus({
          'bannerId': banner.id,
          'active': !banner.is_active
        });

        this.showSuccess(`Баннер ${newStatus}`);
      } catch (error) {
        useErrorHandler().handleHttpError(error);
      } finally {
        this.loading = false;
      }
    },

    clearAllFilters() {
      this.filterKeywords = '';
      this.statusFilter = 'all';
      this.pageFilter = 'all';
      this.sortOption = 'displayOrder_asc';
      this.updateUrl();
    },

    toggleSearch() {
      this.showSearchMobile = !this.showSearchMobile;
    },

    updateUrl() {
      const params = new URLSearchParams();

      if (this.statusFilter !== 'all') {
        params.set('status', this.statusFilter);
      }

      if (this.pageFilter !== 'all') {
        params.set('page', this.pageFilter);
      }

      if (this.sortOption !== 'displayOrder_asc') {
        params.set('sort', this.sortOption);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
    },

    showSuccess(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },


    onScrollBreakpoint: throttle(function (direction) {
      this.headerLayout = direction === 'down' ? 'collapsed' : 'expanded';
    }, 200),

    onPressEnter() {
    }
  }
};
</script>

<style lang="postcss" scoped>
.controls-container {
  @apply flex items-center gap-4;
}

.search-container {
  @apply min-w-0 flex-1;
}

.collapsed .controls-container {
  @apply w-auto;
  flex: 0 0 auto;
}

.collapsed .search-container {
  @apply hidden;
}

.mobile-add-btn {
  @apply w-10 h-10 p-0 flex items-center justify-center;
}

.filters-bar {
  backdrop-filter: blur(10px);
}

.filter-group {
  @apply flex items-center gap-2;
}

.filter-label {
  @apply text-sm font-medium text-k-text-secondary whitespace-nowrap;
}

.quick-actions {
  @apply flex items-center gap-2;
}

.success-toast {
  @apply fixed top-4 right-4 bg-k-success text-white px-4 py-2 rounded shadow-lg z-50 flex items-center;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .filters-bar {
    @apply flex-col items-stretch gap-2;
  }

  .filter-group {
    @apply flex-col items-stretch gap-1;
  }

  .filter-label {
    @apply text-xs;
  }

  .quick-actions {
    @apply mt-2 justify-center;
  }
}

/* Loading and animation styles */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Custom scrollbar for banner list */
.banner-list-wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.banner-list-wrap::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

.banner-list-wrap::-webkit-scrollbar-thumb {
  background: var(--color-accent);
  border-radius: 4px;
}

.banner-list-wrap::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-accent) 80%, black 20%);
}
</style>