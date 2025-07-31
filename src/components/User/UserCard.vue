<template>
  <article :class="{ me: isCurrentUser }"
           class="admin-card p-4 flex items-center rounded-md bg-k-bg-secondary border border-k-border gap-3 transition-[border-color] duration-200 ease-in-out hover:border-white/15">

    <UserAvatar :user="user" width="48"/>

    <main class="flex flex-col justify-between relative flex-1 gap-1">
      <h3 class="font-medium flex gap-2 items-center">
        <span v-if="userName" class="name">{{ userName }}</span>
        <span v-else class="name font-light text-k-text-secondary">Без имени</span>

        <Icon v-if="isCurrentUser"
              :icon="['fas', 'circle-check']"
              class="you text-k-highlight"
              title="Это вы!"/>

        <Icon v-if="isUserAdmin"
              :icon="['fas', 'shield']"
              class="is-admin text-k-primary"
              title="Супер-администратор"/>
      </h3>

      <div class="user-details">
        <p v-if="isUserAdmin" class="text-k-text-secondary">
          Супер-администратор
        </p>
        <p v-else class="text-k-text-secondary">
          Администратор
        </p>

        <span v-if="!user.isActive"
              class="status-badge inactive">
                    Неактивен
                </span>
      </div>
    </main>

    <div class="actions space-x-2">
      <BtnComponent
          highlight
          small
          @click="edit"
          :disabled="loading">
        {{ isCurrentUser ? 'Ваш профиль' : 'Изменить' }}
      </BtnComponent>

      <BtnComponent
          v-if="!isCurrentUser && canDeleteUser"
          danger
          small
          @click="destroy"
          :disabled="loading">
        Удалить
      </BtnComponent>
    </div>
  </article>
</template>

<script>
import {useDialogBox, useMessageToaster, useRouter} from '@/composables';
import {eventBus} from '@/utils';
import {mapActions, mapGetters} from 'vuex';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import UserAvatar from './UserAvatar.vue';

export default {
  name: 'UserCard',

  components: {
    BtnComponent,
    UserAvatar,
  },

  props: {
    user: {
      type: Object,
      required: true
    }
  },

  setup() {
    const {currentUser} = useAuthorization();
    const {go} = useRouter();
    const {showConfirmDialog} = useDialogBox();
    const {toastSuccess, toastError} = useMessageToaster();

    return {
      currentUser,
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
    ...mapGetters('admin', ['currentUser']),

    isCurrentUser() {
      const current = this.currentUser;
      return current && this.user.id === current.id;
    },

    userName() {
      return this.user.fullName || this.user.name || this.user.username;
    },

    isUserAdmin() {
      return this.user.isSuperAdmin ||
          this.user.is_super_admin ||
          this.user.admin;
    },

    canDeleteUser() {
      const current = this.currentUser;
      return current &&
          (current.isSuperAdmin || current.is_super_admin || current.admin) &&
          this.user.id !== current.id;
    }
  },

  methods: {

    ...mapActions('admin', {
      deleteUser: 'destroy'
    }),

    async edit() {
      if (this.loading) return;

      if (this.isCurrentUser) {
        this.go('profile');
      } else {
        eventBus.emit('MODAL_SHOW_EDIT_USER_FORM', this.user);
      }
    },


    async destroy() {
      if (this.loading) return;

      const userName = this.userName || 'этого пользователя';

      const confirmed = await this.showConfirmDialog(
          `Удалить \${userName}?`,
          'Это действие нельзя отменить. Пользователь потеряет доступ к системе.'
      );

      if (!confirmed) return;

      this.loading = true;

      try {
        await this.deleteUser(this.user);
        this.toastSuccess(`Пользователь "\${userName}" удален успешно.`);

      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);

        let errorMessage = 'Произошла ошибка при удалении пользователя';

        if (error.response?.status === 403) {
          errorMessage = 'У вас нет прав для удаления этого пользователя';
        } else if (error.response?.status === 404) {
          errorMessage = 'Пользователь уже удален';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        this.toastError(errorMessage);

      } finally {
        this.loading = false;
      }
    },

  }
}
</script>

<style scoped>

</style>


//.admin-card.me {
//  @apply border-k-highlight bg-k-highlight/5;
//}
//
//.status-badge {
//  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
//}
//
//.status-badge.inactive {
//  @apply bg-red-100 text-red-800;
//}
//
//.actions {
//  @apply flex items-center;
//}
//
//.user-details {
//  @apply flex items-center gap-2;
//}