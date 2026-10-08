"use client";

import { useState, useTransition } from "react";
import styles from "./testKey.module.css";
import { generatePrivate } from "@/lib/keys";

export const TestKey = () => {
  const [isPending, startTransition] = useTransition();
  const [info, setInfo] = useState({});
  const [pw, setPw] = useState("");

  const clickButton = () => {
    startTransition(() => {
      console.log("start")
      generatePrivate({ password: pw })
        .then(console.log)
        .catch((e) => {
          setInfo({ error: true, e})
        })
      console.log("end")
    })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.subtitle}>
          Test keys
        </p>
      </header>

      <main>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Test a key</h2>
          <input type="text" onChange={e => setPw(e.currentTarget.value)} value={pw} />
          <button onClick={clickButton}>Create key</button>
          { isPending && "Pending..." }
          <pre className={styles.codeBlock}>
            { JSON.stringify(info) }
          </pre>
        </section>
      </main>
    </div>
  );
};
