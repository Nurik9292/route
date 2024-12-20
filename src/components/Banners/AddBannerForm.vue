<template>
    <form @submit.prevent="submit">
        <header>
            <h1>Добавить Баннер</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Изображение</template>
                <ImageInput v-model="newBanner.banner" v-focus name="banner" title="Banner" required/>
            </FormRow>
        </main>

        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Сохранить</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Отмена</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';

import FormRow from '../Ui/Form/FormRow.vue';
import ImageInput from '../Ui/Form/ImageInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
    name: 'AddBannerForm',

    components: {
        FormRow, ImageInput, BtnComponent
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
            newBanner: {
                banner: '',
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
        
        ...mapActions('banners', ['store']),


        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.close();
            }
        },

        async submit() {
            this.showOverlay();
            console.log(this.newBanner);
            
            try {
                await this.store(this.newBanner);
                this.toastSuccess(`Новый баннер создан.`);
                this.close();
            } catch (error) {
                this.errorHandler.handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        async maybeClose() {
            
            const emptyBannerData = {
                image: '',
            };

            if (isEqual(this.newBanner, emptyBannerData)) {
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
