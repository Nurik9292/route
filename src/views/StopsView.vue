<template>
    <BaseView>
        <template #header>
            <ScreenHeader :layout="layouts()">
                Остановки

                <template #thumbnail>
                    <ThumbnailStack :thumbnails="thumbnails" />
                </template>

                <template v-if="totalStopCount" #meta>
                    <span>{{ pluralize(totalStopCount, 'stops') }}</span>
                </template>

                <template #controls>
                    <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
                        <ListFilter  v-if="totalStopCount && !isPhone" />
                    </div>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddUserForm">
                          <Icon :icon="['fas', 'plus']" />
                          Add
                        </BtnComponent>
                      </BtnGroup>
                </template>
            </ScreenHeader>
            
            <ListSkeleton v-if="showSkeletons" class="-m-6"/>
            <template v-else>
                
            </template>

        </template>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ThumbnailStack from '@/components/Ui/ThumbnailStack.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';

import { pluralize } from '@/utils';
import isMobile from 'ismobilejs';

export default {
    name: 'StopsView',

    components: {
        BaseView,
        ScreenHeader,
        ThumbnailStack,
        ListFilter,
        BtnGroup,
        BtnComponent,
        ListSkeleton
    },

    data() {
        return {
            totalStopCount: 1,
            initialized: false,
            loading: false,
            thumbnails: [],
            isPhone: isMobile.phone,
            showSkeletons: false
        }
    },

    computed: {
        showSkeletons()  {
            return this.loading && 0 === 0;
        }
    },

    methods: {
        
        fetchStops() {
            if (this.loading) return;
        },

        pluralize(count, singular) {
            return pluralize(count, singular);
        },

        layouts() { 
            return true ? 'collapsed' : 'expanded';
        }
    }
}
</script>

<style lang="postcss" scoped>
.collapsed .controls {
  @apply w-auto;
}
</style>