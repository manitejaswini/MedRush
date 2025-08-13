"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Coordinates = { latitude: number; longitude: number };

type Hospital = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  coordinates: Coordinates;
  facilities: string[]; // e.g. ["ICU", "Trauma", "Cardiology", "Pediatrics", "Ventilator"]
  beds: {
    total: number;
    available: number;
    icuAvailable: number;
  };
  doctors: {
    emergency: number;
    cardiology: number;
    general: number;
    pediatrics: number;
  };
  rating: number; // 1-5
};

const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "CityCare General Hospital",
    address: "12 Park Ave, Midtown",
    phone: "+1 (555) 011-2001",
    coordinates: { latitude: 17.4413, longitude: 78.3915 },
    facilities: ["ICU", "Trauma", "Cardiology", "Labour", "Ventilator"],
    beds: { total: 150, available: 24, icuAvailable: 6 },
    doctors: { emergency: 5, cardiology: 3, general: 12, pediatrics: 2 },
    rating: 4.5,
  },
  {
    id: "h2",
    name: "GreenCross Medical Center",
    address: "88 Riverside Rd, West End",
    phone: "+1 (555) 011-2002",
    coordinates: { latitude: 17.4421, longitude: 78.4631 },
    facilities: ["ICU", "Trauma", "Pediatrics", "Labour"],
    beds: { total: 90, available: 12, icuAvailable: 3 },
    doctors: { emergency: 3, cardiology: 1, general: 7, pediatrics: 3 },
    rating: 4.1,
  },
  {
    id: "h3",
    name: "Sunrise Specialty Hospital",
    address: "5 Hillcrest Blvd, East Side",
    phone: "+1 (555) 011-2003",
    coordinates: { latitude: 17.4082, longitude: 78.4983 },
    facilities: ["ICU", "Cardiology", "Ventilator"],
    beds: { total: 120, available: 34, icuAvailable: 10 },
    doctors: { emergency: 4, cardiology: 4, general: 9, pediatrics: 1 },
    rating: 4.7,
  },
  {
    id: "h4",
    name: "Lakeside Children & Trauma",
    address: "42 Lake Rd, North Quarter",
    phone: "+1 (555) 011-2004",
    coordinates: { latitude: 17.4804, longitude: 78.3999 },
    facilities: ["Trauma", "Pediatrics", "Labour"],
    beds: { total: 60, available: 18, icuAvailable: 2 },
    doctors: { emergency: 2, cardiology: 0, general: 6, pediatrics: 5 },
    rating: 4.0,
  },
  {
    id: "h5",
    name: "Metro Heart Institute",
    address: "210 Central Ave, Downtown",
    phone: "+1 (555) 011-2005",
    coordinates: { latitude: 17.4218, longitude: 78.4501 },
    facilities: ["ICU", "Cardiology", "Ventilator"],
    beds: { total: 110, available: 6, icuAvailable: 1 },
    doctors: { emergency: 3, cardiology: 6, general: 8, pediatrics: 0 },
    rating: 4.6,
  },
  {
    id: "h6",
    name: "Riverbend Community Hospital",
    address: "9 Old Mill St, Riverbend",
    phone: "+1 (555) 011-2006",
    coordinates: { latitude: 17.3659, longitude: 78.4422 },
    facilities: ["General", "Pediatrics", "Labour"],
    beds: { total: 80, available: 27, icuAvailable: 0 },
    doctors: { emergency: 2, cardiology: 0, general: 10, pediatrics: 2 },
    rating: 3.9,
  },
];

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(a: Coordinates, b: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const haversine =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * c;
}

const ALL_FACILITIES = [
  "ICU",
  "Trauma",
  "Cardiology",
  "Pediatrics",
  "Labour",
  "Ventilator",
  "General",
] as const;

type Facility = (typeof ALL_FACILITIES)[number];

const DEMO_LOCATION: Coordinates = { latitude: 17.433, longitude: 78.45 };
const TRAFFIC_SIGNALS: Array<{ id: string; name: string; coordinates: Coordinates }> = [
  { id: "ts1", name: "Central Junction Signal", coordinates: { latitude: 17.4365, longitude: 78.446 } },
  { id: "ts2", name: "Riverside Signal", coordinates: { latitude: 17.4412, longitude: 78.4576 } },
  { id: "ts3", name: "Hillcrest Signal", coordinates: { latitude: 17.427, longitude: 78.4521 } },
];
const NEARBY_SIGNAL_THRESHOLD_METERS = 250; // show emergency control if within 250 m

