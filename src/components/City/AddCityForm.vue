<template>
    <form @submit.prevent="submit">
        <header>
            <h1>Добавить Город</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Название</template>
                <TextInput v-model="newCity.title" v-focus name="title" title="Title" required/>
            </FormRow>
        </main>

        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Save</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Cancel</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
    name: 'AddCityForm',

    components: {
        FormRow, TextInput, BtnComponent
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
            newCity: {
                title: '',
            },
        
        }
    },

    mounted() {
        document.addEventListener('keydown', this.handleKeydown);
    },

    beforeUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {

       

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.close();
            }
        },

        async submit() {
            this.showOverlay();

            try {
                this.toastSuccess(`Новый город "${this.newCity.title}" создан.`);
                this.close();
            } catch (error) {
                this.errorHandler.handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        async maybeClose() {
            
            const emptyCityData = {
                title: '',
            };

            if (isEqual(this.newCity, emptyCityData)) {
                this.close();
                return;
            }

            if (await  this.showConfirmDialog('Отменить все изменения?')) {
                this.close();
            }
        },

        close() {
            this.$emit('close');
        },

    }
}
</script>
