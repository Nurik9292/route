<template>
    <form @submit.prevent="submit">
        <header>
            <h1>Изменить Город</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Название</template>
                <TextInput v-model="updateData.title" v-focus name="title" title="Title" required/>
            </FormRow>
         
        </main>
        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Save</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Cancel</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay, useModal } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';
import { reactive } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
    name: 'EditCityForm',

    components: {
        FormRow, TextInput, BtnComponent
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const errorHandler = useErrorHandler('dialog');
        const { showConfirmDialog } = useDialogBox();
        const { getFromContext, updateContext } = useModal();
        const city = getFromContext('city');
        
        
        const updateData = reactive({
            id: city.id,
            title: city.title,
        });


        return {
            updateData,
            showOverlay,
            hideOverlay,
            toastSuccess,
            errorHandler,
            showConfirmDialog,
            updateContext
        };
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
                await this.update({stopId: this.updateData.id, data: this.updateData});
                this.toastSuccess('Город обновлен');
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
        },

     
    }
}

</script>


<style scoped>
.map-container {
    height: 60vh;
    width: 100%;
}

@media (max-width: 768px) {
    .map-container {
        height: 40vh; 
    }
}
</style>