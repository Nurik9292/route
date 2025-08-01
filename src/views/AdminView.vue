<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Администраторы

        <template #meta>
          <span v-if="sortedAdmins.length > 0">{{ pluralizeAdmins() }}</span>
        </template>

        <template #controls>
          <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
            <ListFilter
                v-if="sortedAdmins.length > 0 && !isPhone"
                :placeholder="'Поиск администраторов...'"
                @change="onFilterChanged"
            />
          </div>
          <BtnGroup uppercase>
            <BtnComponent
                v-if="canManageAdmins"
                success
                @click="showAddAdminForm">
              <Icon :icon="['fas', 'plus']" />
              Добавить
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <ListSkeleton v-if="isLoading" class="-m-6" />

    <template v-else>
      <ul v-if="sortedAdmins.length > 0" class="space-y-3">
        <li v-for="admin in sortedAdmins" :key="admin.id">
          <AdminCard :admin="admin" @refresh="refreshAdmins" />
        </li>
      </ul>

      <EmptyState v-else>
        <template #icon>
          <Icon :icon="['fas', 'users']" />
        </template>

        Список администраторов пуст

        <template #action>
          <BtnComponent
              v-if="canManageAdmins"
              success
              @click="showAddAdminForm">
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
  },

  setup() {
    const { currentAdmin, isSuperAdmin } = useAuthorization();
    return { currentAdmin, isSuperAdmin };
  },

  data() {
    return {
      isPhone: isMobile.any,
      searchQuery: ''
    };
  },

  computed: {
    ...mapGetters('admin', [
      'admins',
      'isLoading'
    ]),

    canManageAdmins() {
      return this.isSuperAdmin;
    },

    filteredAdmins() {
      if (!this.searchQuery.trim()) {
        return this.admins || [];
      }

      const query = this.searchQuery.toLowerCase();
      return (this.admins || []).filter(admin => {
        const name = (admin.fullName || admin.name || '').toLowerCase();
        const username = (admin.username || '').toLowerCase();
        return name.includes(query) || username.includes(query);
      });
    },

    sortedAdmins() {
      return this.filteredAdmins
          .slice()
          .sort((a, b) => {
            if (a.id === this.currentAdmin?.id) return -1;
            if (b.id === this.currentAdmin?.id) return 1;

            const aIsSuper = a.isSuperAdmin || a.is_super_admin || a.admin;
            const bIsSuper = b.isSuperAdmin || b.is_super_admin || b.admin;

            if (aIsSuper && !bIsSuper) return -1;
            if (!aIsSuper && bIsSuper) return 1;

            // Активные выше неактивных
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;

            // По имени
            const aName = a.fullName || a.name || a.username || '';
            const bName = b.fullName || b.name || b.username || '';
            return aName.localeCompare(bName);
          });
    }
  },

  async mounted() {
    await this.refreshAdmins();
  },

  methods: {
    ...mapActions('admin', {
      fetchAdmins: 'fetchAdmins'
    }),

    pluralizeAdmins() {
      return pluralize(this.sortedAdmins.length, 'администратор', 'администратора', 'администраторов');
    },

    onFilterChanged(query) {
      this.searchQuery = query;
    },

    showAddAdminForm() {
      eventBus.emit('MODAL_SHOW_ADD_USER_FORM');
    },

    async refreshAdmins() {
      try {
        await this.fetchAdmins();
      } catch (error) {
        console.error('Ошибка загрузки администраторов:', error);
      }
    }

  }
};
</script>

<style lang="postcss" scoped>
.controls {
  min-height: 32px;
}
</style>