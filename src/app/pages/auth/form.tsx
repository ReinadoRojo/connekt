'use client';

import { useState, useTransition } from "react";
import { useCryptoWorker } from "./crypto";
import { CryptoActions } from "@/types/global.d";

export function SignupForm() {
  const [isPending, setPending] = useState(false);
  const { run } = useCryptoWorker();


  const [username, setUsername] = useState('');
  const [master, setMaster] = useState('');
  const [pair, setPair] = useState({ public: '', private: '' })

  return (
    <form action={async (fd) => {
      setPending(true);

      const u = fd.get('username')
      const m = fd.get('master')
      console.log('Submitting data:', { u, m })

      let passwd;

      try {
        const result = await run(CryptoActions.DERIVATE_MASTER_PASSWD, {
          password: m,
          salt: new Uint8Array(16),
        })

        passwd = result;
      }
      catch (err) {
        console.error(err)
      }

      if (typeof passwd !== 'string') {
        setPending(false); return;
      }

      try {
        const result = await run(CryptoActions.CREATE_MASTER_PAIR, {
          masterPassword: passwd,
        })

        console.log(result)
      }
      catch (err) {
        console.error(err)
      } finally {
        setPending(false);
      }
    }}>
      <div>
        <label htmlFor="username">Username:</label>
        <input type="text" name="username" />
      </div>
      <div>
        <label htmlFor="masterpassword">Master password:</label>
        <input type="text" name="master" />
      </div>
      <button disabled={!!isPending}>
        {isPending ? 'Wait...' : 'Submit'}
      </button>
    </form>
  )
}
