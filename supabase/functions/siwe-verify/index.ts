// Verifies a signed SIWE message, consumes the nonce, creates/links a Supabase
// user keyed to the wallet address, and returns a magic-link that the client
// exchanges for a session.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { verifyMessage, getAddress } from "https://esm.sh/viem@2.21.25";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function walletEmail(wallet: string) {
  // Deterministic pseudo-email for the auth.users row. Never delivered.
  return `${wallet.toLowerCase()}@wallet.brewfund.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet, message, signature } = await req.json();

    if (
      typeof wallet !== "string" ||
      !/^0x[a-fA-F0-9]{40}$/.test(wallet) ||
      typeof message !== "string" ||
      typeof signature !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checksummed = getAddress(wallet);

    // Pull nonce from message so we can validate it against the DB.
    const nonceMatch = message.match(/\nNonce:\s*([a-f0-9]{64})\n/);
    if (!nonceMatch) {
      return new Response(JSON.stringify({ error: "Nonce missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const nonce = nonceMatch[1];

    // Signature verification
    const valid = await verifyMessage({
      address: checksummed as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify nonce: exists, matches wallet, not expired, not consumed.
    const { data: row, error: nonceErr } = await supabase
      .from("auth_nonces")
      .select("*")
      .eq("nonce", nonce)
      .maybeSingle();

    if (nonceErr || !row) {
      return new Response(JSON.stringify({ error: "Unknown nonce" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.consumed_at) {
      return new Response(JSON.stringify({ error: "Nonce already used" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Nonce expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.wallet_address.toLowerCase() !== checksummed.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Wallet mismatch" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark nonce consumed.
    await supabase
      .from("auth_nonces")
      .update({ consumed_at: new Date().toISOString() })
      .eq("nonce", nonce);

    const email = walletEmail(checksummed);

    // Ensure a user exists for this wallet.
    const { data: list } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    // listUsers doesn't filter by email; use getUserByEmail-ish pattern.
    // Easier: try to create; if already exists, fetch via admin list with filter.
    let userId: string | null = null;
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { wallet: checksummed },
      });
    if (createErr) {
      // Likely already exists — find them.
      const { data: allUsers } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const match = allUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      userId = match?.id ?? null;
    } else {
      userId = created.user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Failed to provision user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magiclink the client exchanges for a session via verifyOtp.
    const { data: linkData, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    if (linkErr || !linkData) {
      console.error("generateLink error", linkErr);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token_hash = linkData.properties?.hashed_token;
    if (!token_hash) {
      return new Response(
        JSON.stringify({ error: "Failed to create session token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        email,
        token_hash,
        wallet: checksummed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("siwe-verify error", e);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
