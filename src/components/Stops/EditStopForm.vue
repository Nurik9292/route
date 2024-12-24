<template>
    <form @submit.prevent="submit">
        <header>
            <h1>Изменить Остановку</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Название</template>
                <TextInput v-model="updateData.name" v-focus name="name" title="Title" required/>
            </FormRow>
            <FormRow>
                <template #label>Город</template>
                <SelectBox v-model="updateData.cityId" v-focus name="cityId" title="City" required>
                    <option v-for="city in getCities" :key="city.id" :value="city.id">{{city.title}}</option>
                </SelectBox>
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
            <BtnComponent class="BtnComponent-add" type="submit">Обновить</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Отмена</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay, useModal } from '@/composables';
import { isEqual, omit } from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { reactive } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import MapComponent from '../Map/MapComponent.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';

export default {
    name: 'EditStopForm',

    components: {
        FormRow, TextInput, BtnComponent, MapComponent, SelectBox
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
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            cityId: stop.cityId
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

    computed: {
        ...mapGetters('cities', ['getCities'])
    },

    mounted() {
        this.fetchAll();
        document.addEventListener('keydown', this.handleKeydown);
    },

    beforeUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    },


    methods: {
        ...mapActions('stops', ['update']),

        ...mapActions('cities', ['fetchAll']),

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.maybeClose();
            }
        },


        async submit() {
            this.showOverlay();
            try {
                console.log(this.updateData);
                
                const stopId = this.updateData.id;
                const data = omit(this.updateData, 'id');
                await this.update({stopId, data});
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