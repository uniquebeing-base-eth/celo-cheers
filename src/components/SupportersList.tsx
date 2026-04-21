import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/supporters";
import type { Database } from "@/integrations/supabase/types";

type Receipt = Database["public"]["Tables"]["receipts"]["Row"];

interface Props {
  refreshKey: number;
  /** When provided, only shows receipts for this recipient profile. */
  recipientProfileId?: string;
}

export const SupportersList = ({ refreshKey, recipientProfileId }: Props) => {
  const [items, setItems] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let q = supabase
        .from("receipts")
        .select("*")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (recipientProfileId) {
        q = q.eq("recipient_profile_id", recipientProfileId);
      }
      const { data } = await q;
      if (!cancelled) {
        setItems(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, recipientProfileId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Loading supporters…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Be the first to buy a coffee ☕
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li
          key={s.id}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-smooth hover:shadow-warm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-warm text-xs font-bold text-primary-foreground">
                  {s.sender_wallet.slice(2, 4).toUpperCase()}
                </div>
                <span className="font-mono text-sm font-medium">
                  {shortAddr(s.sender_wallet)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
              {s.message && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  "{s.message}"
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-primary">
                {s.amount} {s.token_symbol}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
