<template>
    <div class="w-full h-full fixed top-0 left-0 flex items-center justify-center z-[99] bg-black/70">
        <div class="relative max-w-full max-h-full rounded-md flex">
            <Cropper ref="cropper" :max-width="config.maxWidth" :min-width="config.minWidth" :src="source"
                :stencil-props="{ aspectRatio: 1 }" />
            <div class="fixed top-6 right-6 flex flex-1 gap-2">
                <BtnComponent success @click.prevent="crop">Crop</BtnComponent>
                <BtnComponent transparent @click.prevent="emitCancel">Cancel</BtnComponent>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
    name: 'ImageCropper',

    components: {
        Cropper,
        BtnComponent
    },
    
    props: {
        source: {
            type: String,
            default: null
        },
        config: {
            type: Object,
            default: () => ({
                minWidth: 192,
                maxWidth: null
            })
        }
    },
    
    emits: ['crop', 'cancel'],

    data() {
        return {
            cropper: ref(null)
        }
    },
    methods: {
        crop() {
            const result = this.cropper.getResult()?.canvas.toDataURL();
            if (result) {
                this.$emit('crop', result);
            }
        },

        emitCancel() {
            this.$emit('cancel');
        }
    }
}
</script>

<style scoped>
@import 'vue-advanced-cropper/dist/style.css';
</style>