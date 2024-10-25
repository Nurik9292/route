import Fuse from 'fuse.js';
import { isRef, watch, ref } from 'vue';

export const useFuzzySearch = (items, keys) => {
  const fuse = new Fuse([], { keys });
  let documents = items;

  const setDocuments = (newDocuments) => {
    documents = newDocuments;
    fuse.setCollection(documents);
  };

  if (isRef(items)) {
    fuse.setCollection(items.value);
    watch(items, () => setDocuments(items.value));
  } else {
    setDocuments(items);
  }

  const search = (query) => {
    query = query?.trim() ?? null;

    return query ? fuse.search(query).map(result => result.item)
      : isRef(documents) ? documents.value : documents;
  };

  return {
    search,
    setDocuments,
  };
};
