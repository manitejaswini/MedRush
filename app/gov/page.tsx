"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Coordinates = { latitude: number; longitude: number };

type Hospital = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  coordinates: Coordinates;
  facilities: string[];
  beds: { total: number; available: number; icuAvailable: number };
  doctors: { emergency: number; cardiology: number; general: number; pediatrics: number };
  rating: number;
};

const HOSPITALS: Hospital[] = [
  { id: "h1", name: "CityCare General Hospital", address: "12 Park Ave, Midtown", phone: "+1 (555) 011-2001", coordinates: { latitude: 17.4413, longitude: 78.3915 }, facilities: ["ICU", "Trauma", "Cardiology", "Labour", "Ventilator"], beds: { total: 150, available: 24, icuAvailable: 6 }, doctors: { emergency: 5, cardiology: 3, general: 12, pediatrics: 2 }, rating: 4.5 },
  { id: "h2", name: "GreenCross Medical Center", address: "88 Riverside Rd, West End", phone: "+1 (555) 011-2002", coordinates: { latitude: 17.4421, longitude: 78.4631 }, facilities: ["ICU", "Trauma", "Pediatrics", "Labour"], beds: { total: 90, available: 12, icuAvailable: 3 }, doctors: { emergency: 3, cardiology: 1, general: 7, pediatrics: 3 }, rating: 4.1 },
  { id: "h3", name: "Sunrise Specialty Hospital", address: "5 Hillcrest Blvd, East Side", phone: "+1 (555) 011-2003", coordinates: { latitude: 17.4082, longitude: 78.4983 }, facilities: ["ICU", "Cardiology", "Ventilator"], beds: { total: 120, available: 34, icuAvailable: 10 }, doctors: { emergency: 4, cardiology: 4, general: 9, pediatrics: 1 }, rating: 4.7 },
  { id: "h4", name: "Lakeside Children & Trauma", address: "42 Lake Rd, North Quarter", phone: "+1 (555) 011-2004", coordinates: { latitude: 17.4804, longitude: 78.3999 }, facilities: ["Trauma", "Pediatrics", "Labour"], beds: { total: 60, available: 18, icuAvailable: 2 }, doctors: { emergency: 2, cardiology: 0, general: 6, pediatrics: 5 }, rating: 4.0 },
  { id: "h5", name: "Metro Heart Institute", address: "210 Central Ave, Downtown", phone: "+1 (555) 011-2005", coordinates: { latitude: 17.4218, longitude: 78.4501 }, facilities: ["ICU", "Cardiology", "Ventilator"], beds: { total: 110, available: 6, icuAvailable: 1 }, doctors: { emergency: 3, cardiology: 6, general: 8, pediatrics: 0 }, rating: 4.6 },
  { id: "h6", name: "Riverbend Community Hospital", address: "9 Old Mill St, Riverbend", phone: "+1 (555) 011-2006", coordinates: { latitude: 17.3659, longitude: 78.4422 }, facilities: ["General", "Pediatrics", "Labour"], beds: { total: 80, available: 27, icuAvailable: 0 }, doctors: { emergency: 2, cardiology: 0, general: 10, pediatrics: 2 }, rating: 3.9 },
];

