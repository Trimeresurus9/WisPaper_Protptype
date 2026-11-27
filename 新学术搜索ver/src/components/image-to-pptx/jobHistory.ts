import type { SlideObject } from './slideModel';

export interface ImagePptxJob {
  id: string;
  image: File;
  presentation: Blob;
  edits?: SlideObject[];
  startedAt: number;
  readyAt: number;
}

async function accessHistory<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open('wispaper-image-to-pptx', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('jobs', { keyPath: 'id' });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction('jobs', mode);
      const request = action(transaction.objectStore('jobs'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error);
    });
  } finally {
    database.close();
  }
}

export async function loadImagePptxHistory(): Promise<ImagePptxJob[]> {
  const jobs = await accessHistory<ImagePptxJob[]>('readonly', store => store.getAll());
  return jobs.sort((first, second) => second.startedAt - first.startedAt);
}

export function saveImagePptxJob(job: ImagePptxJob) {
  return accessHistory('readwrite', store => store.put(job));
}

export function saveImagePptxEdits(id: string, edits: SlideObject[]) {
  return accessHistory('readwrite', store => {
    const read = store.get(id);
    read.onsuccess = () => {
      const job: ImagePptxJob | undefined = read.result;
      if (job) store.put({ ...job, edits });
    };
    return read;
  });
}

export function removeImagePptxJob(id: string) {
  return accessHistory('readwrite', store => store.delete(id));
}
