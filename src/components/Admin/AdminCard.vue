<template>
  <article :class="{ me: isCurrentAdmin }"
           class="admin-card p-4 flex items-center rounded-md bg-k-bg-secondary border border-k-border gap-3 transition-[border-color] duration-200 ease-in-out hover:border-white/15">

    <AdminAvatar :admin="admin" width="48"/>

    <main class="flex flex-col justify-between relative flex-1 gap-1">
      <h3 class="font-medium flex gap-2 items-center">
        <span v-if="adminName" class="name">{{ adminName }}</span>
        <span v-else class="name font-light text-k-text-secondary">Без имени</span>

        <Icon v-if="isCurrentAdmin"
              :icon="['fas', 'circle-check']"
              class="you text-k-highlight"
              title="Это вы!"/>

        <Icon v-if="isAdminSuper"
              :icon="['fas', 'shield']"
              class="is-admin text-k-primary"
              title="Супер-администратор"/>
      </h3>

      <div class="admin-details">
        <div class="flex items-center gap-2">
          <p v-if="isAdminSuper" class="text-k-text-secondary text-sm">
            Супер-администратор
          </p>
          <p v-else class="text-k-text-secondary text-sm">
            Администратор
          </p>

          <span v-if="!adminIsActive"
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
            Создан: {{ formatDate(admin.createdAt || admin.created_at) }}
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
          :class="adminIsActive ? 'warning' : 'success'"
          small
          @click="toggleStatus"
          :disabled="loading">
        {{ adminIsActive ? 'Деактивировать' : 'Активировать' }}
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
    AdminAvatar,
  },

  props: {
    admin: {
      type: Object,
      required: true
    }
  },

  emits: ['refresh'],

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

    adminIsActive() {
      return this.admin.isActive !== false && this.admin.is_active !== false;
    },

    isAdminSuper() {
      return this.admin.isSuperAdmin || this.admin.is_super_admin || this.admin.admin;
    },

    canDeleteAdmin() {
      return this.isSuperAdmin && !this.isCurrentAdmin;
    },

    canToggleStatus() {
      return this.isSuperAdmin && !this.isCurrentAdmin;
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
        eventBus.emit('MODAL_SHOW_EDIT_USER_FORM', this.admin);
      }
    },

    async toggleStatus() {
      if (this.loading) return;

      const action = this.adminIsActive ? 'деактивировать' : 'активировать';
      const confirmed = await this.showConfirmDialog(
          `${action.charAt(0).toUpperCase() + action.slice(1)} администратора?`,
          `Вы уверены, что хотите ${action} администратора "${this.adminName}"?`
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        if (this.adminIsActive) {
          await this.deactivateAdmin(this.admin.id);
          this.toastSuccess('Администратор деактивирован');
        } else {
          await this.activateAdmin(this.admin.id);
          this.toastSuccess('Администратор активирован');
        }

        this.$emit('refresh');
      } catch (error) {
        this.toastError(`Ошибка: ${error.message || 'Не удалось изменить статус'}`);
      } finally {
        this.loading = false;
      }
    },

    async destroy() {
      if (this.loading) return;

      const confirmed = await this.showConfirmDialog(
          'Удалить администратора?',
          `Вы уверены, что хотите удалить администратора "${this.adminName}"? Это действие нельзя отменить.`
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        await this.deleteAdmin(this.admin.id);
        this.toastSuccess('Администратор удален');
        this.$emit('refresh');
      } catch (error) {
        this.toastError(`Ошибка: ${error.message || 'Не удалось удалить администратора'}`);
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return format(date, 'dd.MM.yyyy', { locale: ru });
      } catch {
        return '';
      }
    },

    formatLastLogin(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true, locale: ru });
      } catch {
        return '';
      }
    }
  }
};
</script>

<style lang="postcss" scoped>
.admin-card.me {
  @apply border-k-primary/30 bg-k-primary/5;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.status-badge.active {
  @apply bg-green-100 text-green-800;
}

.status-badge.inactive {
  @apply bg-red-100 text-red-800;
}

.you {
  @apply text-k-highlight;
}

.is-admin {
  @apply text-k-primary;
}

.admin-details {
  @apply space-y-1;
}
</style>