<template>
  <article :class="{ me: isCurrentAdmin }"
           class="admin-card p-4 flex items-center rounded-md bg-k-bg-secondary border border-k-border gap-3 transition-[border-color] duration-200 ease-in-out hover:border-white/15">

    <UserAvatar :admin="admin" width="48"/>

    <main class="flex flex-col justify-between relative flex-1 gap-1">
      <h3 class="font-medium flex gap-2 items-center">
        <span v-if="adminName" class="name">{{ adminName }}</span>
        <span v-else class="name font-light text-k-text-secondary">Без имени</span>

        <Icon v-if="isCurrentAdmin"
              :icon="['fas', 'circle-check']"
              class="you text-k-highlight"
              title="Это вы!"/>

        <Icon v-if="admin.isSuperAdmin"
              :icon="['fas', 'shield']"
              class="is-admin text-k-primary"
              title="Супер-администратор"/>
      </h3>

      <div class="user-details">
        <div class="flex items-center gap-2">
          <p v-if="admin.isSuperAdmin" class="text-k-text-secondary">
            Супер-администратор
          </p>
          <p v-else class="text-k-text-secondary">
            Администратор
          </p>

          <span v-if="!admin.isActive"
                class="status-badge inactive">
            Неактивен
          </span>
          <span v-else class="status-badge active">
            Активен
          </span>
        </div>

        <div class="text-xs text-k-text-secondary mt-1 flex items-center gap-3">
          <span>@{{ admin.username }}</span>
          <span v-if="admin.createdAt">
            Создан: {{ formatDate(admin.createdAt ) }}
          </span>
          <span v-if="admin.lastLoginAt">
            Вход: {{ formatLastLogin(admin.lastLoginAt) }}
          </span>
        </div>
      </div>
    </main>

    <div class="actions flex items-center space-x-2">
      <BtnComponent
          highlight
          small
          @click="edit"
          :disabled="loading">
        {{ isCurrentAdmin ? 'Ваш профиль' : (canEditAdmin ? 'Изменить' : 'Просмотр') }}
      </BtnComponent>

      <BtnComponent
          v-if="canToggleStatus"
          :class="admin.isActive ? 'warning' : 'success'"
          small
          @click="toggleStatus"
          :disabled="loading">
        {{ admin.isActive ? 'Деактивировать' : 'Активировать' }}
      </BtnComponent>

      <BtnComponent
          v-if="canDeleteAdmin"
          danger
          small
          @click="destroy"
          :disabled="loading">
        Удалить
      </BtnComponent>
    </div>

    <div v-if="loading" class="absolute inset-0 bg-black/10 rounded-md flex items-center justify-center">
      <Icon :icon="['fas', 'refresh']" class="animate-spin text-k-text-secondary" />
    </div>
  </article>
</template>

<script>
import { useDialogBox, useMessageToaster, useRouter, useAuthorization } from '@/composables';
import { eventBus } from '@/utils';
import { mapActions } from 'vuex';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import AdminAvatar from './AdminAvatar.vue';

export default {
  name: 'AdminCard',

  components: {
    BtnComponent,
    UserAvatar: AdminAvatar,
  },

  props: {
    admin: {
      type: Object,
      required: true
    }
  },

  setup() {
    const { currentAdmin, isSuperAdmin } = useAuthorization();
    const { go } = useRouter();
    const { showConfirmDialog } = useDialogBox();
    const { toastSuccess, toastError } = useMessageToaster();

    return {
      currentAdmin,
      isSuperAdmin,
      go,
      showConfirmDialog,
      toastSuccess,
      toastError
    }
  },

  data() {
    return {
      loading: false
    }
  },

  computed: {
    isCurrentAdmin() {
      const current = this.currentAdmin;
      return current && this.admin.id === current.id;
    },

    adminName() {
      return this.admin.fullName || this.admin.name || this.admin.username;
    },

    isCurrentUserSuperAdmin() {
      const current = this.currentAdmin;
      return current && (
          current.isSuperAdmin === true ||
          current.is_super_admin === true
      );
    },

    canEditAdmin() {
      if (this.isCurrentAdmin) return true;

      return this.isCurrentUserSuperAdmin;
    },

    canDeleteAdmin() {
      if (this.isCurrentAdmin) return false;

      return this.isCurrentUserSuperAdmin;
    },

    canToggleStatus() {
      if (this.isCurrentAdmin) return false;

      return this.isCurrentUserSuperAdmin;
    }
  },

  methods: {
    ...mapActions('admin', {
      deleteAdmin: 'destroy',
      activateAdmin: 'activate',
      deactivateAdmin: 'deactivate'
    }),

    async edit() {
      if (this.loading) return;

      if (this.isCurrentAdmin) {
        console.log('🔍 Переход на профиль...');
        this.go('profile');
      } else if (this.canEditAdmin) {
        eventBus.emit('MODAL_SHOW_EDIT_USER_FORM', this.admin);
      } else {
        this.toastError('У вас нет прав для редактирования других администраторов');
      }
    },

    async toggleStatus() {
      if (this.loading) return;

      if (!this.canToggleStatus) {
        this.toastError('У вас нет прав для изменения статуса администраторов');
        return;
      }

      const action = this.admin.isActive ? 'деактивировать' : 'активировать';
      const confirmed = await this.showConfirmDialog(
          `Подтвердите действие`,
          `Вы уверены, что хотите ${action} администратора ${this.adminName}?`
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        if (this.admin.isActive) {
          await this.deactivateAdmin(this.admin.id);
          this.toastSuccess('Администратор деактивирован');
        } else {
          await this.activateAdmin(this.admin.id);
          this.toastSuccess('Администратор активирован');
        }
      } catch (error) {
        console.error('Toggle status error:', error);
        this.toastError('Ошибка при изменении статуса');
      } finally {
        this.loading = false;
      }
    },

    async destroy() {
      if (this.loading) return;

      if (!this.canDeleteAdmin) {
        this.toastError('У вас нет прав для удаления администраторов');
        return;
      }

      const confirmed = await this.showConfirmDialog(
          'Удалить администратора',
          `Вы уверены, что хотите удалить администратора ${this.adminName}? Это действие нельзя отменить.`
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        await this.deleteAdmin(this.admin.id);
        this.toastSuccess('Администратор удален');
      } catch (error) {
        console.error('Delete admin error:', error);
        this.toastError('Ошибка при удалении администратора');
      } finally {
        this.loading = false;
      }
    },

    formatDate(date) {
      if (!date) return '';
      return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
    },

    formatLastLogin(date) {
      if (!date) return 'Никогда';
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ru
      });
    }
  }
};
</script>

<style lang="postcss" scoped>
/* ✅ ИСПРАВЛЕНИЕ - без прозрачности Tailwind */
.admin-card.me {
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

/* ✅ БЕЗ @apply с прозрачностью - используем чистый CSS */
.status-badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-radius: 9999px;
  font-weight: 500;
  border-width: 1px;
}

.status-badge.active {
  background-color: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
  border-color: color-mix(in srgb, var(--color-success) 25%, transparent);
}

.status-badge.inactive {
  background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 25%, transparent);
}
</style>