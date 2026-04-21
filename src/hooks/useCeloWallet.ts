import { useCallback, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { celo } from "viem/chains";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type WalletKind = "minipay" | "metamask" | "farcaster" | "injected" | null;

export interface CeloWalletState {
  address: Address | null;
  kind: WalletKind;
  connecting: boolean;
  error: string | null;
  publicClient: PublicClient;
  walletClient: WalletClient | null;
}

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
}) as PublicClient;

function detectKind(): WalletKind {
  if (typeof window === "undefined") return null;
  const eth: any = window.ethereum;
  if (!eth) return null;
  if (eth.isMiniPay) return "minipay";
  if (eth.isMetaMask) return "metamask";
  // Farcaster frame wallet exposes a generic provider; treat as injected
  if (eth.isFarcaster || (window as any).farcaster) return "farcaster";
  return "injected";
}

export function useCeloWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [kind, setKind] = useState<WalletKind>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const buildWalletClient = useCallback((acct: Address) => {
    if (!window.ethereum) return null;
    return createWalletClient({
      account: acct,
      chain: celo,
      transport: custom(window.ethereum),
    });
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet detected. Open in MiniPay, Farcaster, or install MetaMask.");
      return;
    }
    setConnecting(true);
    try {
      // Try to switch to Celo
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xa4ec" }], // 42220
        });
      } catch {
        /* ignore — MiniPay is always on Celo */
      }
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const acct = accounts[0] as Address;
      setAddress(acct);
      const k = detectKind();
      setKind(k);
      setWalletClient(buildWalletClient(acct));
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [buildWalletClient]);

  // MiniPay auto-connect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth: any = window.ethereum;
    if (eth?.isMiniPay) {
      connect();
    }
  }, [connect]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handler = (accs: string[]) => {
      if (accs.length === 0) {
        setAddress(null);
        setWalletClient(null);
      } else {
        const acct = accs[0] as Address;
        setAddress(acct);
        setWalletClient(buildWalletClient(acct));
      }
    };
    window.ethereum.on("accountsChanged", handler);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handler);
    };
  }, [buildWalletClient]);

  return {
    address,
    kind,
    connecting,
    error,
    publicClient,
    walletClient,
    connect,
  } satisfies CeloWalletState & { connect: () => Promise<void> };
}
