<template>
    <form class="max-w[540px]"  @submit.prevent="submit">
        <header class="gap-4">
            <h1>Изменить Маршрут</h1>
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
                        <TextInput v-model="updateData.title" v-focus name="title" title="Title"/>
                    </FormRow>
                    <FormRow>
                        <template #label>Номер</template>
                        <TextInput 
                            v-model="updateData.number" 
                            v-focus 
                            min="1"
                            name="number"
                            type="number"
                        />
                    </FormRow>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'front'"
                    id="addRouteTabFront"
                    aria-labelledby="addRouteTabFront"
                    class="space-y-5"
                >
                    <div class="map-container">
                        <GeoMap ref="geoMapFront2" /> 
                    </div>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'back'"
                    id="addRouteTabBack"
                    aria-labelledby="addRouteTabBack"
                    class="space-y-5"
                >
                    <div class="map-container">
                        <GeoMap ref="geoMapBack2" /> 
                    </div>
                </TabPanel>
                <TabPanel
                    v-show="currentTab === 'stopFront'"
                    id="addRouteTabStopFront"
                    aria-labelledby="addRouteTabStopFront"
                    class="space-y-5"
                >
                    <PickList v-model="stops"  dataKey="id" breakpoint="1400px">
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
                    <PickList v-model="stops"  dataKey="id" breakpoint="1400px">
                        <template #option="{ option  }">
                            {{ option.name }}
                        </template>
                    </PickList>
                </TabPanel>
            </TabPanelContainer>
        </TabsComponent>

        <footer>
            <BtnComponent class="BtnComponent-add" type="submit">Save</BtnComponent>
            <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose">Cancel</BtnComponent>
        </footer>
    </form>
</template>

<script>
import { isEqual } from 'lodash';
import { useDialogBox, useErrorHandler, useMessageToaster, useModal, useOverlay } from '@/composables';
import { reactive } from 'vue';

import TabsComponent from '../Ui/Tabs/TabsComponent.vue';
import TabList from '../Ui/Tabs/TabList.vue';
import TabButton from '../Ui/Tabs/TabButton.vue';
import TabPanel from '../Ui/Tabs/TabPanel.vue';
import TabPanelContainer from '../Ui/Tabs/TabPanelContainer.vue';
import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import GeoMap from '../Map/GeoMap.vue';


export default {

    name: 'EditRouteForm',

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
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const errorHandler = useErrorHandler('dialog');
        const { showConfirmDialog } = useDialogBox();
        const { getFromContext, updateContext } = useModal();
        const route = getFromContext('route');
        
        
        const updateData = reactive({
            id: route.id,
            title: route.title,
            number: route.number
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


    data() {
        return {
            stops: [
                [
                    {id: 1, name: 'test 1'},
                {id: 2, name: 'test 2'},
                {id: 3, name: 'test 3'},
                {id: 4, name: 'test 4'},
                {id: 5, name: 'test 5'},
                {id: 6, name: 'test 6'},
                {id: 7, name: 'test 7'},
                {id: 8, name: 'test 8'},
                {id: 9, name: 'test 9'},
                {id: 10, name: 'test 10'},
                {id: 11, name: 'test 11'},
                ],
                []
            ],
            currentTab: 'details',

        }
    },

    watch: {
        currentTab(newTab) {
            if (newTab === 'front') {
                this.$nextTick(() => {
                    this.$refs.geoMapFront2.invalidateMapSize();
                });
            }
            if (newTab === 'back') {
                this.$nextTick(() => {
                    this.$refs.geoMapBack2.invalidateMapSize();
                });
            }
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
                this.toastSuccess('Маршрут обновлен');
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