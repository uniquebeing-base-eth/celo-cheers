import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoffeeMark } from "@/components/CoffeeMark";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { DonationCard } from "@/components/DonationCard";
import { SupportersList } from "@/components/SupportersList";
import { useAuth } from "@/contexts/AuthContext";
import { useCeloWallet } from "@/hooks/useCeloWallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/socials";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const wallet = useCeloWallet();
  const { profile: myProfile } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not-found">("loading");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!username) return;
    setStatus("loading");
    supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setStatus("not-found");
        else {
          setProfile(data);
          setStatus("ok");
        }
      });
  }, [username]);

  const isOwner = myProfile?.id === profile?.id;

  const socials = useMemo(
    () => (profile?.socials as SocialLinks) ?? {},
    [profile]
  );
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => socials[p.key]?.trim());

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Tip ${profile?.display_name ?? profile?.username}`,
          text: `Send a tip on Celo ☕`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Share it anywhere." });
      }
    } catch {
      /* cancelled */
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "not-found" || !profile) {
    return (
      <div className="min-h-screen bg-hero">
        <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <CoffeeMark className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-tight">brewfund</span>
            </Link>
            <WalletAuthButton />
          </div>
        </header>
        <main className="container flex min-h-[70vh] items-center justify-center py-10">
          <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <h1 className="text-2xl font-bold">@{username} isn't on brewfund yet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Want to claim this username? Sign in with your wallet and create
              a profile.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/">Back home</Link>
              </Button>
              <Button
                onClick={() => navigate("/profile/edit")}
                className="rounded-full"
              >
                Claim @{username}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CoffeeMark className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">brewfund</span>
          </Link>
          <WalletAuthButton />
        </div>
      </header>

      <main className="container py-8 sm:py-12">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 rounded-full"
        >
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Discover
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12">
          {/* Left: creator profile */}
          <section>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`${profile.display_name ?? profile.username} avatar`}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-accent/20"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/30 text-4xl font-bold text-primary">
                      {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1.5 shadow-soft">
                    <CoffeeMark className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                  {profile.bio && (
                    <p className="mt-3 text-base leading-relaxed text-foreground/80">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                {isOwner && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link to="/profile/edit">
                      <Edit className="mr-2 h-4 w-4" /> Edit profile
                    </Link>
                  </Button>
                )}
                {activeSocials.map(({ key, label, icon: Icon, href }) => (
                  <Button
                    key={key}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <a
                      href={href(socials[key])}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                    >
                      <Icon className="mr-2 h-4 w-4" /> {label}
                    </a>
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                Recent supporters
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  Public wall
                </span>
              </h2>
              <SupportersList refreshKey={refreshKey} />
            </div>
          </section>

          {/* Right: donation card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DonationCard
              wallet={wallet}
              recipient={{
                profileId: profile.id,
                wallet: profile.tip_wallet,
                name: profile.display_name || profile.username,
              }}
              onSuccess={() => setRefreshKey((k) => k + 1)}
            />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Built on Celo · works with MiniPay, Farcaster & MetaMask
      </footer>
    </div>
  );
};

export default PublicProfile;
