<template>
    <form @submit.prevent="submit">
        <header>
            <h1>Добавить Остановку</h1>
        </header>

        <main class="space-y-5">
            <FormRow >
                <template #label>Название</template>
                <TextInput v-model="newStop.name" v-focus name="name" title="Title" required/>
            </FormRow>
            <FormRow>
                <template #label>Город</template>
                <SelectBox v-model="newStop.cityId" v-focus name="cityId" title="City" required>
                    <option value="" disabled>Выберите...</option>
                    <option v-for="city in getCities" :key="city.id" :value="city.id">{{city.title}}</option>
                </SelectBox>
            </FormRow>
            <FormRow :cols="2">
                <template #label1>Широта</template>
                <template #label2>Долгота</template>
                <TextInput v-model="newStop.lat" v-focus name="lat" title="Lat" required/>
                <TextInput v-model="newStop.lng" v-focus name="lng" title="Lng" required/>
            </FormRow>
            <div class="map-container">
               <MapComponent :initialIcon="icon" @update:icon="updateIcon"/>
            </div>
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
import { mapActions, mapGetters } from 'vuex';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import MapComponent from '../Map/MapComponent.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';

export default {
    name: 'AddStopForm',

    components: {
        FormRow, TextInput, BtnComponent, MapComponent, SelectBox
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
            newStop: {
                name: '',
                lat: '',
                lng: '',
                cityId: ''
            },
            icon: { lat: 37.93585208752015, lng: 58.39120934103419 }
        }
    },

    watch: {
        'newStop.lat': function(newLat) { 
            this.icon = { ...this.icon, lat: parseFloat(newLat) || this.icon.lat };
        },
        'newStop.lng': function(newLng) {
            this.icon = { ...this.icon, lng: parseFloat(newLng) || this.icon.lng };
        }
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

        ...mapActions('stops', ['store']),

        ...mapActions('cities', ['fetchAll']),

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.maybeClose();
            }
        },

        async submit() {
            this.showOverlay();   
            try {
                await this.store(this.newStop);
                this.toastSuccess(`Новая остановка "${this.newStop.name}" создана.`);
                this.close();
            } catch (error) {
                this.errorHandler.handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        async maybeClose() {
            
            const emptyStopData = {
                name: '',
                lat: '',
                lng: '',
                cityId: ''
            };

            if (isEqual(this.newStop, emptyStopData)) {
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

        updateIcon(newIconPosition) {
            this.icon = newIconPosition; 
            this.newStop.lat = newIconPosition.lat;
            this.newStop.lng = newIconPosition.lng;            
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