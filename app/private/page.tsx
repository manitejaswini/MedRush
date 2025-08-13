"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Coordinates = { latitude: number; longitude: number };

type Branch = {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  bedsAvailable: number;
  icuAvailable: number;
  rating: number;
};

const DEMO_LOCATION: Coordinates = { latitude: 17.433, longitude: 78.45 };

const APOLLO_BRANCHES: Branch[] = [
  { id: "ap1", name: "Apollo Health City Jubilee Hills", address: "Jubilee Hills, Hyderabad", coordinates: { latitude: 17.4327, longitude: 78.4070 }, bedsAvailable: 14, icuAvailable: 3, rating: 4.6 },
  { id: "ap2", name: "Apollo Hospital Secunderabad", address: "Secunderabad", coordinates: { latitude: 17.4410, longitude: 78.4983 }, bedsAvailable: 8, icuAvailable: 1, rating: 4.4 },
  { id: "ap3", name: "Apollo DRDO", address: "Kanchanbagh", coordinates: { latitude: 17.3308, longitude: 78.5247 }, bedsAvailable: 21, icuAvailable: 4, rating: 4.2 },
];

function toRadians(value: number): number { return (value * Math.PI) / 180; }
function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371; const dLat = toRadians(b.latitude - a.latitude); const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude); const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2; return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

export default function PrivatePage() {
  const [useDemoLocation, setUseDemoLocation] = useState(true);
  const [userLoc, setUserLoc] = useState<Coordinates | null>(null);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState("");
  const SORT_OPTIONS = ["distance", "availability", "rating", "name"] as const;
  type SortKey = typeof SORT_OPTIONS[number];
  const [search, setSearch] = useState("");
  const [minBeds, setMinBeds] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("distance");

  useEffect(() => {
    if (!("geolocation" in navigator)) return; 
    navigator.geolocation.getCurrentPosition((pos) => setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
  }, []);

  const origin = useMemo<Coordinates | null>(() => (useDemoLocation ? DEMO_LOCATION : userLoc), [useDemoLocation, userLoc]);

  function mapsUrl(dest: Coordinates) {
    const destination = `${dest.latitude},${dest.longitude}`;
    const originParam = origin ? `&origin=${origin.latitude},${origin.longitude}` : "";
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}`;
  }

  const withMeta = useMemo(() => {
    return APOLLO_BRANCHES.map((b) => ({ ...b, distance: origin ? distanceKm(origin, b.coordinates) : null }));
  }, [origin]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return withMeta
      .filter((b) => (s ? b.name.toLowerCase().includes(s) || b.address.toLowerCase().includes(s) : true))
      .filter((b) => (minBeds > 0 ? b.bedsAvailable >= minBeds : true));
  }, [withMeta, search, minBeds]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "distance":
        list.sort((a, b) => {
          if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
        break;
      case "availability":
        list.sort((a, b) => b.bedsAvailable - a.bedsAvailable);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [filtered, sortBy]);

  async function notify(branch: Branch) {
    try {
      setNotifyStatus("Notifying…");
      const distanceKmVal = origin ? distanceKm(origin, branch.coordinates) : null;
      const res = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channel: "hospital", hospitalId: branch.id, message: `Ambulance en route to ${branch.name}`, meta: { selectedHospital: { id: branch.id, name: branch.name, beds: { available: branch.bedsAvailable } }, distanceKm: distanceKmVal, etaMin: distanceKmVal != null ? Math.max(2, Math.round((distanceKmVal / 30) * 60)) : undefined } }) });
      if (!res.ok) throw new Error(await res.text());
      setNotifyStatus("Notified hospital");
    } catch (e: any) { setNotifyStatus(e?.message || "Notify failed"); } finally { setTimeout(() => setNotifyStatus(""), 2500); }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-indigo-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Private • Apollo</h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">Choose a branch, confirm, then open route. Notification will reach the hospital console.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hospital" className="text-sm rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2">Hospital UI</Link>
            <Link href="/select" className="text-sm rounded-lg border border-transparent bg-zinc-900/90 hover:bg-zinc-900 text-white px-3 py-2">Back</Link>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex-1 min-w-64">
            <label className="sr-only" htmlFor="search">Search branches</label>
            <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or address" className="w-full rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 backdrop-blur px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="minBeds" className="text-sm text-zinc-600 dark:text-zinc-400">Min beds</label>
            <input id="minBeds" type="number" min={0} value={minBeds} onChange={(e) => setMinBeds(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Sort by</span>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => { const active = sortBy === opt; return (
                <button key={opt} onClick={() => setSortBy(opt)} className={"rounded-full px-3 py-1 text-xs font-medium border transition " + (active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white/70 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 border-zinc-300/70 dark:border-zinc-700/70 hover:border-indigo-400")}>{opt}</button>
              );})}
            </div>
          </div>
          <button type="button" onClick={() => { setSearch(""); setMinBeds(0); setSortBy("distance"); }} className="text-sm rounded-lg border border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2">Reset</button>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Shortest Distance</label>
            <button onClick={() => setUseDemoLocation((v) => !v)} className={"relative inline-flex h-7 w-12 items-center rounded-full transition " + (useDemoLocation ? "bg-indigo-600" : "bg-zinc-400 dark:bg-zinc-700")} aria-pressed={useDemoLocation}><span className={"inline-block h-5 w-5 transform rounded-full bg-white transition " + (useDemoLocation ? "translate-x-6" : "translate-x-1")} /></button>
            {notifyStatus && <span className="text-xs text-indigo-700 ml-2">{notifyStatus}</span>}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((b) => {
            const d = b.distance;
            return (
              <article key={b.id} className="group rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">{b.name}</h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{b.address}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">⭐ {b.rating.toFixed(1)}</div>
                    {d != null && (<div className="text-xs text-zinc-600 dark:text-zinc-400">{d < 1 ? `${(d*1000).toFixed(0)} m` : `${d.toFixed(1)} km`}</div>)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3"><div className="text-xs text-zinc-500">Beds avail.</div><div className="text-lg font-semibold">{b.bedsAvailable}</div></div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3"><div className="text-xs text-zinc-500">ICU beds</div><div className="text-lg font-semibold">{b.icuAvailable}</div></div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <button onClick={() => { setSelected(b); setConfirmOpen(true); }} className="inline-flex items-center justify-center rounded-lg border border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-zinc-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm px-3 py-2">Select</button>
                  <a href={mapsUrl(b.coordinates)} target="_blank" rel="noreferrer" className={"flex-1 inline-flex items-center justify-center gap-2 rounded-lg text-white text-sm px-3 py-2 transition " + (started && selected?.id === b.id && origin ? "bg-indigo-600 hover:bg-indigo-700" : "bg-zinc-400 cursor-not-allowed")} aria-disabled={!started || selected?.id !== b.id || !origin}>Route</a>
                  <Link href={`/signal/trigger?hospitalId=${encodeURIComponent(b.id)}`} className={"inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm " + (started && selected?.id === b.id ? "border-indigo-600 text-indigo-700 hover:bg-indigo-50" : "border-zinc-300/70 text-zinc-600 cursor-not-allowed") } aria-disabled={!started || selected?.id !== b.id}>Trigger warning</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {confirmOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5">
            <div className="text-base font-semibold">Start destination?</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{selected.name} — {selected.address}</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)} className="rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 px-3 py-2 text-sm">Cancel</button>
              <button onClick={async () => { setStarted(true); setConfirmOpen(false); await notify(selected); }} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm">Confirm & Notify</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


