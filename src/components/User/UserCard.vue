<template>
    <article :class="{ me: isCurrentUser }" class="apply p-4 flex items-center rounded-md bg-k-bg-secondary border border-k-border
      gap-3 transition-[border-color] duration-200 ease-in-out hover:border-white/15">
        <UserAvatar :user="user" width="48" />

        <main class="flex flex-col justify-between relative flex-1 gap-1">
            <h3 class="font-medium flex gap-2 items-center">
                <span v-if="user.name" class="name">{{ user.name }}</span>
                <span v-else class="name font-light text-k-text-secondary">Anonymous</span>
                <Icon v-if="isCurrentUser" :icon="['fas', 'circle-check']" class="you text-k-highlight" title="This is you!" />
                <Icon 
                    v-if="isAdmin()" 
                    :icon="['fas', 'shield']" 
                    class="is-admin text-k-primary"
                    title="User has admin privileges" />
             
            </h3>

            <p v-if="isAdmin()" class="text-k-text-secondary">Admin</p>
        </main>

        <div class="space-x-2">
                <BtnComponent highlight small @click="edit">
                    {{ isCurrentUser ? 'Ваш профиль' : 'Изменить' }}
                </BtnComponent>
                <BtnComponent v-if="!isCurrentUser" danger small @click="destroy">Удалить</BtnComponent>
        </div>
    </article>
</template>

<script>
import { useAuthorization, useDialogBox, useMessageToaster, useRouter } from '@/composables';
import { eventBus } from '@/utils';
import { mapActions } from 'vuex';

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
        const { currentUser } =  useAuthorization();
        const { go } = useRouter();
        const { showConfirmDialog } = useDialogBox();
        const {toastSuccess } = useMessageToaster();

        return {
            currentUser,
            go,
            showConfirmDialog,
            toastSuccess
        }
    },

    data() {
        return {
        }
    },

    computed: {
        isCurrentUser() { 
            return this.user.id === this.currentUser.id;
        }
    },

    methods: {

        ...mapActions('user', {
            userDestroy: 'destroy'
         }),

        isAdmin() {     
            return this.user.admin;
        },

        async edit() {
            if (this.isCurrentUser) {
                this.go('profile');
            } else {
                eventBus.emit('MODAL_SHOW_EDIT_USER_FORM', this.user);
            }
        },

        async destroy() {
            if (!await this.showConfirmDialog(`Удалить ${this.user.name}?`)) return;
            
            await this.userDestroy(this.user);
            this.toastSuccess(`Пользователь "${this.user.name}" удален.`);
        },

    }
}
</script>

<style scoped>

</style>