// Issues a one-time nonce for Sign-In With Ethereum.
// Client signs the nonce with their wallet, then calls siwe-verify.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet } = await req.json();
    if (
      typeof wallet !== "string" ||
      !/^0x[a-fA-F0-9]{40}$/.test(wallet)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Random 32-byte hex nonce.
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const nonce = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expires_at = new Date(Date.now() + NONCE_TTL_MS).toISOString();

    const { error } = await supabase.from("auth_nonces").insert({
      nonce,
      wallet_address: wallet.toLowerCase(),
      expires_at,
    });

    if (error) {
      console.error("insert nonce error", error);
      return new Response(JSON.stringify({ error: "Failed to create nonce" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "brewfund.app";
    const host = origin.replace(/^https?:\/\//, "");
    const issuedAt = new Date().toISOString();

    // EIP-4361 style message. Keep it deterministic so the client can rebuild.
    const message =
      `${host} wants you to sign in with your Ethereum account:\n` +
      `${wallet}\n\n` +
      `Sign in to brewfund to manage your creator profile.\n\n` +
      `URI: ${origin}\n` +
      `Version: 1\n` +
      `Chain ID: 42220\n` +
      `Nonce: ${nonce}\n` +
      `Issued At: ${issuedAt}`;

    return new Response(
      JSON.stringify({ nonce, message, expires_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("siwe-nonce error", e);
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