function toRadians(v: number) { return (v * Math.PI) / 180; }
function distanceKm(a: Coordinates, b: Coordinates) {
  const R = 6371; const dLat = toRadians(b.latitude - a.latitude); const dLon = toRadians(b.longitude - a.longitude);
  const la1 = toRadians(a.latitude); const la2 = toRadians(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2; return 2*R*Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

const DEMO_LOCATION: Coordinates = { latitude: 17.433, longitude: 78.45 };

export default function GovPage() {
  const [useDemoLocation, setUseDemoLocation] = useState(true);
  const [userLoc, setUserLoc] = useState<Coordinates | null>(null);
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState("");

  // Filters and sorting
  const ALL_FACILITIES = ["ICU", "Trauma", "Cardiology", "Pediatrics", "Labour", "Ventilator", "General"] as const;
  type Facility = (typeof ALL_FACILITIES)[number];
  const SORT_OPTIONS = ["distance", "availability", "rating", "name"] as const;
  type SortKey = typeof SORT_OPTIONS[number];
  const [search, setSearch] = useState("");
  const [minBeds, setMinBeds] = useState(0);
  const [requiredFacilities, setRequiredFacilities] = useState<Facility[]>([]);
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
    return HOSPITALS.map((h) => ({
      ...h,
      distance: origin ? distanceKm(origin, h.coordinates) : null,
    }));
  }, [origin]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return withMeta
      .filter((h) => (s ? h.name.toLowerCase().includes(s) || h.address.toLowerCase().includes(s) : true))
      .filter((h) => (minBeds > 0 ? h.beds.available >= minBeds : true))
      .filter((h) => (requiredFacilities.length ? requiredFacilities.every((f) => h.facilities.includes(f)) : true));
  }, [withMeta, search, minBeds, requiredFacilities]);

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
        list.sort((a, b) => b.beds.available - a.beds.available);
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

  function toggleFacility(f: Facility) {
    setRequiredFacilities((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  async function notify(h: Hospital) {
    try {
      setNotifyStatus("Notifying…");
      const distanceKmVal = origin ? distanceKm(origin, h.coordinates) : null;
      const res = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channel: "hospital", hospitalId: h.id, message: `Ambulance en route to ${h.name}`, meta: { selectedHospital: { id: h.id, name: h.name, beds: h.beds }, distanceKm: distanceKmVal, etaMin: distanceKmVal != null ? Math.max(2, Math.round((distanceKmVal / 30) * 60)) : undefined } }) });
      if (!res.ok) throw new Error(await res.text());
      setNotifyStatus("Notified hospital");
    } catch (e: any) { setNotifyStatus(e?.message || "Notify failed"); } finally { setTimeout(() => setNotifyStatus(""), 2500); }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">MedRush • Government</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Select a hospital, confirm, then open route. Notification will reach the hospital console.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hospital" className="text-sm rounded-lg border border-transparent bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2">Hospital UI</Link>
            <Link href="/traffic" className="text-sm rounded-lg border border-transparent bg-orange-600 hover:bg-orange-700 text-white px-3 py-2">🚦 Traffic Control</Link>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch("/api/blynk", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "update", pin: "v0", value: 1 }),
                  });
                  if (res.ok) {
                    alert("🟢 Green LED ON");
                    // Auto-off after 2 seconds
                    setTimeout(async () => {
                      await fetch("/api/blynk", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ action: "update", pin: "v0", value: 0 }),
                      });
                    }, 2000);
                  } else {
                    alert("Failed to control LED");
                  }
                } catch (e) {
                  alert("Error: Check Blynk connection");
                }
              }}
              className="text-sm rounded-lg border border-transparent bg-green-600 hover:bg-green-700 text-white px-3 py-2"
            >
              🟢 LED Test
            </button>
            <Link href="/" className="text-sm rounded-lg border border-transparent bg-zinc-900/90 hover:bg-zinc-900 text-white px-3 py-2">Back</Link>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex-1 min-w-64">
            <label className="sr-only" htmlFor="search">Search hospitals</label>
            <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or address" className="w-full rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 backdrop-blur px-3 py-2 text-sm outline-none focus:ring-2 ring-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="minBeds" className="text-sm text-zinc-600 dark:text-zinc-400">Min beds</label>
            <input id="minBeds" type="number" min={0} value={minBeds} onChange={(e) => setMinBeds(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-2 ring-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Sort by</span>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt; return (
                  <button key={opt} onClick={() => setSortBy(opt)} className={"rounded-full px-3 py-1 text-xs font-medium border transition " + (active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/70 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 border-zinc-300/70 dark:border-zinc-700/70 hover:border-emerald-400")}>{opt}</button>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={() => { setSearch(""); setMinBeds(0); setRequiredFacilities([]); setSortBy("distance"); }} className="text-sm rounded-lg border border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2">Reset</button>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Shortest Distance</label>
            <button onClick={() => setUseDemoLocation((v) => !v)} className={"relative inline-flex h-7 w-12 items-center rounded-full transition " + (useDemoLocation ? "bg-emerald-600" : "bg-zinc-400 dark:bg-zinc-700")} aria-pressed={useDemoLocation}><span className={"inline-block h-5 w-5 transform rounded-full bg-white transition " + (useDemoLocation ? "translate-x-6" : "translate-x-1")} /></button>
            {notifyStatus && <span className="text-xs text-emerald-600 ml-2">{notifyStatus}</span>}
          </div>
          <div className="col-span-full mt-2 flex flex-wrap gap-2">
            {ALL_FACILITIES.map((f) => {
              const active = requiredFacilities.includes(f);
              return <button key={f} onClick={() => toggleFacility(f)} className={"rounded-full px-3 py-1 text-xs font-medium border transition " + (active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/70 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 border-zinc-300/70 dark:border-zinc-700/70 hover:border-emerald-400")}>{f}</button>;
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((h) => {
            const d = h.distance;
            return (
              <article key={h.id} className="group rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">{h.name}</h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{h.address}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">⭐ {h.rating.toFixed(1)}</div>
                    {d != null && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">{d < 1 ? `${(d*1000).toFixed(0)} m` : `${d.toFixed(1)} km`}</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.facilities.map((f) => (
                    <span key={f} className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/40 px-2.5 py-0.5 text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3"><div className="text-xs text-zinc-500">Beds avail.</div><div className="text-lg font-semibold">{h.beds.available}</div></div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3"><div className="text-xs text-zinc-500">ICU beds</div><div className="text-lg font-semibold">{h.beds.icuAvailable}</div></div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3"><div className="text-xs text-zinc-500">Doctors</div><div className="text-lg font-semibold">{h.doctors.emergency + h.doctors.cardiology + h.doctors.general + h.doctors.pediatrics}</div></div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <button onClick={() => { setSelected(h); setConfirmOpen(true); }} className="inline-flex items-center justify-center rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-zinc-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm px-3 py-2">Select</button>
                  <a href={mapsUrl(h.coordinates)} target="_blank" rel="noreferrer" className={"flex-1 inline-flex items-center justify-center gap-2 rounded-lg text-white text-sm px-3 py-2 transition " + (started && selected?.id === h.id && origin ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-400 cursor-not-allowed")} aria-disabled={!started || selected?.id !== h.id || !origin}>Route</a>
                  <Link href={`/signal/trigger?hospitalId=${encodeURIComponent(h.id)}`} className={"inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm " + (started && selected?.id === h.id ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50" : "border-zinc-300/70 text-zinc-600 cursor-not-allowed") } aria-disabled={!started || selected?.id !== h.id}>Trigger warning</Link>
                  {h.phone && (<a href={`tel:${h.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center justify-center rounded-lg border border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 text-sm px-3 py-2 hover:border-emerald-400">Call</a>)}
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
              <button onClick={async () => { setStarted(true); setConfirmOpen(false); await notify(selected); }} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm">Confirm & Notify</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


