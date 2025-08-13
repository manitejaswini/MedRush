"use client";

import Link from "next/link";

export default function SelectType() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Choose Hospital Type</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Select your destination category to continue.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/gov" className="block rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/40 p-8 hover:shadow-md transition">
              <div className="text-left">
                <div className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Government</div>
                <div className="mt-1 text-xl font-semibold">Public Hospitals</div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Use curated government hospital data in this region.</p>
              </div>
            </Link>

            <Link href="/private" className="block rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/40 p-8 hover:shadow-md transition">
              <div className="text-left">
                <div className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">Private</div>
                <div className="mt-1 text-xl font-semibold">Private Networks</div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Select a network (e.g., Apollo) and branch within the city.</p>
              </div>
            </Link>
          </div>

          <div className="mt-6 text-xs text-zinc-600 dark:text-zinc-400">
            You can switch between types anytime.
          </div>
        </div>
      </section>
    </main>
  );
}


