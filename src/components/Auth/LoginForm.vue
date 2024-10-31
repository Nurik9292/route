<template>
    <div class="flex items-center justify-center min-h-screen my-0 mx-auto flex-col gap-5">
        <form v-show="!showingForgotPasswordForm" :class="{ error: failed }"
            class="w-full sm:w-[288px] sm:border duration-500 p-7 rounded-xl border-transparent sm:bg-white/10 space-y-3"
            data-testid="login-form" @submit.prevent="login
            ">
            <div class="text-center mb-8">
                <img alt="Ugur logo" class="inline-block" :src="logo()" width="156" />
            </div>

            <FormRow>
                <TextInput v-model="name" autofocus placeholder="User name" required />
            </FormRow>

            <FormRow>
                <PasswordField v-model="password" placeholder="Password" required />
            </FormRow>

            <FormRow>
                <BtnComponent data-testid="submit" type="submit">Log In</BtnComponent>
            </FormRow>
        </form>
    </div>
</template>

<script>
import { authService } from '@/services';
import { logger } from '@/utils';
import { useMessageToaster } from '@/composables';
import { defaultLogo } from '@/utils';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import PasswordField from '../Ui/Form/PasswordField.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';


export default {
    name: 'LoginForm',

    components: {
        BtnComponent,
        PasswordField,
        TextInput,
        FormRow,
    },

    data() {
        return {
            name: '',
            password: '',
            failed: false,
            showingForgotPasswordForm: false,
            canResetPassword: window.MAILER_CONFIGURED,
            ssoProviders: window.SSO_PROVIDERS || [],
        };
    },

    methods: {
        
        showForgotPasswordForm() {
            this.showingForgotPasswordForm = true;
        },

        async login() {
            
            try {
                await authService.login(this.name, this.password);
                this.failed = false;

                this.password = '';

                this.$emit('loggedin');
            } catch (error) {
                this.failed = true;
                logger.error(error);
                window.setTimeout(() => (this.failed = false), 2000);
            }
        },

        onSSOError(error) {
            logger.error('SSO error: ', error);
            useMessageToaster().toastError('Login failed. Please try again.');
        },

        onSSOSuccess(token) {
            authService.setTokensUsingCompositeToken(token);
            this.$emit('loggedin');
        },

        logo() {
            return defaultLogo;
        }
    },
};
</script>

<style lang="postcss" scoped>
@keyframes shake {

    8%,
    41% {
        transform: translateX(-10px);
    }

    25%,
    58% {
        transform: translateX(10px);
    }

    75% {
        transform: translateX(-5px);
    }

    92% {
        transform: translateX(5px);
    }

    0%,
    100% {
        transform: translateX(0);
    }
}

form.error {
    @apply border-red-500;
    animation: shake .5s;
}
</style>