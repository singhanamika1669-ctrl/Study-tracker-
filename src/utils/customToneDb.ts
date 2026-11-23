/**
 * IndexedDB persistent store for user-uploaded local phone audio files (alarm tones).
 * Works cleanly offline as a PWA without hitting localStorage's ~5MB ceiling.
 */

const DB_NAME = 'StudyTrackerCustomAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioTones';

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed opening audio DB'));
  });
}

export async function saveCustomToneBlob(id: string, file: Blob): Promise<void> {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed saving audio file'));
    };
  });
}

export async function getCustomToneBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAudioDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        db.close();
        resolve(req.result instanceof Blob ? req.result : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteCustomToneBlob(id: string): Promise<void> {
  try {
    const db = await openAudioDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore DB cleanup errors
  }
}
