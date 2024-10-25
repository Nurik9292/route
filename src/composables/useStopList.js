import { differenceBy, orderBy, sampleSize, take, throttle } from 'lodash';
import isMobile from 'ismobilejs';
import { computed, provide, reactive, ref } from 'vue';
import { playbackService } from '@/services';
import { commonStore, queueStore, stopStore } from '@/stores';
import { arrayify, eventBus, getPlayableProp, provideReadonly, isStop } from '@/utils';
import { useFuzzySearch, useRouter } from '@/composables';

import {
    ListConfigKey,
    ObjectListContextKey,
    ListSortOrderKey,
    ObjectsKey,
    SelectedObjectKey,
    ListFilterKeywordsKey,
    ListSortFieldKey
} from '@/symbols'


export const useSongList = (objects, context = {}, config = {
    filterable: true,
    sortable: true,
    reorderable: false,
    collaborative: false,
    hasCustomOrderSort: false
}) => {


    const filterKeywords = ref('');
    config = reactive(config);
    context = reactive(context);

    const { isCurrentScreen, go } = useRouter();

    const fuzzy = config.filterable ? useFuzzySearch(objects, [
        'title',
        'stop_name',
    ]) : null;


    const stopList = ref()

    const isPhone = isMobile.phone;
    const selectedObject = ref([]);
    const showingControls = ref(false);
    const headerLayout = ref('expanded');

    const onScrollBreakpoint = (direction) => {
        headerLayout.value = direction === 'down' ? 'collapsed' : 'expanded'
    };

    const duration = computed(() => stopStore.getFormattedLength(objects.value))

    const downloadable = computed(() => {
        if (!commonStore.state.allows_download) return false
        if (playables.value.length === 0) return false
        return playables.value.length === 1 || commonStore.state.supports_batch_downloading
    })

    const thumbnails = computed(() => {
        const playablesWithCover = playables.value.filter(p => getPlayableProp(p, 'album_cover', 'episode_image'))

        const sampleCovers = sampleSize(playablesWithCover, 20)
            .map(p => getPlayableProp(p, 'album_cover', 'episode_image'))

        return take(Array.from(new Set(sampleCovers)), 4)
    })

    const getPlayablesToPlay = () => songList.value.getAllPlayablesWithSort()

    const playAll = (shuffle) => {
        playbackService.queueAndPlay(getPlayablesToPlay(), shuffle)
        go('queue')
    }

    const playSelected = (shuffle) => playbackService.queueAndPlay(selectedPlayables.value, shuffle)

    const applyFilter = throttle((keywords) => (filterKeywords.value = keywords), 200)

    const filteredPlayables = computed(() => {
        if (!fuzzy) return playables.value

        return sortField.value
            ? orderBy(fuzzy.search(filterKeywords.value), extendedSortFields.value, sortOrder.value)
            : fuzzy.search(filterKeywords.value)
    })

    const extendedSortFields = computed(() => {
        if (!sortField.value) return null

        let extended = arrayify(sortField.value)

        if (sortField.value === 'track') {
            extended = ['disc', 'track', 'title']
        } else if (sortField.value.includes('album_name') && !sortField.value.includes('disc')) {
            extended.push('artist_name', 'disc', 'track', 'title')
        } else if (sortField.value.includes('artist_name') && !sortField.value.includes('disc')) {
            extended.push('album_name', 'disc', 'track', 'title')
        }

        return extended
    })

    const onPressEnter = async (event) => {
        if (selectedPlayables.value.length === 1) {
            await playbackService.play(selectedPlayables.value[0])
            return
        }

        event.shiftKey ? queueStore.queueToTop(selectedPlayables.value) : queueStore.queue(selectedPlayables.value)

        if (event.ctrlKey || event.metaKey) {
            await playbackService.play(selectedPlayables.value[0])
        }

        go('queue')
    }

    const sortField = ref((() => {
        if (!config.sortable) return null
        if (isCurrentScreen('Artist', 'Album')) return 'track'
        if (isCurrentScreen('Search.Songs', 'Queue', 'RecentlyPlayed')) return null
        return 'title'
    })())

    const sortOrder = ref('asc')

    const sort = (by = sortField.value, order = sortOrder.value) => {
        sortField.value = by
        sortOrder.value = order
    }

    eventBus.on('SONGS_DELETED', deletedSongs => (playables.value = differenceBy(playables.value, deletedSongs, 'id')))

    provideReadonly(ObjectsKey, filteredPlayables, false)
    provideReadonly(SelectedObjectKey, selectedPlayables, false)
    provideReadonly(ListConfigKey, config)
    provideReadonly(ObjectListContextKey, context)
    provideReadonly(ListSortFieldKey, sortField)
    provideReadonly(ListSortOrderKey, sortOrder)

    provide(ListFilterKeywordsKey, filterKeywords)

    return {
        SongList,
        ControlsToggle,
        ThumbnailStack,
        songs: playables,
        config,
        context,
        downloadable,
        headerLayout,
        sortField,
        sortOrder,
        duration,
        thumbnails,
        songList,
        selectedPlayables,
        showingControls,
        isPhone,
        onPressEnter,
        playAll,
        playSelected,
        applyFilter,
        onScrollBreakpoint,
        sort
    }
}      