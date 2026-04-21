import { useMemo, useState } from "react";
import { CELO_TOKENS, sendTip } from "senditwithcelo-sdk";
import { Coffee, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CREATOR, QUICK_AMOUNTS, RELAYER_URL } from "@/config/donation";
import { saveSupporter } from "@/lib/supporters";
import type { useCeloWallet } from "@/hooks/useCeloWallet";

interface Props {
  wallet: ReturnType<typeof useCeloWallet>;
  onSuccess: () => void;
}

type TokenSymbol = "cUSD" | "cEUR" | "CELO";

export const DonationCard = ({ wallet, onSuccess }: Props) => {
  const [amount, setAmount] = useState<string>("3");
  const [message, setMessage] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>("cUSD");
  const [submitting, setSubmitting] = useState(false);

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
    if (!RELAYER_URL) {
      toast({
        title: "Relayer not configured",
        description:
          "Set VITE_RELAYER_URL to your senditwithcelo relayer endpoint to enable on-chain tips.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await sendTip({
        from: wallet.address,
        to: CREATOR.address,
        tokenAddress: token.address,
        amount,
        decimals: token.decimals,
        message: message || "thanks!",
        relayerUrl: RELAYER_URL,
        walletClient: wallet.walletClient as any,
        publicClient: wallet.publicClient as any,
      });
      saveSupporter({
        id: crypto.randomUUID(),
        address: wallet.address,
        amount,
        token: token.symbol,
        message,
        hash: result.hash,
        createdAt: Date.now(),
      });
      toast({
        title: "☕ Coffee delivered!",
        description: `Sent ${amount} ${token.symbol} — tx ${result.hash.slice(0, 10)}…`,
      });
      setMessage("");
      onSuccess();
    } catch (e: any) {
      toast({
        title: "Donation failed",
        description: e?.message || "Something went wrong. Please try again.",
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
        <h2 className="text-xl font-bold">Buy a coffee</h2>
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
