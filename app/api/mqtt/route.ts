import { NextRequest } from "next/server";

// MQTT control for ESP32
// Set MQTT_BROKER_URL in your environment

export async function POST(req: NextRequest) {
  try {
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL;
    if (!mqttBrokerUrl) {
      return new Response("Missing MQTT_BROKER_URL env", { status: 500 });
    }

    const body = await req.json();
    const action = String(body?.action ?? "toggle");
    const led = String(body?.led ?? "green");

    // For MQTT, you'd use a client like mqtt.js or similar
    // This is a simplified HTTP-to-MQTT bridge
    // In production, you'd use a proper MQTT client library
    
    const topic = `medrush/led/${led}`;
    const message = action;
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `MQTT message '${message}' sent to topic '${topic}'`,
      note: "This is a placeholder - implement MQTT client for full functionality"
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