const SORT_OPTIONS = ["distance", "availability", "rating", "name"] as const;
type SortKey = typeof SORT_OPTIONS[number];

export default function Home() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [useDemoLocation, setUseDemoLocation] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [minBeds, setMinBeds] = useState(0);
  const [requiredFacilities, setRequiredFacilities] = useState<Facility[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("distance");
  const [trafficControlEnabled, setTrafficControlEnabled] = useState<boolean>(false);
  const [blynkStatus, setBlynkStatus] = useState<string>("");

  // Trip workflow
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState("");


  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => setLocationError(err.message || "Unable to fetch location"),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );
  }, []);

  const activeLocation = useMemo<Coordinates | null>(() => {
    return useDemoLocation ? DEMO_LOCATION : userLocation;
  }, [useDemoLocation, userLocation]);

  const hospitalsWithMeta = useMemo(() => {
    return HOSPITALS.map((h) => {
      const distance = activeLocation
        ? distanceKm(activeLocation, h.coordinates)
        : null;
      return { ...h, distance } as Hospital & { distance: number | null };
    });
  }, [activeLocation]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return hospitalsWithMeta
      .filter((h) =>
        s
          ? h.name.toLowerCase().includes(s) || h.address.toLowerCase().includes(s)
          : true
      )
      .filter((h) => (minBeds > 0 ? h.beds.available >= minBeds : true))
      .filter((h) =>
        requiredFacilities.length
          ? requiredFacilities.every((f) => h.facilities.includes(f))
          : true
      );
  }, [hospitalsWithMeta, search, minBeds, requiredFacilities]);

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

  const nearestSignal = useMemo(() => {
    if (!activeLocation) return null;
    let best: { signal: (typeof TRAFFIC_SIGNALS)[number]; meters: number } | null = null;
    for (const s of TRAFFIC_SIGNALS) {
      const meters = distanceKm(activeLocation, s.coordinates) * 1000;
      if (!best || meters < best.meters) best = { signal: s, meters };
    }
    return best;
  }, [activeLocation]);

  function toggleFacility(facility: Facility) {
    setRequiredFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  }

  function mapsUrl(dest: Coordinates) {
    const destination = `${dest.latitude},${dest.longitude}`;
    const origin = activeLocation
      ? `&origin=${activeLocation.latitude},${activeLocation.longitude}`
      : "";
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}`;
  }

  async function sendBlynkEmergency(value: 0 | 1) {
    try {
      setBlynkStatus("Sending…");
      const res = await fetch("/api/blynk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update", pin: "v0", value }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setBlynkStatus(value ? "Emergency ON sent" : "Emergency OFF sent");
    } catch (e: any) {
      setBlynkStatus(`Error: ${e?.message || "Failed"}`);
    } finally {
      setTimeout(() => setBlynkStatus(""), 3000);
    }
  }

  const handleEmergencyPress = async () => {
    const newState = !trafficControlEnabled;
    setTrafficControlEnabled(newState);
    await sendBlynkEmergency(newState ? 1 : 0);
  };

  // Voice features removed per request

  async function notifyHospital(h: Hospital) {
    try {
      setNotifyStatus("Notifying…");
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "hospital",
          hospitalId: h.id,
          message: `Ambulance en route to ${h.name}`,
          meta: {
            selectedHospital: { id: h.id, name: h.name, beds: h.beds },
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      setNotifyStatus("Notified hospital");
    } catch (e: any) {
      setNotifyStatus(`Notify failed: ${e?.message || "error"}`);
    } finally {
      setTimeout(() => setNotifyStatus(""), 3000);
    }
  }

  function openConfirm(h: Hospital) {
    setSelectedHospital(h);
    setConfirmOpen(true);
  }

  async function confirmStart() {
    if (!selectedHospital) return;
    setTripStarted(true);
    setConfirmOpen(false);
    await notifyHospital(selectedHospital);
  }

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
                <div className="mt-1 text-xl font-semibold">Apollo Network</div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Select a branch within the city and proceed.</p>
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
