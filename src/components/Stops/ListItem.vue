<template>
    <article 
        :class="{ playing, external, selected: true }" 
        class="stop-item group text-k-text-secondary border-b border-k-border !max-w-full h-[64px] flex
        items-center transition-[background-color,_box-shadow] ease-in-out duration-200
        focus:rounded-md focus focus-within:rounded-md focus:ring-inset focus:ring-1 focus:!ring-k-accent
        focus-within:ring-inset focus-within:ring-1 focus-within:!ring-k-accent
        hover:bg-white/5 hover:ring-inset hover:ring-1 hover:ring-white/10 hover:rounded-md" data-testid="stop-item"
        tabindex="0">
        <span class="track-number">
            <span  class="text-k-text-secondary">
                1
            </span>
        </span>
        <span class="title-stop flex flex-col gap-2 overflow-hidden">
            <span class="title text-k-text-primary !flex gap-2 items-center">
                Test
            </span>
            <span class="stop"> test </span>
        </span>
       
        <template>
       
          
        </template>
      
    </article>
</template>

<script>
import { faPodcast } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'vuex'
import { requireInjection, secondsToHis } from '@/utils'
import { StopListConfigKey } from '@/symbols'

import ItemBars from '../Ui/ItemBars.vue'

export default {
    name: 'ListItem',

    components: {
        ItemBars,
    },

    props: {
        item: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            faPodcast
        }
    },

    computed: {
        ...mapState({
            config: () => requireInjection(StopListConfigKey, [{}])[0]
        }),

        // currentUser() {
        //     return useAuthorization().currentUser
        // },

        isPlus() {
            return useKoelPlus().isPlus
        },

        playable() {
            // return this.item.playable
        },

        playing() {
            // return ['Playing', 'Paused'].includes(this.playable.playback_state)
            return 'Playing';
        },

        external() {
            // return iStop(this.playable);
            return false;
        },

        fmtLength() {
            return secondsToHis(this.playable.length)
        },

     

        collaborator() {
            return (this.playable.collaboration || {}).user
        }
    },

    methods: {
        play() {
            this.$emit('play', this.playable)
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

    &.playing {

        .title {
            @apply text-k-accent !important;
        }
    }

    .title-stop {
        span {
           @apply overflow-hidden whitespace-nowrap text-ellipsis block;
        }
    }

    button {
        @apply text-current;
    }
}
</style>