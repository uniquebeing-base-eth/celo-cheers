import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Coffee, Sparkles, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CoffeeMark } from "@/components/CoffeeMark";
import { ProfileCard } from "@/components/ProfileCard";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Index = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [featured, setFeatured] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Load featured creators (most recent).
  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setFeatured(data ?? []));
  }, []);

  // Debounced search.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20);
      setResults(data ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return;
    // If it matches exactly a username, go straight to them.
    const exact = [...results, ...featured].find((p) => p.username === q);
    if (exact) navigate(`/u/${exact.username}`);
    else navigate(`/u/${q}`);
  }

  return (
    <div className="min-h-screen bg-hero">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CoffeeMark className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">brewfund</span>
          </Link>
          <div className="flex items-center gap-2">
            {profile ? (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/u/${profile.username}`}>
                  <Coffee className="mr-1.5 h-4 w-4" />
                  My page
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/profile/edit">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Create profile
                </Link>
              </Button>
            )}
            <WalletAuthButton />
          </div>
        </div>
      </header>

      <main className="container py-10 sm:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Built on Celo
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Tip your favorite creators in{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              one click
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Search a creator by username or wallet. Send a tip in cUSD, cEUR,
            or CELO. Low fees, near-instant — and it works in MiniPay,
            Farcaster & MetaMask.
          </p>

          {/* Search */}
          <form onSubmit={onSubmit} className="mt-8">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a username…"
                className="h-14 rounded-2xl pl-12 pr-4 text-base shadow-soft"
                aria-label="Search creator by username"
              />
            </div>
          </form>

          {/* Search results */}
          {query.trim() && (
            <div className="mt-6 text-left">
              {searching ? (
                <p className="text-center text-sm text-muted-foreground">
                  Searching…
                </p>
              ) : results.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map((p) => (
                    <ProfileCard key={p.id} profile={p} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No creator found for “{query.trim()}”.
                  </p>
                  {!profile && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full"
                    >
                      <Link to="/profile/edit">
                        <LogIn className="mr-1.5 h-4 w-4" />
                        Claim this username
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Featured creators */}
        {!query.trim() && (
          <section className="mt-16">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <Coffee className="h-5 w-5 text-primary" />
              Featured creators
            </h2>
            {featured.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
                <p className="text-base font-medium">No creators yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be the first — create your profile and start receiving tips.
                </p>
                <Button asChild className="mt-4 rounded-full">
                  <Link to="/profile/edit">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Create profile
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Built on Celo · works with MiniPay, Farcaster & MetaMask
      </footer>
    </div>
  );
};

export default Index;
