<template>
    <article 
        :class="{ selected: item.selected }" 
        class="highlight city-item group text-k-text-secondary border-b border-k-border !max-w-full h-[64px] flex
        items-center transition-[background-color,_box-shadow] ease-in-out duration-200
        focus:rounded-md focus focus-within:rounded-md focus:ring-inset focus:ring-1 focus:!ring-k-accent
        focus-within:ring-inset focus-within:ring-1 focus-within:!ring-k-accent
        hover:bg-white/5 hover:ring-inset hover:ring-1 hover:ring-white/10 hover:rounded-md" data-testid="city-item"
        tabindex="0">
        <span class="track-number">
            <span  class="text-k-text-secondary">
                {{ item.city.id }}
            </span>
        </span>
        <span class="title-citiy flex flex-col gap-2 overflow-hidden">
            <span class="title text-k-text-primary !flex gap-2 items-center">
                {{ item.city.title }}
            </span>
            <span class="city"> Город </span>
        </span>
       
        <span class="action">
            <div class="space-x-2">
                <BtnComponent highlight small @click="edit">Изменить</BtnComponent>
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
        ...mapActions('cities', {
            cityDestroy: 'destroy'
        }),


       async edit() {
            eventBus.emit('MODAL_SHOW_EDIT_CITY_FORM', this.item.city);
        },

        async destroy() {
            if (!await this.showConfirmDialog(`Удалить Город ${this.item.city.title}?`)) return;
            
            await this.cityDestroy(this.item.city);
            this.toastSuccess(`Город "${this.item.city.title}" удален.`);
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
   

    .title-citiy {
        span {
           @apply overflow-hidden whitespace-nowrap text-ellipsis block;
        }
    }

    button {
        @apply text-current;
    }
}
</style>