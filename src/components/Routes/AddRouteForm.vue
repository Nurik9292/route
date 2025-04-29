<template>
    <form class="max-w[540px]"  @submit.prevent="submit">
        <header class="gap-4">
            <h1>Добавить Маршрут</h1>
        </header>

        <TabsComponent class="mt-4">
            <TabList>
                <TabButton
                    id="addRouteTabDetails"
                    :selected="currentTab === 'details'"
                    aria-controls="addRoutePanelDetails"
                    @click="currentTab = 'details'"
                >
                    Данные
                </TabButton>
                <TabButton
                    id="addRouteTabFront"
                    :selected="currentTab === 'front'"
                    aria-controls="addRoutePanelFront"
                    @click="currentTab = 'front'"
                >
                    Маршрут Вперед
                </TabButton>
                <TabButton
                    id="addRouteTabBack"
                    :selected="currentTab === 'back'"
                    aria-controls="addRoutePanelBack"
                    @click="currentTab = 'back'"
                >
                    Маршрут Назад
                </TabButton>
                <TabButton
                    id="addRouteTabStopFront"
                    :selected="currentTab === 'stopFront'"
                    aria-controls="addRoutePanelStopFront"
                    @click="currentTab = 'stopFront'"
                >
                    Остановки Маршрута Вперед
                </TabButton>
                <TabButton
                    id="addRouteTabStopBack"
                    :selected="currentTab === 'stopBack'"
                    aria-controls="addRoutePanelStopBack"
                    @click="currentTab = 'stopBack'"
                >
                    Остановки Маршрута Назад
                </TabButton>
            </TabList>

            <TabPanelContainer>
                <TabPanel
                    v-show="currentTab === 'details'"
                    id="addRoutePanelDetails"
                    aria-labelledby="addRouteTabDetails"
                    class="space-y-5"
                >
                    <FormRow>
                        <template #label>Название</template>
                        <TextInput 
                            v-model="newRoute.name" 
                            v-focus name="name" 
                            title="Title" 
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <template #label>Номер</template>
                        <TextInput 
                            v-model="newRoute.number" 
                            v-focus 
                            min="1"
                            name="number"
                            type="number"
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <template #label>Интервал</template>
                        <TextInput 
                            v-model="newRoute.interval" 
                            v-focus 
                            min="1"
                            name="number"
                            type="number"
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <template #label>Город</template>
                        <SelectBox v-model="newRoute.cityId" v-focus name="cityId" title="City" required>
                            <option value="" disabled>Выберите...</option>
                            <option v-for="city in getCities" :key="city.id" :value="city.id">{{city.title}}</option>
                        </SelectBox>
                    </FormRow>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'front'"
                    id="addRouteTabFront"
                    aria-labelledby="addRouteTabFront"
                    class="space-y-5"
                >
                    <div class="map-container">
                        <GeoMap ref="geoMapFront" @create="createToPoint"/> 
                    </div>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'back'"
                    id="addRouteTabBack"
                    aria-labelledby="addRouteTabBack"
                    class="space-y-5"
                >
                    <div class="map-container">
                        <GeoMap ref="geoMapBack" @create="createFromPoint"/> 
                    </div>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'stopFront'"
                    id="addRouteTabStopFront"
                    aria-labelledby="addRouteTabStopFront"
                    class="space-y-5"
                >
                    <PickList v-model="stopsTo"  dataKey="id" breakpoint="1400px">
                        <template #option="{ option  }">
                            {{ option.name }}
                        </template>
                    </PickList>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'stopBack'"
                    id="addRouteTabStopBack"
                    aria-labelledby="addRouteTabStopBack"
                    class="space-y-5"
                >
                    <PickList v-model="stopsFrom"  dataKey="id" breakpoint="1400px">
                        <template #option="{ option  }">
                            {{ option.name }}
                        </template>
                    </PickList>
                </TabPanel>
            </TabPanelContainer>
        </TabsComponent>

        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Сохранить</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Отмена</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { isEqual } from 'lodash';
import { useDialogBox, useErrorHandler, useMessageToaster, useModal, useOverlay } from '@/composables';

import TabsComponent from '../Ui/Tabs/TabsComponent.vue';
import TabList from '../Ui/Tabs/TabList.vue';
import TabButton from '../Ui/Tabs/TabButton.vue';
import TabPanel from '../Ui/Tabs/TabPanel.vue';
import TabPanelContainer from '../Ui/Tabs/TabPanelContainer.vue';
import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import GeoMap from '../Map/GeoMap.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'AddRouteForm',

    components: {
        TabsComponent,
        TabList,
        TabButton,
        TabPanel,
        TabPanelContainer,
        FormRow,
        TextInput,
        BtnComponent,
        GeoMap,
        SelectBox
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const { showConfirmDialog } = useDialogBox();
        const { getFromContext } = useModal();
        const errorHandler = useErrorHandler('dialog');


        return {
            showConfirmDialog,
            showOverlay,
            hideOverlay,
            toastSuccess,
            getFromContext,
            errorHandler
        }
    },

    data() {
        return {
            newRoute: {
                name: '',
                number: '',
                interval: '',
                toPoints: [],
                fromPoints: [],
                toStops: [],
                fromStops: [],
                cityId: '',
            },
            stopsTo: [[],[]],
            stopsFrom: [[],[]],
            currentTab: 'details',
            
        }
    },

    watch: {
        currentTab(newTab) {
            if (newTab === 'front') {
                this.$nextTick(() => {
                    this.$refs.geoMapFront.invalidateMapSize();
                });
            }
            if (newTab === 'back') {
                this.$nextTick(() => {
                    this.$refs.geoMapBack.invalidateMapSize();
                });
            }
        },

        getStops: {
            immediate: true,
            handler(newStops) {  
                this.stopsTo[0] = newStops;
                this.stopsFrom[0] = newStops;
            }
        }
    },

    mounted() {
        this.fetchAll();
        document.addEventListener('keydown', this.handleKeydown);
    },

    beforeUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    },

    computed: {
        ...mapGetters('stops', ['getStops']),
        ...mapGetters('cities', ['getCities'])
    },


    methods: {

        ...mapActions('routes', ['store']),

        ...mapActions('stops', ['fetchAll']),

        ...mapActions('cities', ['fetchAll']),

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.close();
            }
        },

        createToPoint(value) {
           this.newRoute.toPoints = value; 
        },

        createFromPoint(value) {
           this.newRoute.fromPoints = value; 
        },

        async submit() {
            this.showOverlay();     
            try {
                const toIds = this.stopsTo[1].map(item => item.id);
                const fromIds = this.stopsFrom[1].map(item => item.id);
                this.newRoute.toStops = toIds;
                this.newRoute.fromStops = fromIds;
                this.store(this.newRoute);
                this.toastSuccess(`Новый маршрут "${this.newRoute.name}" создан.`);
                this.close();
            } catch (error) {
                this.errorHandler.handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },
      
        async maybeClose() {
            const emptyRouteData = {
                name: '',
                number: ''
            };

            if (isEqual(this.newRoute, emptyRouteData)) {
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


<style lang="postcss" scoped>
.mixed {
  @apply opacity-50;
}

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