export const useLocalStorage = () => {

  const namespace = '';

  const get = (key, defaultValue = null) => {
    const value = localStorage.getItem(namespace + key);
    return value === null ? defaultValue : JSON.parse(value);
  };

  const set = (key, value) => {
    localStorage.setItem(namespace + key, JSON.stringify(value));
  };

  const remove = (key) => {
    localStorage.removeItem(namespace + key);
  };

  return {
    get,
    set,
    remove
  }
}