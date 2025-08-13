"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignalTriggeredPage() {
  const params = useSearchParams();
  const hospitalId = params.get("hospitalId") || "";
  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto rounded-xl border border-green-300/70 dark:border-green-800/60 bg-emerald-50/70 dark:bg-emerald-900/20 p-6 text-center">
          <h1 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">Signal changing…</h1>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80 mt-1">Hospital: {hospitalId || "N/A"}</p>
          <p className="text-xs text-emerald-900/70 dark:text-emerald-200/70 mt-2">This page indicates the traffic light is being changed via Blynk (placeholder).</p>
          <div className="mt-4">
            <Link href="/hospital" className="text-sm rounded-lg border border-emerald-300/60 px-3 py-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">Back to console</Link>
          </div>
        </div>
      </section>
    </main>
  );
}


