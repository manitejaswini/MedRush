"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function SignalTriggerPage() {
  const params = useSearchParams();
  const router = useRouter();
  const hospitalId = params.get("hospitalId") || "";
  const [isSending, setIsSending] = useState(false);

  async function trigger() {
    setIsSending(true);
    try {
      // Placeholder for Blynk call; will be wired later
      // await fetch("/api/blynk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", pin: "v0", value: 1 }) });
      await new Promise((r) => setTimeout(r, 800));
      router.push(`/signal/triggered?hospitalId=${encodeURIComponent(hospitalId)}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur p-6">
          <h1 className="text-xl font-semibold">Trigger traffic signal warning</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Hospital: {hospitalId || "N/A"}</p>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={trigger} disabled={isSending} className={"rounded-lg "+(isSending?"bg-zinc-400 cursor-not-allowed":"bg-emerald-600 hover:bg-emerald-700")+" text-white px-3 py-2 text-sm"}>
              {isSending ? "Sending…" : "Trigger now"}
            </button>
            <Link href="/hospital" className="text-sm rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 px-3 py-2">Back</Link>
          </div>
        </div>
      </section>
    </main>
  );
}


