<template>
    <div class="skeleton">
        <div class="stop-list-header">
            <span class="track-number">
                <span class="text" />
            </span>
            <span class="title">
                <span class="text" />
            </span>
        </div>
        <div v-for="i in 40" :key="i" class="stop-item">
            <span class="track-number">
                <span class="text pulse" />
            </span>
            <span class="title">
                <span class="text pulse" />
            </span>
        </div>
    </div>
</template>

<script>

export default {
    name: 'ListSkeleton'
}
</script>

<style lang="postcss" scoped>
.stop-list-header {
    @apply h-[35px] flex bg-k-bg-secondary;
}

.stop-item {
    @apply flex h-[64px] border-b border-k-border;
}

.stop-list-header span span,
.pulse {
    @apply inline-block h-[1.2rem] rounded-full w-4/5;
}

.stop-list-header span span {
    @apply bg-white/10 w-2/5;
}

span:not(.text) {
    @apply p-[8px] align-middle;
}

.track-number {
    @apply basis-[66px] pl-[24px];
}

.title {
    @apply flex items-center gap-3 flex-1;
}

@media screen and (max-width: 768px) {
    span {
        @apply hidden;
    }

    .title {
        @apply flex;
    }

    .text {
        @apply w-full;
    }

    .stop-list-header,
    .stop-item {
        @apply py-0 px-[16px];
    }
}
</style>