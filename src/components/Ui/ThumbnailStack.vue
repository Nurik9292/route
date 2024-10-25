<template>
    <article
        :class="layout"
        :style="{ backgroundImage: `url(${defaultAvatar})` }"
        class="thumbnail-stack  aspect-square overflow-hidden grid bg-cover bg-no-repeat"
    >
        <span
            v-for="thumbnail in displayedThumbnails"
            :key="thumbnail"
            :style="{ backgroundImage: `url(${thumbnail}`}"
            class="block will-change-transform w-full h-full bg-cover bg-no-repeat"
            data-testid="thumbnail"
        /> 
        
    </article>
</template>

<script>
import { take } from 'lodash';
import { defaultLogo } from '@/utils';

export default {
    name: 'ThumbnailStack',

    props: {
        thumbnails: {
            type: Array,
            default: () => []
        }
    },

    computed: {
        displayedThumbnails() {
            console.log('test', defaultLogo);
            console.log(this.thumbnails.length === 0);
            
            return this.thumbnails.length === 0 
                ? [defaultLogo]
                : (this.thumbnails.length < 4 ? [this.thumbnails[0]] : take(this.thumbnails, 4)).map(url => url || defaultLogo);
        },

        layout() {
            return this.displayedThumbnails.length < 4 ? 'single' : 'tiles';
        }
    }


}
</script>

<style lang="postcss" scoped>
article {
  background-image: v-bind(defaultBackgroundImage);

  &.tiles {
    @apply grid-cols-2;
  }
}

article.thumbnail-stack {
    width: 100px;
    height: 100px;
  }
  
  article.tiles {
    grid-template-columns: repeat(2, 1fr);
  }
</style>
