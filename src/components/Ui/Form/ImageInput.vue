<template>
    <div class="flex flex-col items-center">
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
        />
        
        <div
            v-if="value"
            class="w-96 h-96 bg-cover bg-center border border-gray-300 rounded-md cursor-pointer"
            @click="triggerFileInput"
            :style="{ backgroundImage: `url(${value})` }"
        ></div>
        
        <div
            v-else
            class="w-96 h-96 flex justify-center items-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-md text-gray-500 text-sm cursor-pointer"
            @click="triggerFileInput"
        >
            Нажмите для загрузки
        </div>
    </div>
</template>

<script>
export default {
    name: "ImageInput",

    props: {
        modelValue: {
            type: String,
            default: null
        }
    },

    emits: ["update:modelValue"],

    computed: {
        value: {
            get() {
                return this.modelValue;
            },
            set(newValue) {
                this.$emit("update:modelValue", newValue);
            }
        }
    },

    methods: {
        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }
    }
};
</script>
