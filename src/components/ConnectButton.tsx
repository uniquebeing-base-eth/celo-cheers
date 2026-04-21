import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/supporters";
import type { WalletKind } from "@/hooks/useCeloWallet";

interface Props {
  address: string | null;
  kind: WalletKind;
  connecting: boolean;
  onConnect: () => void;
}

const kindLabel: Record<NonNullable<WalletKind>, string> = {
  minipay: "MiniPay",
  metamask: "MetaMask",
  farcaster: "Farcaster",
  injected: "Wallet",
};

export const ConnectButton = ({ address, kind, connecting, onConnect }: Props) => {
  if (address) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-muted-foreground">{kind ? kindLabel[kind] : "Wallet"}</span>
        <span className="font-mono">{shortAddr(address)}</span>
      </div>
    );
  }
  return (
    <Button
      onClick={onConnect}
      disabled={connecting}
      size="lg"
      className="rounded-full gradient-warm text-primary-foreground shadow-warm hover:opacity-95 transition-smooth"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {connecting ? "Connecting…" : "Connect wallet"}
    </Button>
  );
};
