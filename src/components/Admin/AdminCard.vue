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

        <Icon v-if="isSuperAdmin"
              :icon="['fas', 'shield']"
              class="is-admin text-k-primary"
              title="Супер-администратор"/>
      </h3>

      <div class="user-details">
        <div class="flex items-center gap-2">
          <p v-if="isSuperAdmin" class="text-k-text-secondary">
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
          <span v-if="admin.createdAt || admin.created_at">
            Создан: {{ formatDate(user.createdAt || user.created_at) }}
          </span>
          <span v-if="admin.lastLoginAt || admin.last_login_at">
            Вход: {{ formatLastLogin(admin.lastLoginAt || admin.last_login_at) }}
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
        {{ isCurrentAdmin ? 'Ваш профиль' : 'Изменить' }}
      </BtnComponent>

      <BtnComponent
          v-if="!isCurrentAdmin && canToggleStatus"
          :class="admin.isActive ? 'warning' : 'success'"
          small
          @click="toggleStatus"
          :disabled="loading">
        {{ admin.isActive ? 'Деактивировать' : 'Активировать' }}
      </BtnComponent>

      <BtnComponent
          v-if="!isCurrentAdmin && canDeleteAdmin"
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
      return this.admin.fullName || this.admin.full_name || this.admin.name || this.admin.username;
    },

    canDeleteAdmin() {
      const current = this.currentAdmin;
      return current &&
          (current.isSuperAdmin || current.is_super_admin || current.admin) &&
          this.admin.id !== current.id;
    },

    canToggleStatus() {
      const current = this.currentAdmin;
      return current &&
          (current.isSuperAdmin || current.is_super_admin || current.admin) &&
          this.admin.id !== current.id;
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
        this.go('profile');
      } else {
        eventBus.emit('MODAL_SHOW_EDIT_USER_FORM', this.user);
      }
    },

    async toggleStatus() {
      if (this.loading) return;

      const action = this.admin.isActive ? 'деактивировать' : 'активировать';
      const adminName = this.adminName || 'пользователя';

      const confirmed = await this.showConfirmDialog(
          `${action.charAt(0).toUpperCase() + action.slice(1)} ${adminName}?`,
          this.admin.isActive
              ? 'Пользователь потеряет доступ к системе.'
              : 'Пользователь получит доступ к системе.'
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        if (this.admin.isActive) {
          await this.deactivateAdmin(this.admin);
          this.toastSuccess(`Пользователь "${adminName}" деактивирован`);
        } else {
          await this.activateAdmin(this.user);
          this.toastSuccess(`Пользователь "${adminName}" активирован`);
        }
      } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        this.handleError(error, 'изменении статуса');
      } finally {
        this.loading = false;
      }
    },

    async destroy() {
      if (this.loading) return;

      const adminName = this.adminName || 'этого пользователя';

      const confirmed = await this.showConfirmDialog(
          `Удалить ${adminName}?`,
          'Это действие нельзя отменить. Пользователь потеряет доступ к системе навсегда.'
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        await this.deleteAdmin(this.admin);
        this.toastSuccess(`Пользователь "${adminName}" удален успешно`);
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        this.handleError(error, 'удалении');
      } finally {
        this.loading = false;
      }
    },


    handleError(error, action) {
      let errorMessage = `Произошла ошибка при ${action} пользователя`;

      if (error.response?.status === 403) {
        errorMessage = 'У вас нет прав для выполнения этого действия';
      } else if (error.response?.status === 404) {
        errorMessage = 'Пользователь не найден';
      } else if (error.response?.status === 409) {
        errorMessage = 'Конфликт данных. Возможно, пользователь уже изменен';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      this.toastError(errorMessage);
    },

    formatDate(date) {
      if (!date) return 'Неизвестно';
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
}
</script>

<style lang="postcss" scoped>

</style>