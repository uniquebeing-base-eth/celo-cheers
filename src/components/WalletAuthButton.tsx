import { useState } from "react";
import { Loader2, LogIn, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCeloWallet } from "@/hooks/useCeloWallet";
import { useAuth } from "@/contexts/AuthContext";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Combined wallet-connect + SIWE sign-in button. */
export const WalletAuthButton = () => {
  const wallet = useCeloWallet();
  const { session, user, signInWithWallet, signOut } = useAuth();
  const [signing, setSigning] = useState(false);

  async function handleClick() {
    if (session) {
      await signOut();
      toast({ title: "Signed out" });
      return;
    }

    if (!wallet.address || !wallet.walletClient) {
      await wallet.connect();
      return;
    }

    setSigning(true);
    try {
      await signInWithWallet({
        wallet: wallet.address,
        signMessage: async (message) => {
          const sig = await wallet.walletClient!.signMessage({
            account: wallet.address!,
            message,
          });
          return sig;
        },
      });
      toast({ title: "Welcome!", description: "You're signed in." });
    } catch (e: any) {
      toast({
        title: "Sign-in failed",
        description: e?.shortMessage || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  }

  if (session && user) {
    const walletMeta = (user.user_metadata as any)?.wallet as string | undefined;
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={handleClick}
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        <span className="hidden sm:inline">
          {walletMeta ? shortAddr(walletMeta) : "Sign out"}
        </span>
        <span className="sm:hidden">Sign out</span>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={signing || wallet.connecting}
      className="rounded-full gradient-warm text-primary-foreground shadow-soft hover:opacity-95"
    >
      {signing || wallet.connecting ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : wallet.address ? (
        <LogIn className="mr-1.5 h-4 w-4" />
      ) : (
        <Wallet className="mr-1.5 h-4 w-4" />
      )}
      {signing
        ? "Signing…"
        : wallet.connecting
        ? "Connecting…"
        : wallet.address
        ? "Sign in"
        : "Connect"}
    </Button>
  );
};
