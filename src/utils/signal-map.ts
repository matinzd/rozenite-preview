export function createSignalMap<K, V>(
  onChange: (type: 'set' | 'delete' | 'clear', key?: K, value?: V) => void
) {
  const internal = new Map<K, V>();

  return {
    set(key: K, value: V) {
      internal.set(key, value);
      onChange('set', key, value);
      return this;
    },
    delete(key: K) {
      const existed = internal.delete(key);
      if (existed) onChange('delete', key);
      return existed;
    },
    clear() {
      internal.clear();
      onChange('clear');
    },
    get(key: K) {
      return internal.get(key);
    },
    has(key: K) {
      return internal.has(key);
    },
    get size() {
      return internal.size;
    },
    [Symbol.iterator]() {
      return internal[Symbol.iterator]();
    },
    entries() {
      return internal.entries();
    },
    keys() {
      return internal.keys();
    },
    values() {
      return internal.values();
    },
    forEach(cb: (value: V, key: K, map: Map<K, V>) => void) {
      internal.forEach(cb);
    }
  } as Map<K, V>;
}