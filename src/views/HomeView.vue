<template>
    <BaseView id="homeWrapper">
        <template #header>
            <ScreenHeader layout="expanded">
                {{ greeting }}

                <template #thumbnail>
                    <ThumbnailStack :thumbnails="thumbnails" />
                </template>
            
            </ScreenHeader>
        </template>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ThumbnailStack from '@/components/Ui/ThumbnailStack.vue';

import { sample } from 'lodash';
import { useRouter } from '@/composables';

export default {
    name: 'HomeView',

    components: {
        BaseView,
        ScreenHeader,
        ThumbnailStack
    },

    data() {
        return {
            greetings: [
                'Добро пожалвать в админ панель %s',
            ],
            initialized: false,
            loading: false,
            thumbnails: []
        }
    },

    computed: {
        greeting() {
            const greeting = sample(this.greetings);
            return greeting ? greeting.replace('%s', 'Admin') : '';
        }
    },

    mounted() {
        useRouter().onScreenActivated('Home', async () => {
            if (!this.initialized) {
                this.loading = true;
                try {
                //   await overviewStore.fetch();
                  this.initialized = true;
                } catch (error) {
                //   useErrorHandler('dialog').handleHttpError(error);
                console.log(error);
                
                } finally {
                  this.loading = false;
                }
            }
        });
    }
    
}
</script>