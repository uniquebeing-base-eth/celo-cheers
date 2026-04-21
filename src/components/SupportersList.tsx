import { Heart } from "lucide-react";
import { loadSupporters, shortAddr, type Supporter } from "@/lib/supporters";
import { useEffect, useState } from "react";

interface Props {
  refreshKey: number;
}

export const SupportersList = ({ refreshKey }: Props) => {
  const [items, setItems] = useState<Supporter[]>([]);

  useEffect(() => {
    setItems(loadSupporters());
  }, [refreshKey]);

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
                  {s.address.slice(2, 4).toUpperCase()}
                </div>
                <span className="font-mono text-sm font-medium">
                  {shortAddr(s.address)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()}
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
                {s.amount} {s.token}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
