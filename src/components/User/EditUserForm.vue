<template>
    <form data-testid="edit-user-form" @submit.prevent="submit" @keydown.esc="maybeClose">
        <header>
            <h1>Изменить Сотрудника</h1>
        </header>

        <main class="space-y-5">
        
            <FormRow>
                <template #label>Имя</template>
                <TextInput v-model="updateData.name" v-focus name="name" required title="Name" />
            </FormRow>
            <FormRow>
                <template #label>Пароль</template>
                <TextInput v-model="updateData.password" autocomplete="new-password" name="password"
                    placeholder="Оставьте пустым, чтобы не было изменений" title="Password" type="password" />
                <template #help>Мин. 10 персонажей. Должно представлять собой смесь букв, цифр и символов.</template>
            </FormRow>
            <FormRow>
                <div>
                    <CheckBox v-model="updateData.isAdmin" name="isAdmin" />
                    Пользователь является администратором
                    <TooltipIcon
                        title="Администраторы могут выполнять административные задачи, такие как управление пользователями и.т.д." />
                </div>
            </FormRow>
        </main>

        <footer>
            <BtnComponent class="BtnComponent-update" type="submit">Обновить</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Отмена</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { isEqual } from 'lodash';
import { reactive, watch } from 'vue';
import { useDialogBox, useErrorHandler, useModal, useMessageToaster, useOverlay } from '@/composables';
import { mapActions } from 'vuex';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import TooltipIcon from '../Ui/TooltipIcon.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
    name: 'EditUserForm',

    components: {
        BtnComponent,
        TooltipIcon,
        CheckBox,
        TextInput,
        FormRow
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const { showConfirmDialog } = useDialogBox();
        const user = useModal().getFromContext('user');
        const originalData = {
          name: user.name,
          isAdmin: user.isAdmin
        }

        return {
            showConfirmDialog,
            showOverlay,
            hideOverlay,
            toastSuccess,
            originalData,
            user
        }
    },

    data() {
        return {
          updateData: reactive({ ...this.originalData }),
        }
  },

    created() {
        watch(
            () => this.user,
            () => {
              this.originalData = {
                name: this.user.name,
                isAdmin: this.user.isAdmin
              }
              this.updateData = reactive({ ...this.originalData })
            },
            { immediate: true }
        )
    },

    methods: {
        ...mapActions('user', ['update']),

        async submit() {
            this.showOverlay();

            try {  
                await this.update({userId: this.user.id, data: this.updateData});
                this.toastSuccess('Пользователь обновлен');
                this.close();
            } catch (error) {
                useErrorHandler('dialog').handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        close() {
            this.$emit('close');
        },

        async maybeClose() {
            if (isEqual(this.originalData, this.updateData)) {
                this.close();
                return;
            }

            if (await this.showConfirmDialog('Отменить все изменения?')) {
                this.close();
            }
        }
    }
}
</script>