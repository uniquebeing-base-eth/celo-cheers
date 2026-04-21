import { useState } from "react";
import { Share2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoffeeMark } from "@/components/CoffeeMark";
import { ConnectButton } from "@/components/ConnectButton";
import { DonationCard } from "@/components/DonationCard";
import { SupportersList } from "@/components/SupportersList";
import { useCeloWallet } from "@/hooks/useCeloWallet";
import { CREATOR } from "@/config/donation";
import { toast } from "@/hooks/use-toast";
import coffeeHero from "@/assets/coffee-hero.jpg";
import creatorAvatar from "@/assets/creator-avatar.jpg";

const Index = () => {
  const wallet = useCeloWallet();
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Support ${CREATOR.name}`,
          text: `Buy ${CREATOR.name} a coffee on Celo ☕`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Share it anywhere." });
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <CoffeeMark className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">brewfund</span>
          </div>
          <ConnectButton
            address={wallet.address}
            kind={wallet.kind}
            connecting={wallet.connecting}
            onConnect={wallet.connect}
          />
        </div>
      </header>

      <main className="container py-8 sm:py-12">
        {wallet.error && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {wallet.error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12">
          {/* Left: creator info + supporters */}
          <section>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <img
                    src={creatorAvatar}
                    alt={`${CREATOR.name} avatar`}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-accent/20"
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1.5 shadow-soft">
                    <CoffeeMark className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {CREATOR.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">@{CREATOR.handle}</p>
                  <p className="mt-3 text-base leading-relaxed text-foreground/80">
                    {CREATOR.bio}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share page
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Just bought ${CREATOR.name} a coffee on Celo ☕`
                    )}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Twitter className="mr-2 h-4 w-4" />
                    Tweet
                  </a>
                </Button>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="mt-6 hidden overflow-hidden rounded-3xl border border-border bg-card shadow-soft lg:block">
              <img
                src={coffeeHero}
                alt="A warm cup of coffee with a heart"
                width={1024}
                height={1024}
                className="h-64 w-full object-cover"
              />
            </div>

            {/* Supporters */}
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

export default Index;
