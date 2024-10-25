<template>
    <ExtraDrawerButton  v-tooltip.left title="Log out" @click.prevent="logout">
        <Icon :icon="['fas', 'arrow-right-from-bracket']" />
    </ExtraDrawerButton>
</template>

<script>
import { eventBus } from '@/utils/eventBus';
import ExtraDrawerButton from './ExtraDrawerButton.vue';

export default {
    name: 'LogoutButton',

    components: {
        ExtraDrawerButton
    },

    methods: {
        logout() {
            eventBus.emit('LOG_OUT');
        }
    }
}
</script>