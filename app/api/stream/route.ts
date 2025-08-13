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

function writeSSE(writer: WritableStreamDefaultWriter<Uint8Array>, data: any) {
  const encoder = new TextEncoder();
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  return writer.write(encoder.encode(payload));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelName = searchParams.get("channel") || "hospital";
  const clientId = crypto.randomUUID();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Register client
  const channel = getChannel(channelName);
  const client: Client = { id: clientId, writer };
  channel.add(client);

  // Initial kick
  await writeSSE(writer, { type: "connected", clientId, channel: channelName, ts: Date.now() });

  // Remove on close
  const abort = req.signal;
  const ping = setInterval(() => {
    try { writeSSE(writer, { type: "ping", ts: Date.now() }); } catch {}
  }, 15000);
  abort.addEventListener("abort", () => {
    try {
      channel.delete(client);
      writer.close();
      clearInterval(ping);
    } catch {}
  });

  return new Response(stream.readable, { headers });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


