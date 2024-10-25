<template>
    <div
        ref="wrapper"
        class="song-list-wrap relative flex flex-col flex-1 overflow-auto py-0 px-3 md:p-0"
        data-testid="song-list"
        tabindex="0"
        @keydown.delete.prevent.stop="handleDelete"
        @keydown.enter.prevent.stop="handleEnter"
        @keydown.a.prevent="handleA"
    >
        <div
            :class="config.sortable ? 'sortable' : 'unsortable'"
            class="song-list-header flex z-[2] bg-k-bg-secondary"
        >

        </div>
    </div>
</template>

<script>
import { requireInjection } from '@/utils';

export default {
    name: 'TableList',

}
</script>