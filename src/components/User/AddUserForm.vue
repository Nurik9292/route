<template>
    <form @submit.prevent="submit" @keydown.esc="maybeClose">
        <header>
            <h1>Добавить Нового Сотрудника</h1>
        </header>

        <main class="space-y-5">
            <FormRow>
                <template #label>Имя</template>
                <TextInput 
                    v-model="newUser.name" 
                    v-focus name="name" 
                    required 
                    title="Name" 
                />
            </FormRow>
            <FormRow>
                <template #label>Парооль</template>
                <TextInput 
                    v-model="newUser.password" 
                    autocomplete="new-password" 
                    name="password" 
                    required
                    title="Password" 
                    type="password" 
                />
                <template #help>Мин. 10 персонажей. Должно представлять собой смесь букв, цифр и символов.</template>
            </FormRow>
            <FormRow>
                <div>
                    <CheckBox v-model="newUser.isAdmin" name="isAdmin" />
                    Пользователь является администратором
                    <TooltipIcon
                        title="Администраторы могут выполнять административные задачи, такие как управление пользователями и.т.д." 
                    />
                </div>
            </FormRow>
        </main>

        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Save</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Cancel</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { isEqual } from 'lodash';
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { mapActions } from 'vuex';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import TooltipIcon from '../Ui/TooltipIcon.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
    name: 'AddUserForm',

    components: {
        BtnComponent,
        TooltipIcon,
        CheckBox,
        TextInput,
        FormRow,
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const errorHandler = useErrorHandler('dialog');
        const { showConfirmDialog } = useDialogBox();
        return {
            showOverlay,
            hideOverlay,
            toastSuccess,
            errorHandler,
            showConfirmDialog
        }
    },

    data() {
        return {
            newUser: {
                name: '',
                password: '',
                isAdmin: false,
            },
        };
    },

    methods: {
        ...mapActions('user', ['store']),

        async submit() {
    
            this.showOverlay();

            try {
                this.store(this.newUser);
                this.toastSuccess(`Новый сотрудник "${this.newUser.name}" создан.`);
                this.close();
            } catch (error) {
                this.errorHandler.handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        close() {
            this.$emit('close');
        },

        async maybeClose() {
            
            const emptyUserData = {
                name: '',
                password: '',
                isAdmin: false,
            };

            if (isEqual(this.newUser, emptyUserData)) {
                this.close();
                return;
            }

            if (await  this.showConfirmDialog('Отменить все изменения?')) {
                this.close();
            }
        },
    },
};
</script>