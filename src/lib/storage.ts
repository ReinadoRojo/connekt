"use client";

const _v = 1

const useDatabase = (): Promise<IDBDatabase | void> => {
  if (typeof window === 'undefined') return Promise.resolve(); // Ensure not worker, only browser

  return new Promise((_, reject) => {
    const req = indexedDB.open("connekt", _v)

    req.onerror = e => {
      // TODO: Handle error
      alert("Error! See console")
      console.error("See down!!!")
      reject(e);
    };

    req.onupgradeneeded = e => {
      const _db = req.result;
      const _old = e.oldVersion;

      const authStore = _db.createObjectStore('accounts', { keyPath: 'username' })
      const keysStore = _db.createObjectStore('keys', { keyPath: 'id' })

      // TODO: Handle migrations
      console.log("onupgradeneeded")
    }

    req.onsuccess = () => { _(req.result) }
  })
}

const errorHandler = (e: Event) => {
  // TODO: Handle error
  alert("Error! See console")
  console.error("See down!!!")
  console.log(e)
  console.trace(e)
};

(() => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', _ => {
    const db = useDatabase() // Load first to ensure database exists for future calls.

    console.log("db loaded?", !!db)
  })
})()

export function storeKey({ id, key }: { id: string; key: string; }) {
  const db = useDatabase();
  if (!db) return;
  // TODO
}

export function getKey(id: string) {
  const db = useDatabase();
  if (!db) return;
  // TODO
}

export async function listUsernames() {
  const db = await useDatabase();
  if (!db) return;

  return new Promise((reject, _) => {
    const t = db.transaction(["accounts"], "readonly")
    t.onerror = e => {
      errorHandler(e);
      reject(e);
    };

    const accounts = t.objectStore("accounts");
    const req = accounts.getAllKeys();

    req.onsuccess = () => { _(req.result); }
    req.onerror = e => { reject(e);  }
  })
}

export function addAuthKey({ username, key }: { username: string; key: string; }) {
  const db = useDatabase();
  if (!db) return;

  // TODO
}

export function getAuthKey(username: string) {
  const db = useDatabase();
  if (!db) return;

  // TODO
}
