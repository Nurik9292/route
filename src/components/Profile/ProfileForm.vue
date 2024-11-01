<template>
    <form data-testid="update-profile-form" @submit.prevent="update">

        <div class="flex flex-col gap-3 md:flex-row md:gap-8 w-full md:w-[640px]">
            <div class="flex-1 space-y-5">
                <FormRow>
                    <template #label>Текущий Пароль</template>
                    <TextInput v-model="profile.current_password" v-koel-focus data-testid="currentPassword"
                        name="current_password" 
                        placeholder="Требуется обновить ваш профиль" 
                        required
                        type="password" />
                </FormRow>

                <FormRow>
                    <template #label>Имя</template>
                    <TextInput v-model="profile.name" data-testid="name" name="name" />
                </FormRow>

               
                <FormRow >
                    <template #label>Новый Пароль</template>
                    <PasswordField v-model="profile.new_password" autocomplete="new-password" data-testid="newPassword"
                        minlength="10" placeholder="Оставьте пустым, чтобы сохранить текущий пароль" />
                    <template #help>Мин. 10 персонажей. Должно представлять собой смесь символов, цифр и символов.</template>
                </FormRow>
            </div>

            <div>
                <EditableProfileAvatar :profile="profile" />
            </div>
        </div>

        <footer class="mt-8">
            <BtnComponent class="btn-submit" type="submit">Сохранить</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { authService } from '@/services';
import { useAuthorization, useErrorHandler, useMessageToaster } from '@/composables';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import PasswordField from '../Ui/Form/PasswordField.vue';
import EditableProfileAvatar from './EditableProfileAvatar.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
    name: 'ProfileForm',

    components: {
        BtnComponent,
        PasswordField,
        EditableProfileAvatar,
        TextInput,
        FormRow,
    },

    data() {
        return {
            profile: {
                name: '',
                avatar: null,
                current_password: null,
                new_password: ''
            },
        
        }
    },

    computed: {
        currentUser() {
            return useAuthorization().currentUser.value;
        }
    },

    methods: {
        async update() {
            const { toastSuccess } = useMessageToaster();


            try {
                await authService.updateProfile(Object.assign({}, this.profile));
                this.profile.current_password = null;
                delete this.profile.new_password;
                toastSuccess('Профиль обновлен.');
            } catch (error) {
                useErrorHandler('dialog').handleHttpError(error);
            }
        },

        initializeProfile() {
            this.profile = {
                name: this.currentUser.name,
                avatar: this.currentUser.avatar,
                current_password: null
            }
        }
    },

    mounted() {
        this.initializeProfile()
    }
}
</script>