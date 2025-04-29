<template>
    <article 
        :class="{ selected: item.selected }" 
        class="highlight banner-item group text-k-text-secondary border-b border-k-border !max-w-full h-[64px] flex
        items-center transition-[background-color,_box-shadow] ease-in-out duration-200
        focus:rounded-md focus focus-within:rounded-md focus:ring-inset focus:ring-1 focus:!ring-k-accent
        focus-within:ring-inset focus-within:ring-1 focus-within:!ring-k-accent
        hover:bg-white/5 hover:ring-inset hover:ring-1 hover:ring-white/10 hover:rounded-md"
        tabindex="0">
        <span class="track-number">
            <span  class="text-k-text-secondary">
                {{ item.banner.id }}
            </span>
        </span>
        <span class="image-banner flex flex-col gap-2 overflow-hidden">
            <img 
            :src="bannerUrl(item.banner.urlImage)" 
            alt="Not found" 
            class="w-16 h-16 object-cover rounded"
            >
        </span>
       
        <span class="action">
            <div class="space-x-2">
                <BtnComponent danger small @click="destroy">Удалить</BtnComponent>
            </div>
        </span>
      
    </article>
</template>

<script>
import { mapActions } from 'vuex';
import {  eventBus } from '@/utils'
import { useDialogBox, useMessageToaster } from "@/composables";

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import ItemBars from '../Ui/ItemBars.vue'

export default {
    name: 'ListItem',

    components: {
        ItemBars, BtnComponent
    },

    props: {
        item: {
            type: Object,
            required: true
        }
    },

    setup() {
        const { showConfirmDialog } = useDialogBox();
        const {toastSuccess } = useMessageToaster();

        return {
            showConfirmDialog,
            toastSuccess
        }
    },

    computed: {
     
        currentUser() {
            return useAuthorization().currentUser;
        },
    },


    methods: {
        ...mapActions('banners', {
            bannerDestroy: 'destroy'
        }),

        bannerUrl(image) {

            return 'http://localhost:8081/admin/banners/image/' + image;
        },


        async destroy() {
            if (!await this.showConfirmDialog(`Удалить баннер?`)) return;
            
            await this.bannerDestroy(this.item.banner);
            this.toastSuccess(`Баннер удален.`);
        }
    }

}
</script>

<style lang="postcss" scoped>
article {
    &.droppable {
        @apply relative transition-none after:absolute after:w-full after:h-[3px] after:rounded after:bg-k-success after:top-0;

        &.dragover-bottom {
            @apply after:top-auto after:bottom-0;
        }
    }

    &.selected {
        @apply bg-white/10;
    }


    &.highlight {
        .title, .track-number {
          @apply text-k-accent !important;
        }
      }
   

    .image-banner {
        span {
           @apply overflow-hidden whitespace-nowrap text-ellipsis block;
        }
    }

    button {
        @apply text-current;
    }
}
</style>