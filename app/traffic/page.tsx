"use client";

import Link from "next/link";
import { useState } from "react";

export default function TrafficDashboard() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function controlLight(action: "red" | "yellow" | "green") {
    setIsLoading(true);
    setStatus("");
    
    try {
      const res = await fetch("/api/esp32", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        const text = await res.text();
        setStatus(`✅ ${text}`);
      } else {
        setStatus(`❌ Error: ${res.status}`);
      }
    } catch (e: any) {
      setStatus(`❌ Connection failed: ${e?.message || "Check ESP32 IP"}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Traffic Light Control</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Manual override for ESP32 traffic lights. Override lasts 30 seconds.
            </p>
          </div>
          <Link href="/" className="text-sm rounded-lg border border-transparent bg-zinc-900/90 hover:bg-zinc-900 text-white px-3 py-2">
            Back to MedRush
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Status Display */}
          {status && (
            <div className="mb-8 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur">
              <div className="text-sm font-medium">{status}</div>
            </div>
          )}

          {/* Traffic Light Display */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Traffic Light Housing */}
              <div className="w-24 h-64 bg-zinc-800 rounded-2xl border-4 border-zinc-600 flex flex-col items-center justify-center gap-4 p-4">
                {/* Red Light */}
                <div className="w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                
                {/* Yellow Light */}
                <div className="w-12 h-12 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                
                {/* Green Light */}
                <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
              </div>
              
              {/* Traffic Light Stand */}
              <div className="w-4 h-16 bg-zinc-700 mx-auto"></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => controlLight("red")}
              disabled={isLoading}
              className="group relative p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-3 shadow-lg shadow-red-500/50"></div>
                <div className="text-lg font-semibold text-red-700 dark:text-red-300">RED</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Stop Traffic</div>
              </div>
            </button>

            <button
              onClick={() => controlLight("yellow")}
              disabled={isLoading}
              className="group relative p-6 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500 mx-auto mb-3 shadow-lg shadow-yellow-500/50"></div>
                <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">YELLOW</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Prepare to Stop</div>
              </div>
            </button>

            <button
              onClick={() => controlLight("green")}
              disabled={isLoading}
              className="group relative p-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-green-500 mx-auto mb-3 shadow-lg shadow-green-500/50"></div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">GREEN</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Go / Emergency</div>
              </div>
            </button>
          </div>

          {/* Info Panel */}
          <div className="mt-8 p-6 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur">
            <h3 className="text-lg font-semibold mb-3">How it works:</h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>• <strong>Click any light</strong> to manually override the traffic signal</li>
              <li>• <strong>Override lasts 30 seconds</strong> then returns to auto-cycle</li>
              <li>• <strong>Auto-cycle:</strong> Red → Yellow → Green → Red (5 sec each)</li>
              <li>• <strong>Emergency mode:</strong> Use GREEN for ambulance priority</li>
            </ul>
          </div>

          {/* Connection Status */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Connected to ESP32</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
