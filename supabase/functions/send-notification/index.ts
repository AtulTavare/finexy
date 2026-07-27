import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidPublicKey = Deno.env.get("VITE_VAPID_PUBLIC_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string): Promise<Response> {
  const { endpoint, keys } = subscription;
  const decodedKey = urlBase64ToUint8Array(keys.p256dh);
  const decodedAuth = urlBase64ToUint8Array(keys.auth);

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const serverPublicKey = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", publicKey: await crypto.subtle.importKey("raw", decodedKey, { name: "ECDH", namedCurve: "P-256" }, false, []), },
    serverKeyPair.private,
    256,
  );

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const prk = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const info = encoder.encode("Content-Encoding: aes128gcm\0");
  const prkRaw = await crypto.subtle.sign("HMAC", prk, info);

  const contentKey = await crypto.subtle.importKey(
    "raw",
    prkRaw,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    contentKey,
    payloadBytes,
  );

  const header = new Uint8Array(21);
  header[0] = 0;
  const saltView = new DataView(new Uint8Array(16).buffer);
  salt.forEach((b, i) => saltView.setUint8(i, b));
  header.set(salt, 0);
  const rs = 4096;
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = (decodedAuth.length & 0xff);

  const body = new Uint8Array(header.length + serverPublicKey.length + iv.length + encrypted.byteLength);
  body.set(header, 0);
  body.set(new Uint8Array(serverPublicKey), header.length);
  body.set(iv, header.length + serverPublicKey.length);
  body.set(new Uint8Array(encrypted), header.length + serverPublicKey.length + iv.length);

  const vapidKeyEncoded = urlBase64ToUint8Array(vapidPublicKey);
  const vapidKeyBase64 = btoa(String.fromCharCode(...vapidKeyEncoded)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwtHeader = btoa(JSON.stringify({ alg: "ES256", typ: "JWT", kid: vapidKeyBase64 }));
  const jwtPayload = btoa(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: "mailto:admin@infinity.com",
  }));

  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    urlBase64ToUint8Array(vapidPrivateKey).buffer,
    { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" },
    false,
    ["sign"],
  ) as CryptoKey;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    encoder.encode(`${jwtHeader}.${jwtPayload}`),
  );

  const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const token = `${jwtHeader}.${jwtPayload}.${jwtSignature}`;

  return fetch(endpoint, {
    method: "POST",
    body: body,
    headers: {
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
      "Authorization": `vapid t=${token}, k=${vapidKeyBase64}`,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    const { user_id, title, body, data, url } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_id, title" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body, icon: "/logo.png", badge: "/logo.png", data, url });

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, keys")
      .eq("user_id", user_id);

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const sub of subscriptions ?? []) {
      try {
        const resp = await sendPush(sub, payload);
        results.push({ endpoint: sub.endpoint.slice(0, 30) + "...", status: resp.status });

        if (resp.status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      } catch {
        results.push({ endpoint: sub.endpoint.slice(0, 30) + "...", status: "error" });
      }
    }

    await supabase.from("notifications").insert({
      user_id,
      role: data?.role ?? "admin",
      title,
      body,
      data,
      url,
    });

    return new Response(JSON.stringify({ sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
