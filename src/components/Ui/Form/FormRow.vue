<template>
    <label v-if="cols === 1" class="flex flex-col gap-2 text-[1.1rem]">
        <span v-if="$slots.label">
            <slot name="label" />
        </span>
        <slot />
        <span v-if="$slots.help" class="text-[.95rem] opacity-70 mt-1.5">
            <slot name="help" />
        </span>
    </label>

    <div v-else :class="columnClass" class="grid gap-3">
        <span v-if="$slots.label1">
            <slot name="label1" />
        </span>
        <span v-if="$slots.label2">
            <slot name="label2" />
        </span>
        <slot />
    </div>
</template>

<script>
export default {
    
    name: 'FormRow',


    props: {
        cols: {
            type: Number,
            default: 1,
        },
    },

    computed: {
        columnClass() {
            
            switch (this.cols) {
                case 1:
                    return 'grid-cols-1';
                case 2:
                    return 'md:grid-cols-2';
                case 3:
                    return 'md:grid-cols-3';
                case 4:
                    return 'md:grid-cols-4';
                default:
                    throw new Error('Only 1-4 columns are supported');
            }
        },
    },
};
</script>