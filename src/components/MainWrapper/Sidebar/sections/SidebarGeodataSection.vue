<template>
    <SidebarSection>
        <template #header>
            <SidebarSectionHeader>Геоданные</SidebarSectionHeader>
        </template>

        <ul class="menu">
            <SidebarItem href="#/stops" screen="Stops">
                <template #icon>
                    <Icon :icon="['fas', 'shop']" fixed-width /> 
                </template>
                Остановки
            </SidebarItem>
            <SidebarItem href="#/routes" screen="Routes">
                <template #icon>
                    <Icon :icon="['fas', 'route']" fixed-width /> 
                </template>
                Маршруты
            </SidebarItem>
            <SidebarItem href="#/monitoring" screen="Monitoring">
              <template #icon>
                <Icon :icon="['fas', 'map']" fixed-width />
              </template>
              Мониторинг
            </SidebarItem>
        </ul>
    </SidebarSection>
</template>

<script>
import SidebarSection from '../sections/SidebarSection.vue';
import SidebarSectionHeader from './SidebarSectionHeader.vue';
import SidebarItem from '../parts/SidebarItem.vue';

export default {
    name: 'SidebarGeodataSection',

    components: {
        SidebarSection, 
        SidebarSectionHeader,
        SidebarItem
    }

}
</script>