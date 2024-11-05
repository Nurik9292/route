import { differenceBy, orderBy, sampleSize, take, throttle } from 'lodash';
import isMobile from 'ismobilejs';
import { computed, provide, reactive, ref } from 'vue';
import { arrayify, eventBus, provideReadonly } from '@/utils';
import { useFuzzySearch } from '@/composables';

import {
    StopListConfigKey,
    StopListContextKey,
    StopListSortOrderKey,
    StopsKey,
    SelectedStopsKey,
    StopListFilterKeywordsKey,
    StopListSortFieldKey
} from '@/symbols'


export const useStopList = (
  stops,
  context = {},
  config = {
    filterable: true,
    sortable: true,
    reorderable: false,
    collaborative: false,
    hasCustomOrderSort: false
  }
) => {
    
  const filterKeywords = ref('');
  config = reactive(config);
  context = reactive(context);
  const fuzzy = config.filterable ? useFuzzySearch(stops, ['title']) : null;
  const stopList = ref();
  const isPhone = isMobile.any;
  const selectedStops = ref([]);
  const headerLayout = ref('expanded');
  

  const onScrollBreakpoint = (direction) => {
    headerLayout.value = direction === 'down' ? 'collapsed' : 'expanded'
  };


  const applyFilter = throttle((keywords) => (filterKeywords.value = keywords), 200);

  const filteredStops = computed(() => {    
    if (!fuzzy) return stops.value;

    return sortField.value
      ? orderBy(fuzzy.search(filterKeywords.value), extendedSortFields.value, sortOrder.value)
      : fuzzy.search(filterKeywords.value)
  });


    


  const extendedSortFields = computed(() => {

    if (!sortField.value) return null;

    let extended = arrayify(sortField.value);

    if (sortField.value === 'track') {
      extended = ['disc', 'track', 'title']
    } 

    return extended
  });

 
  const sortField = ref((() => {
    if (!config.sortable) return null;
    return 'title'
  })());

  const sortOrder = ref('asc');

  const sort = (by = sortField.value, order = sortOrder.value) => {
    sortField.value = by
    sortOrder.value = order
  }

  eventBus.on('STOPS_DELETED', deletedStops => (stops.value = differenceBy(stops.value, deletedStops, 'id')))

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
      applyFilter,
      onScrollBreakpoint,
      sort
  }
}
