import { NextRequest } from "next/server";

type Client = {
  id: string;
  writer: WritableStreamDefaultWriter<Uint8Array>;
};

type ChannelsStore = {
  channels: Record<string, Set<Client>>;
};

const store: ChannelsStore = (globalThis as any).__SSE_STORE__ ||= { channels: {} };

function getChannel(name: string): Set<Client> {
  if (!store.channels[name]) {
    store.channels[name] = new Set();
  }
  return store.channels[name];
}

async function broadcast(channelName: string, data: any) {
  const channel = getChannel(channelName);
  const encoder = new TextEncoder();
  const payload = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const client of channel) {
    try {
      await client.writer.write(payload);
    } catch {
      channel.delete(client);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channel = String(body?.channel || "hospital");
    const message = String(body?.message || "Ambulance en route");
    const hospitalId = String(body?.hospitalId || "");
    const meta = body?.meta || {};

    await broadcast(channel, {
      type: "notify",
      message,
      hospitalId,
      meta,
      ts: Date.now(),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


