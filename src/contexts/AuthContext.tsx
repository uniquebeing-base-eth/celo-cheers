import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithWallet: (args: {
    wallet: string;
    signMessage: (msg: string) => Promise<string>;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(data ?? null);
  }

  useEffect(() => {
    // Set up listener BEFORE fetching session.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Defer profile load to avoid deadlock.
          setTimeout(() => {
            loadProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signInWithWallet({
    wallet,
    signMessage,
  }: {
    wallet: string;
    signMessage: (msg: string) => Promise<string>;
  }) {
    // 1. Get nonce + message from edge function.
    const nonceRes = await supabase.functions.invoke("siwe-nonce", {
      body: { wallet },
    });
    if (nonceRes.error || !nonceRes.data?.message) {
      throw new Error(nonceRes.error?.message || "Could not get nonce");
    }
    const { message } = nonceRes.data;

    // 2. Sign the message with the connected wallet.
    const signature = await signMessage(message);

    // 3. Verify on the server → returns token_hash + email.
    const verifyRes = await supabase.functions.invoke("siwe-verify", {
      body: { wallet, message, signature },
    });
    if (verifyRes.error || !verifyRes.data?.token_hash) {
      throw new Error(verifyRes.error?.message || "Signature verification failed");
    }
    const { token_hash } = verifyRes.data;

    // 4. Exchange token_hash for a session.
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash,
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  const value = useMemo(
    () => ({ session, user, profile, loading, signInWithWallet, signOut, refreshProfile }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
