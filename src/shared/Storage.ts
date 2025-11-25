
/**
 * Lightweight IndexedDB wrapper using the built-in `indexedDB` API.
 * No external deps, small and durable for save data.
 */
const DB_NAME = 'pwa-game';
const DB_VER = 1;
const STORE = 'kv';

function withDB<T>(fn: (db: IDBDatabase) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => fn(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const Storage = {
  async get<T>(key: string): Promise<T | undefined> {
    return withDB<T | undefined>((db) => {
      const tx = db.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const g = st.get(key);
      g.onsuccess = () => resolve(g.result as T | undefined);
      g.onerror = () => reject(g.error);
      function resolve(v: T | undefined) { db.close(); (resolve as any).v = v; }
      function reject(e: any) { db.close(); throw e; }
    }) as unknown as Promise<T | undefined>;
  },

  async set<T>(key: string, value: T): Promise<void> {
    return withDB<void>((db) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      st.put(value as any, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      function resolve() { /* noop */ }
      function reject(e: any) { throw e; }
    }) as unknown as Promise<void>;
  }
};
