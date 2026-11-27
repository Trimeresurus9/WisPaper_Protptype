import { useEffect, useRef, useState } from 'react';

export const IMAGE_PPTX_DOWNLOAD_COST = 10_000;

interface Wallet {
  credits: number;
  paidDownloadIds: string[];
  revision: number;
}

const initialWallet: Wallet = { credits: 50_000, paidDownloadIds: [], revision: 0 };
const databaseName = 'wispaper-mock-credits';
type Change = (wallet: Wallet) => Wallet;

// One read/write transaction serializes balance changes and result purchases across tabs.
async function accessWallet(change?: Change): Promise<Wallet> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(databaseName, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('account');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    return await new Promise<Wallet>((resolve, reject) => {
      const tx = db.transaction('account', change ? 'readwrite' : 'readonly');
      const store = tx.objectStore('account');
      const read = store.get('wallet');
      let result: Wallet;
      let failure: unknown;

      read.onsuccess = () => {
        const current: Wallet = read.result ?? initialWallet;
        try {
          result = change ? change(current) : current;
          if (result !== current) {
            result = { ...result, revision: current.revision + 1 };
            store.put(result, 'wallet');
          }
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error);
    });
  } finally {
    db.close();
  }
}

class InsufficientCredits extends Error {}

export function useMockCredits() {
  const [wallet, setWallet] = useState(initialWallet);
  const channel = useRef<BroadcastChannel | null>(null);

  function receive(next: Wallet) {
    setWallet(current => next.revision >= current.revision ? next : current);
  }

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void accessWallet().then(next => { if (active) receive(next); }).catch(() => {});
    };
    const updates = typeof BroadcastChannel === 'function' ? new BroadcastChannel(databaseName) : null;
    if (updates) updates.onmessage = refresh;
    channel.current = updates;
    window.addEventListener('focus', refresh);
    refresh();
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      channel.current = null;
      updates?.close();
    };
  }, []);

  async function save(change: Change) {
    const next = await accessWallet(change);
    receive(next);
    channel.current?.postMessage(next.revision);
  }

  function setCredits(credits: number) {
    void save(current => ({ ...current, credits })).catch(() => {
      // The existing console can still simulate balances if browser storage is unavailable.
      setWallet(current => ({ ...current, credits }));
    });
  }

  async function payForDownload(id: string) {
    try {
      await save(current => {
        if (current.paidDownloadIds.includes(id)) return current;
        if (current.credits < IMAGE_PPTX_DOWNLOAD_COST) {
          throw new InsufficientCredits(`积分不足，下载需要 10,000 Credits，当前余额为 ${current.credits.toLocaleString('zh-CN')} Credits。`);
        }
        return {
          ...current,
          credits: current.credits - IMAGE_PPTX_DOWNLOAD_COST,
          paidDownloadIds: [...current.paidDownloadIds, id],
        };
      });
    } catch (error) {
      if (error instanceof InsufficientCredits) throw error;
      throw new Error('无法保存下载记录，请检查浏览器存储后重试。');
    }
  }

  return { credits: wallet.credits, setCredits, isDownloadPaid: (id: string) => wallet.paidDownloadIds.includes(id), payForDownload };
}
