<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Сотрудники

        <template #meta>
          <span v-if="admins.length > 0">{{ pluralizes() }}</span>
        </template>

        <template #controls>
          <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
            <ListFilter
                v-if="admins.length > 0 && !isPhone"
                @change="onFilterChanged"
            />
          </div>
          <BtnGroup uppercase>
            <BtnComponent success @click="showAddAdminForm">
              <Icon :icon="['fas', 'plus']" />
              Добавить
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <!-- Индикатор загрузки -->
    <ListSkeleton v-if="isLoading" class="-m-6" />

    <!-- Список пользователей -->
    <template v-else>
      <ul v-if="sortedAdmins.length > 0" class="space-y-3">
        <li v-for="admin in sortedAdmins" :key="admin.id">
          <AdminCard :admin="admin" />
        </li>
      </ul>

      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'users']" />
        </template>

        Список администраторов пуст

        <template #action>
          <BtnComponent success @click="showAddAdminForm">
            <Icon :icon="['fas', 'plus']" class="mr-2" />
            Добавить первого администратора
          </BtnComponent>
        </template>
      </EmptyState>
    </template>
  </BaseView>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { useAuthorization } from '@/composables';
import { eventBus, pluralize } from '@/utils';
import isMobile from 'ismobilejs';

import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import AdminCard from '@/components/Admin/AdminCard.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';
// import Pagination from '@/components/Ui/Pagination.vue'; // ✅ Убираем пока не нужно

export default {
  name: 'AdminView',

  components: {
    BaseView,
    ScreenHeader,
    BtnGroup,
    BtnComponent,
    AdminCard,
    ListFilter,
    ListSkeleton,
    EmptyState
    // Pagination // ✅ Убираем пока не нужно
  },

  setup() {
    const { currentAdmin } = useAuthorization();
    return { currentAdmin };
  },

  data() {
    return {
      isPhone: isMobile.any
    };
  },

  computed: {
    // ✅ ИСПРАВЛЕНО: используем admin модуль
    ...mapGetters('admin', [
      'admins',
      // 'filteredUsers',  // ✅ Убираем пока не реализовано
      'isLoading'
      // 'pagination',     // ✅ Убираем пока не реализовано
      // 'filters',        // ✅ Убираем пока не реализовано
      // 'currentUser',    // ✅ Дублируется из setup()
      // 'isSuperAdmin'    // ✅ Убираем пока не реализовано
    ]),

    filteredAdmins() {
      // ✅ Простая фильтрация пока admin модуль не готов
      return this.admins || [];
    },

    sortedAdmins() {
      return this.filteredAdmins
          .slice() //
          .sort((a, b) => {
            if (a.id === this.currentAdmin?.id) return -1;
            if (b.id === this.currentAdmin?.id) return 1;

            const aIsSuper = a.isSuperAdmin || a.is_super_admin || a.admin;
            const bIsSuper = b.isSuperAdmin || b.is_super_admin || b.admin;

            if (aIsSuper && !bIsSuper) return -1;
            if (!aIsSuper && bIsSuper) return 1;

            // Потом по алфавиту
            const aName = a.fullName || a.full_name || a.username;
            const bName = b.fullName || b.full_name || b.username;
            return aName.localeCompare(bName);
          });
    },

    hasActiveFilters() {
      return false;
      // return this.filters.search ||
      //        this.filters.isActive !== null ||
      //        this.filters.isSuperAdmin !== null;
    }
  },

  async mounted() {
    try {
      await this.fetchAdmins();
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  },

  methods: {
    ...mapActions('admin', [
      'fetchAdmins'
      // 'setFilters',     // ✅ Убираем пока не реализовано
      // 'resetFilters',   // ✅ Убираем пока не реализовано
      // 'setPage'         // ✅ Убираем пока не реализовано
    ]),

    showAddAdminForm() {
      eventBus.emit('MODAL_SHOW_ADD_USER_FORM');
    },

    async onFilterChanged(filters) {
      // ✅ TODO: Реализовать когда будет готов admin модуль
      console.log('Фильтры изменены:', filters);
      // await this.setFilters(filters);
    },

    async clearFilters() {
      // ✅ TODO: Реализовать когда будет готов admin модуль
      console.log('Очистка фильтров');
      // await this.resetFilters();
    },

    async changePage(page) {
      // ✅ TODO: Реализовать когда будет готов admin модуль
      console.log('Смена страницы:', page);
      // await this.setPage(page);
    },

    pluralizes() {
      return pluralize(this.users.length, 'администратор', 'администратора', 'администраторов');
    }
  }
};
</script>

<style lang="postcss" scoped>
.controls {
  @apply flex items-center justify-between gap-4;
}

@media (max-width: 768px) {
  .controls {
    @apply flex-col items-stretch gap-3;
  }
}
</style>