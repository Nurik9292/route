import { differenceBy, orderBy, sampleSize, take, throttle } from 'lodash';
import isMobile from 'ismobilejs';
import { computed, provide, reactive, ref } from 'vue';
import { arrayify, eventBus, provideReadonly } from '@/utils';
import { useFuzzySearch, useRouter } from '@/composables';

import {
    StopListConfigKey,
    StopListContextKey,
    StopListSortOrderKey,
    StopsKey,
    SelectedStopsKey,
    StopListFilterKeywordsKey,
    StopListSortFieldKey
} from '@/symbols'


export const useStopList = (stops, context = {}, config = {
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
    ]) : null;


    const stopList = ref()

    const isPhone = isMobile.phone;
    const selectedStops = ref([]);
    const showingControls = ref(false);
  
    const onScrollBreakpoint = (direction) => {
        headerLayout.value = direction === 'down' ? 'collapsed' : 'expanded';
    };

  
    const applyFilter = throttle((keywords) => (filterKeywords.value = keywords), 200);

    const sortField = ref((() => {
        if (!config.sortable) return null;
        if (isCurrentScreen('Stops')) return 'track';
        if (isCurrentScreen('Search.Stop')) return null;
        return 'title';
    })());

    const extendedSortFields = computed(() => {
        if (!sortField.value) return null;
        let extended = arrayify(sortField.value);
        return extended;
    })


    const filteredStops = computed(() => {
        if (!fuzzy) return stops.value;

        return sortField.value
            ? orderBy(fuzzy.search(filterKeywords.value), extendedSortFields.value, sortOrder.value)
            : fuzzy.search(filterKeywords.value);
    })

   
    const onPressEnter = async (event) => {
        if (selectedStops.value.length === 1) {
            await playbackService.play(selectedStops.value[0]);
            return;
        }

        event.shiftKey ? queueStore.queueToTop(selectedStops.value) : queueStore.queue(selectedStops.value);

        if (event.ctrlKey || event.metaKey) {
            await playbackService.play(selectedStops.value[0]);
        }

        go('queue');
    }

   
    const sortOrder = ref('asc');

    const sort = (by = sortField.value, order = sortOrder.value) => {
        sortField.value = by;
        sortOrder.value = order;
    };

    eventBus.on('SONGS_DELETED', deletedSongs => (playables.value = differenceBy(playables.value, deletedSongs, 'id')))

    provideReadonly(StopsKey, filteredStops, false)
    provideReadonly(SelectedStopsKey, selectedStops, false)
    provideReadonly(StopListConfigKey, config)
    provideReadonly(StopListContextKey, context)
    provideReadonly(StopListSortFieldKey, sortField)
    provideReadonly(StopListSortOrderKey, sortOrder)
    provide(StopListFilterKeywordsKey, filterKeywords)

    return {
        stopList,
        stops,
        config,
        context,
        sortField,
        sortOrder,
        selectedStops,
        isPhone,
        onPressEnter,        
        applyFilter,
        onScrollBreakpoint,
        sort
    }
}      