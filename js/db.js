const DB = (() => {
  const NAME = 'oppo_db', VER = 1, STORE = 'kv';
  let _db = null;
  function open() {
    return new Promise((res, rej) => {
      if (_db) return res(_db);
      const r = indexedDB.open(NAME, VER);
      r.onupgradeneeded = e => {
        if (!e.target.result.objectStoreNames.contains(STORE))
          e.target.result.createObjectStore(STORE);
      };
      r.onsuccess = e => { _db = e.target.result; res(_db); };
      r.onerror   = e => rej(e.target.error);
    });
  }
  async function get(key) {
    const db = await open();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      r.onsuccess = () => res(r.result ?? null);
      r.onerror   = e => rej(e.target.error);
    });
  }
  async function set(key, val) {
    const db = await open();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE,'readwrite').objectStore(STORE).put(val, key);
      r.onsuccess = () => res();
      r.onerror   = e => rej(e.target.error);
    });
  }
  return { get, set };
})();
