<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed">
                Сотрудники

                <template #controls>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddUserForm">
                            <Icon :icon="['fas', 'plus']" />
                            Добавить
                        </BtnComponent>
                    </BtnGroup>
                </template>
            </ScreenHeader>
        </template>

        <ul class="space-y-3">
            <li v-for="user in sortedUsers" :key="user.id">
              <UserCard :user="user" />
            </li>
        </ul>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import UserCard from '@/components/User/UserCard.vue';

import { useAuthorization } from '@/composables';
import { eventBus } from '@/utils';
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'UserView',

    components: {
        BaseView,
        ScreenHeader,
        BtnGroup,
        BtnComponent,
        UserCard
    },

    data() {
        return {
            currentUser: useAuthorization().currentUser,
        
        }
    },

    computed: {
        ...mapGetters('user', ['users']),

        sortedUsers() {
            return this.users
                .sort((a, b) => 
                    a.id === this.currentUser.id ? -1 :
                    b.id === this.currentUser.id ? 1 :
                    a.name.localeCompare(b.name)
                );
        }


    },

    mounted() {
        this.fetchUsers();
    },

    methods: {
        ...mapActions('user', [
            'fetchUsers',
        ]),

        showAddUserForm() {
            eventBus.emit('MODAL_SHOW_ADD_USER_FORM');
        },
    },

   


}
</script>

<style lang="postcss" scoped>
.invited-heading-decoration {
  @apply relative flex-1 before:absolute before:top-1/2;
  @apply before:left-0 before:right-0 before:h-px before:opacity-20 before:bg-k-text-secondary;
}
</style>
