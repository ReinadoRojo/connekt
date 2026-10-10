'use client';

import { useCallback } from "react";
import CryptoWorker from '../../../workers/crypto.worker?worker';
import { CryptoActions } from "@/types/global";

export function useCryptoWorker() {
  const run = useCallback((action: CryptoActions, payload: any) => {
    return new Promise((_, x) => {
      if (typeof window === 'undefined') {
        return x(new Error('Server-side execution'))
      }

      const w: Worker = new CryptoWorker();

      w.onmessage = (e) => {
        const { success, result, error } = e.data;

        if (success) {
          _(result)
        } else {
          console.error("w.onmessage")
          x(new Error(error))
        }

        w.terminate();
      }

      w.onerror = (err) => {
        console.error("w.onerror")
        x(err);
        w.terminate();
      }

      w.postMessage({ action, payload })
    });
  }, []);

  return { run }
}
