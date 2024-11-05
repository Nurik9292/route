<template>
    <div 
        ref="scroller" 
        v-overflow-fade 
        class="virtual-scroller will-change-transform overflow-scroll"
        @scroll.passive="onScroll"
    >
        <div 
            :style="{ height: `${totalHeight}px` }" 
            class="will-change-transform overflow-hidden"
        >
            <div 
                :style="{ transform: `translateY(${offsetY}px)` }" 
                class="will-change-transform items-wrapper"
            >
                <slot v-for="item in renderedItems" :item="item" />
            </div>
        </div>
    </div>
</template>

<script>
import { ResizeObserver } from '@juggle/resize-observer';

export default {
    
    name: 'VirtualScroller',

    setup() {

    },


    props: {
        items: {
            type: Array,
            required: true
        },
        itemHeight: {
            type: Number,
            required: true
        }
    },

    data() {
        return {
            scroller: null,
            scrollerHeight: 0,
            renderAhead: 5,
            scrollTop: 0,
            observer: null
        }
    },

    computed: {
        totalHeight() {
            return this.items.length * this.itemHeight;
        },

        startPosition() {
            return Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.renderAhead)
        },

        offsetY() {
            return this.startPosition * this.itemHeight
        },

        renderedItems() {
            let count = Math.ceil(this.scrollerHeight / this.itemHeight) + 2 * this.renderAhead
            count = Math.min(this.items.length - this.startPosition, count)
            return this.items.slice(this.startPosition, this.startPosition + count)
        }
    },

    methods: {
        onScroll(e) {
            requestAnimationFrame(() => {
                this.scrollTop = e.target.scrollTop;
                this.$emit('scroll', e);

                if (this.scroller.scrollTop + this.scroller.clientHeight + this.itemHeight >= this.scroller.scrollHeight) {
                    this.$emit('scrolled-to-end');
                }
            })
        }
    },

    mounted() {
        if (this.$refs.scroller) {
            this.scroller = this.$refs.scroller;
            const obs = new ResizeObserver(entries => {            
                entries.forEach(entry => {
                    this.scrollerHeight = entry.contentRect.height;
                });
            });
                
            obs.observe(this.$refs.scroller);
            this.scrollerHeight = this.$refs.scroller.offsetHeight;
            this.observer = obs; 
        }
    },

    beforeUnmount() {
        this.observer.unobserve(this.$refs.scroller)
    }
}
</script>

<style lang="postcss" scoped>
.virtual-scroller {
    @supports (scrollbar-gutter: stable) {
        overflow: auto;
        scrollbar-gutter: stable;

        @media (hover: none) {
            scrollbar-gutter: auto;
        }
    }
}
</style>