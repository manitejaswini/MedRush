import { NextRequest } from "next/server";

// Simple proxy to Blynk HTTP API to avoid exposing token in the client and handle CORS.
// Set BLYNK_TOKEN in your environment (e.g., .env.local) and restart dev server.

export async function POST(req: NextRequest) {
  try {
    const token = process.env.BLYNK_TOKEN;
    if (!token) {
      return new Response("Missing BLYNK_TOKEN env", { status: 500 });
    }

    const body = await req.json();
    const pin = String(body?.pin ?? "v0");
    const value = body?.value ?? 0;
    const action = String(body?.action ?? "update");

    // Only allow update or notify for demo
    if (!["update", "notify"].includes(action)) {
      return new Response("Invalid action", { status: 400 });
    }

    const url = `https://blynk.cloud/external/api/update?token=${encodeURIComponent(
      token
    )}&${encodeURIComponent(pin)}=${encodeURIComponent(String(value))}`;

    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return new Response(text || "Blynk error", { status: 502 });
    }
    return new Response(text || "ok", { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "Server error", { status: 500 });
  }
}


