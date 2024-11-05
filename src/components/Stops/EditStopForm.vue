<template>
    <form @submit.prevent="submit" @keydown.esc="maybeClose">
        <header>
            <h1>Изменить Остановку</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Название</template>
                <TextInput v-model="updateData.title" v-focus name="title" title="Title" required/>
            </FormRow>
            <FormRow :cols="2">
                <template #label1>Широта</template>
                <template #label2>Долгота</template>
                <TextInput v-model="updateData.lat" v-focus name="lat" title="Lat" required/>
                <TextInput v-model="updateData.lng" v-focus name="lng" title="Lng" required/>
            </FormRow>
            <div class="map-container">
               <MapComponent :initialIcon="icon" @update:icon="updateIcon"/>
            </div>
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
import MapComponent from '../Map/MapComponent.vue';

export default {
    name: 'EditStopForm',

    components: {
        FormRow, TextInput, BtnComponent, MapComponent
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const errorHandler = useErrorHandler('dialog');
        const { showConfirmDialog } = useDialogBox();
        const { getFromContext, updateContext } = useModal();
        const stop = getFromContext('stop');
        
        
        const updateData = reactive({
            id: stop.id,
            title: stop.title,
            lat: stop.lat,
            lng: stop.lng
        });

        const icon = reactive({ lat: stop.lat, lng: stop.lng });        

        return {
            updateData,
            showOverlay,
            hideOverlay,
            toastSuccess,
            errorHandler,
            showConfirmDialog,
            icon,
            updateContext
        };
    },  


    methods: {
        ...mapActions('stops', ['update']),

        async submit() {
            this.showOverlay();
            try {
                await this.update({stopId: this.updateData.id, data: this.updateData});
                this.toastSuccess('Остановка обновлена');
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

        updateIcon(newIconPosition) {
            this.icon.lat = newIconPosition.lat; 
            this.icon.lng = newIconPosition.lng; 
            this.updateData.lat = newIconPosition.lat;
            this.updateData.lng = newIconPosition.lng;            
        }

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