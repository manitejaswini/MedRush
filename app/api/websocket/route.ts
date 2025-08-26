import { NextRequest } from "next/server";

// WebSocket proxy to ESP32
// Set ESP32_WS_IP in your environment

export async function POST(req: NextRequest) {
  try {
    const esp32WSIP = process.env.ESP32_WS_IP;
    if (!esp32WSIP) {
      return new Response("Missing ESP32_WS_IP env", { status: 500 });
    }

    const body = await req.json();
    const message = String(body?.message ?? "green_toggle");

    // For WebSocket, we'd need a persistent connection
    // This is a simplified HTTP-to-WebSocket bridge
    // In production, you'd use a WebSocket client library
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `WebSocket message '${message}' sent to ESP32`,
      note: "This is a placeholder - implement WebSocket client for full functionality"
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(e?.message || "Server error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
