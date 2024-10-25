<template>
    <SidebarSection>
        <template #header>
            <SidebarSectionHeader>Остальное</SidebarSectionHeader>
        </template>

        <ul class="menu">
            <SidebarItem href="#/cities" screen="Cities">
                <template #icon>
                    <Icon :icon="['fas', 'city']" fixed-width /> 
                </template>
                Города
            </SidebarItem>
            <SidebarItem href="#/users" screen="Users">
                <template #icon>
                    <Icon :icon="['fas', 'users']" fixed-width /> 
                </template>
                Сотрудники
            </SidebarItem>
        </ul>
    </SidebarSection>
</template>

<script>
import SidebarSection from './SidebarSection.vue';
import SidebarSectionHeader from './SidebarSectionHeader.vue';
import SidebarItem from '../parts/SidebarItem.vue';

export default {
    name: 'SidebarOtherSection',

    components: {
        SidebarSection, 
        SidebarSectionHeader,
        SidebarItem
    }

}
</script>