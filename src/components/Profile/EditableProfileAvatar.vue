<template>
    <div class="avatar-width ring-4 ring-white mt-8 rounded-full relative overflow-hidden aspect-square">
        <UserAvatar v-if="true" :user="profile" class="avatar-width" />

        <div class="absolute top-0 rounded-full w-full aspect-square flex items-center justify-center gap-2 pt-[50%]
        bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button class="control" title="Pick a new avatar" type="button" @click.prevent="openFileDialog">
                <Icon :icon="['fas', 'upload']" />
            </button>

            <button v-if="avatarChanged" class="control" title="Reset avatar" type="button"
                @click.prevent="resetAvatar">
                <Icon :icon="['fas', 'refresh']" />
            </button>

            <button v-else class="control" title="Remove avatar" type="button" @click.prevent="removeAvatar">
                <Icon :icon="['fas', 'times']" />
            </button>
        </div>

        <ImageCropper v-if="cropperSource" :source="cropperSource" @cancel="onCancel" @crop="onCrop" />
    </div>
</template>

<script>
import { useFileDialog } from '@vueuse/core';
import { useFileReader } from '@/composables';
import { mapGetters } from 'vuex';

import AdminAvatar from '@/components/Admin/AdminAvatar.vue';
import ImageCropper from '../Utils/ImageCropper.vue';

export default {
    name: 'EditableProfileAvatar',

    components: {
        UserAvatar: AdminAvatar,
        ImageCropper,
        
    },

    props: {
        profile: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            cropperSource: null,
        }
    },

    computed: {
        ...mapGetters('user',['currentUser']),

        avatarChanged() {
            return this.profile.avatar !== this.currentUser.avatar;
        }
    },
    methods: {
       
        openFileDialog() {
            this.open();
        },

        removeAvatar() {
            this.profile.avatar = null;
        },

        resetAvatar() {
            this.profile.avatar = this.currentUser.avatar;
            this.cropperSource = null;
        },

        onCrop(result) {
            this.profile.avatar = result;
            this.cropperSource = null;
        },

        onCancel() {
            this.cropperSource = null;
        }
    },

    created() {
        const { open, onChange } = useFileDialog({
            accept: 'image/*',
            multiple: false,
            reset: true
        });

        this.open = open;

        onChange(files => {
            if (!files?.length) {
                this.profile.avatar = this.currentUser.avatar;
                this.cropperSource = null;
                return;
            }

            useFileReader().readAsDataUrl(files[0], url => {
                this.cropperSource = url;
            })
        });
    },

}
</script>

<style lang="postcss" scoped>
@tailwind utilities;

@layer utilities {
    .control {
        @apply bg-black/5 w-[28px] aspect-square rounded-full px-2 py-1 hover:bg-black/70;
    }

    .avatar-width {
        @apply w-[105px]
    }
}
</style>