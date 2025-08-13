"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Notice = {
  id: string;
  message: string;
  hospitalId?: string;
  ts: number;
  meta?: any;
};

export default function HospitalUI() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<Notice[]>([]);
  const [filterHospital, setFilterHospital] = useState<string>("");
  const esRef = useRef<EventSource | null>(null);

  function generateId(): string {
    try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2); }
  }

  // Seed two sample government-hospital arrivals with countdown timers
  useEffect(() => {
    const samples: Notice[] = [
      {
        id: generateId(),
        message: "Ambulance en route to CityCare General Hospital",
        hospitalId: "h1",
        ts: Date.now(),
        meta: {
          selectedHospital: { id: "h1", name: "CityCare General Hospital", beds: { available: 24 } },
          distanceKm: 3.2,
          etaMin: 7,
          remainingSec: 7 * 60,
        },
      },
      {
        id: generateId(),
        message: "Ambulance en route to GreenCross Medical Center",
        hospitalId: "h2",
        ts: Date.now(),
        meta: {
          selectedHospital: { id: "h2", name: "GreenCross Medical Center", beds: { available: 12 } },
          distanceKm: 1.4,
          etaMin: 5,
          remainingSec: 5 * 60,
        },
      },
    ];
    setEvents(samples);
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/stream?channel=hospital`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data?.type === "notify") {
          setEvents((prev) => [{ id: generateId(), message: data.message, hospitalId: data.hospitalId, ts: data.ts, meta: data.meta }, ...prev].slice(0, 100));
        } else if (data?.type === "connected") {
          // seed sample notifications once on connect
          setEvents((prev) => (prev.length ? prev : [
            { id: generateId(), message: "Ambulance en route to CityCare General Hospital", hospitalId: "h1", ts: Date.now(), meta: { selectedHospital: { id: "h1", name: "CityCare General Hospital", beds: { available: 24 } }, distanceKm: 3.2, etaMin: 7 } },
            { id: generateId(), message: "Ambulance en route to Apollo Health City Jubilee Hills", hospitalId: "ap1", ts: Date.now(), meta: { selectedHospital: { id: "ap1", name: "Apollo Health City Jubilee Hills", beds: { available: 14 } }, distanceKm: 5.6, etaMin: 12 } },
          ]));
        }
      } catch {}
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  // Countdown timer for arrivals
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents((prev) => prev.map((e) => {
        const rem = e.meta?.remainingSec;
        if (typeof rem === "number" && rem > 0) {
          return { ...e, meta: { ...e.meta, remainingSec: rem - 1 } };
        }
        return e;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  

  const filtered = useMemo(() => {
    if (!filterHospital) return events;
    return events.filter((e) => e.hospitalId === filterHospital);
  }, [events, filterHospital]);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-indigo-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hospital Console</h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Live alerts of incoming ambulances. This demo uses server-sent events (no database).
            </p>
          </div>
          <Link href="/" className="text-sm rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2">Ambulance UI</Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="filter" className="text-sm text-zinc-600 dark:text-zinc-400">Filter by hospital id</label>
                <input id="filter" value={filterHospital} onChange={(e) => setFilterHospital(e.target.value.trim())} placeholder="e.g., h2" className="rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-400" />
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {filtered.length === 0 && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">No notifications yet.</div>
              )}
              {filtered.map((e) => {
                const remainingSec: number | undefined = e.meta?.remainingSec;
                const mm = typeof remainingSec === 'number' ? Math.floor(remainingSec / 60) : undefined;
                const ss = typeof remainingSec === 'number' ? remainingSec % 60 : undefined;
                return (
                <div key={e.id} className="rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-900/20 p-4">
                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{e.message}</div>
                  <div className="text-xs text-indigo-900/70 dark:text-indigo-300/70 mt-1">
                    Hospital: {e.hospitalId || "All"} • {new Date(e.ts).toLocaleString()}
                  </div>
                {e.meta?.selectedHospital && (
                  <div className="text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-1">
                    Destination: {e.meta.selectedHospital.name} — Beds avail: {e.meta.selectedHospital.beds?.available}
                  </div>
                )}
                {typeof e.meta?.distanceKm === 'number' && (
                  <div className="text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-1">
                    Distance: {e.meta.distanceKm < 1 ? `${(e.meta.distanceKm * 1000).toFixed(0)} m` : `${e.meta.distanceKm.toFixed(1)} km`} • ETA: {e.meta.etaMin ?? 5} min
                  </div>
                )}
                  <div className="mt-2 text-[11px] text-indigo-900/80 dark:text-indigo-300/80">
                    {typeof remainingSec === 'number' && remainingSec > 0 ? (
                      <>Time left: {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</>
                    ) : (
                      <span className="text-emerald-700">Arrived</span>
                    )}
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


