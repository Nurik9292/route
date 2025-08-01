<template>
    <a
        v-tooltip.left
        class="view-profile rounded-full"
        data-testid="view-profile-link"
        href="/#/profile"
        title="Profile and preferences"
    >
        <UserAvatar 
            :user="currentUser"
            class="p-0.5 border border-solid border-white/10 transition duration-200 ease-in-out hover:border-white/30 active:scale-95"
            width="40"
        />
    </a>
</template>

<script>
import AdminAvatar from '@/components/Admin/AdminAvatar.vue';
import { mapGetters } from 'vuex';

export default {
    name: 'ProfileAvatar',

    components: {
        UserAvatar: AdminAvatar
    },

    computed: {
        ...mapGetters('user', ['currentUser'])
    },

}
</script>