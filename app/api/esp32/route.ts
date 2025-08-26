import { NextRequest } from "next/server";

// Direct communication with ESP32 traffic light web server
// Set ESP32_IP in your environment (e.g., .env.local)

export async function POST(req: NextRequest) {
  try {
    const esp32IP = process.env.ESP32_IP;
    if (!esp32IP) {
      console.error("Missing ESP32_IP environment variable");
      return new Response("Missing ESP32_IP env. Create .env.local with ESP32_IP=your_esp32_ip", { status: 500 });
    }

    const body = await req.json();
    const action = String(body?.action ?? "green");

    let endpoint = "";
    switch (action) {
      case "green":
        endpoint = "/green";
        break;
      case "red":
        endpoint = "/red";
        break;
      case "yellow":
        endpoint = "/yellow";
        break;
      default:
        return new Response("Invalid action. Use: green, red, yellow", { status: 400 });
    }

    const url = `http://${esp32IP}${endpoint}`;
    console.log(`Attempting to connect to: ${url}`);
    
    const res = await fetch(url, { 
      method: "GET", 
      cache: "no-store",
      headers: {
        "User-Agent": "MedRush-TrafficControl/1.0"
      }
    });

    if (!res.ok) {
      console.error(`ESP32 responded with status: ${res.status}`);
      return new Response(`ESP32 error: ${res.status} - Check if ESP32 is running and IP is correct`, { status: 502 });
    }
    
    const text = await res.text();
    console.log(`ESP32 response: ${text}`);
    return new Response(text, { status: 200 });
  } catch (e: any) {
    console.error("ESP32 connection error:", e.message);
    return new Response(`Connection failed: ${e?.message || "Check ESP32 IP and network connection"}`, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
