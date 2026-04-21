import { useMemo, useState } from "react";
import { CELO_TOKENS } from "senditwithcelo-sdk";
import { parseUnits, encodeFunctionData, type Address } from "viem";
import { celo } from "viem/chains";
import { Coffee, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { QUICK_AMOUNTS } from "@/config/donation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { useCeloWallet } from "@/hooks/useCeloWallet";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface Recipient {
  profileId: string | null; // null if tipping a wallet not tied to a profile
  wallet: string;
  name: string;
}

interface Props {
  wallet: ReturnType<typeof useCeloWallet>;
  recipient: Recipient;
  onSuccess: () => void;
}

type TokenSymbol = "cUSD" | "cEUR" | "CELO";

export const DonationCard = ({ wallet, recipient, onSuccess }: Props) => {
  const [amount, setAmount] = useState<string>("3");
  const [message, setMessage] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>("cUSD");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const token = useMemo(
    () => CELO_TOKENS.find((t) => t.symbol === tokenSymbol) ?? CELO_TOKENS[0],
    [tokenSymbol]
  );

  const availableSymbols = useMemo(
    () => CELO_TOKENS.map((t) => t.symbol as TokenSymbol),
    []
  );

  const canSubmit =
    !!wallet.address &&
    !!wallet.walletClient &&
    !submitting &&
    Number(amount) > 0;

  async function handleSend() {
    if (!wallet.address || !wallet.walletClient) {
      await wallet.connect();
      return;
    }
    setSubmitting(true);
    try {
      const value = parseUnits(amount, token.decimals);
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [recipient.wallet as Address, value],
      });

      const hash: `0x${string}` = await (wallet.walletClient as any).sendTransaction({
        account: wallet.address,
        chain: celo,
        to: token.address as Address,
        data,
        value: 0n,
      });

      // Log receipt to DB (RLS allows anyone to insert; only sender_user_id
      // is attached if signed in).
      const { error: recErr } = await supabase.from("receipts").insert({
        recipient_profile_id: recipient.profileId,
        recipient_wallet: recipient.wallet,
        sender_wallet: wallet.address,
        sender_user_id: user?.id ?? null,
        token_symbol: token.symbol,
        token_address: token.address,
        amount,
        message: message || null,
        tx_hash: hash,
      });
      if (recErr) {
        console.warn("Failed to log receipt", recErr);
      }

      toast({
        title: "☕ Coffee delivered!",
        description: `Sent ${amount} ${token.symbol} to ${recipient.name} — tx ${hash.slice(0, 10)}…`,
      });
      setMessage("");
      onSuccess();
    } catch (e: any) {
      toast({
        title: "Donation failed",
        description: e?.shortMessage || e?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-warm sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold">Buy {recipient.name} a coffee</h2>
      </div>

      {/* Token picker */}
      <div className="mb-5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Token
        </Label>
        <div className="mt-2 inline-flex rounded-full bg-muted p-1">
          {availableSymbols.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTokenSymbol(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-smooth ${
                tokenSymbol === s
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mb-5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Quick amount
        </Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((a) => {
            const active = amount === String(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-bounce ${
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Coffee
                  className={`h-5 w-5 transition-smooth ${
                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  }`}
                />
                <span className={`mt-1 text-sm font-bold ${active ? "text-primary" : ""}`}>
                  {a}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom amount */}
      <div className="mb-5">
        <Label htmlFor="amount" className="text-xs uppercase tracking-wide text-muted-foreground">
          Custom amount ({token.symbol})
        </Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 h-12 rounded-xl text-lg font-semibold"
          placeholder="0.00"
        />
      </div>

      {/* Message */}
      <div className="mb-6">
        <Label htmlFor="msg" className="text-xs uppercase tracking-wide text-muted-foreground">
          Message (optional)
        </Label>
        <Textarea
          id="msg"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 140))}
          className="mt-2 rounded-xl resize-none"
          rows={3}
          placeholder="Say something nice…"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {message.length}/140
        </div>
      </div>

      <Button
        onClick={handleSend}
        disabled={!canSubmit && !!wallet.address}
        size="lg"
        className="w-full rounded-2xl gradient-warm text-primary-foreground shadow-warm hover:opacity-95 transition-smooth h-14 text-base font-bold"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending…
          </>
        ) : !wallet.address ? (
          <>Connect wallet to donate</>
        ) : (
          <>
            <Coffee className="mr-2 h-5 w-5" />
            Send {amount || "0"} {token.symbol}
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Powered by Celo · low-cost, near-instant
      </p>
    </div>
  );
};
