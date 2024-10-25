import { logger } from "./logger";
import { isObject, without } from 'lodash';
import { inject, isRef, provide, readonly, shallowReadonly } from 'vue';

export const use = (value, cb) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }
  
    cb(value);
  };
  
  export const arrayify = (maybeArray) => {
    return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
  };
  
  export const noop = () => {};
  
  export const limitBy = (arr, count, offset = 0) => {
    return arr.slice(offset, offset + count);
  };
  
  export const provideReadonly = (key, value, deep = true, mutator) => {
    mutator = mutator || (v => (isRef(value) ? (value.value = v) : (value = v)));
  
    if (!isObject(value)) {
      logger.warn(`value cannot be made readonly: ${value}`);
      provide(key, [value, mutator]);
    } else {
      provide(key, [deep ? readonly(value) : shallowReadonly(value), mutator]);
    }
  };
  
  export const requireInjection = (key, defaultValue) => {
    const value = inject(key, defaultValue);
  
    if (typeof value === 'undefined') {
      throw new Error(`Missing injection: ${key.toString()}`);
    }
  
    return value;
  };
  
  export const dbToGain = (db) => {
    return Math.pow(10, db / 20) || 0;
  };
  
  export const moveItemsInList = (list, items, target, type) => {
    if (list.indexOf(target) === -1) {
      throw 'Target not found in list';
    }
  
    const subset = arrayify(items);
  
    const isTargetAdjacent = type === 'before'
      ? list.indexOf(subset[subset.length - 1]) + 1 === list.indexOf(target)
      : list.indexOf(subset[0]) - 1 === list.indexOf(target);
  
    if (isTargetAdjacent) {
      return list;
    }
  
    const updatedList = without(list, ...subset);
    const targetIndex = updatedList.indexOf(target);
    updatedList.splice(type === 'before' ? targetIndex : targetIndex + 1, 0, ...subset);
  
    return updatedList;
  };
 
  
  export const openPopup = (url, name, width, height, parent) => {
    const y = parent.top.outerHeight / 2 + parent.top.screenY - (height / 2);
    const x = parent.top.outerWidth / 2 + parent.top.screenX - (width / 2);
    return parent.open(url, name, `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${y}, left=${x}`);
  };
