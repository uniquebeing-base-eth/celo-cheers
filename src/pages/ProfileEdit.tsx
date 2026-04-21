import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CoffeeMark } from "@/components/CoffeeMark";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCeloWallet } from "@/hooks/useCeloWallet";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/socials";
import { toast } from "@/hooks/use-toast";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

const ProfileEdit = () => {
  const { session, profile, loading, refreshProfile, user } = useAuth();
  const wallet = useCeloWallet();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [tipWallet, setTipWallet] = useState("");
  const [socials, setSocials] = useState<SocialLinks>({});
  const [saving, setSaving] = useState(false);

  // Seed form when profile loads.
  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setTipWallet(profile.tip_wallet);
      setSocials((profile.socials as SocialLinks) ?? {});
    } else if (user) {
      // Default tip wallet = connected wallet from user metadata.
      const metaWallet = (user.user_metadata as any)?.wallet;
      if (metaWallet && !tipWallet) setTipWallet(metaWallet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;

    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      toast({
        title: "Invalid username",
        description: "3–30 characters, lowercase letters, numbers, underscores.",
        variant: "destructive",
      });
      return;
    }
    if (!WALLET_RE.test(tipWallet.trim())) {
      toast({
        title: "Invalid tip wallet",
        description: "Must be a valid 0x… Ethereum/Celo address.",
        variant: "destructive",
      });
      return;
    }

    const cleanedSocials = Object.fromEntries(
      Object.entries(socials)
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v)
    );

    setSaving(true);
    try {
      const payload = {
        user_id: session.user.id,
        username: u,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        tip_wallet: tipWallet.trim(),
        socials: cleanedSocials,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Username taken",
            description: "Try a different one.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Could not save",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      await refreshProfile();
      toast({ title: "Profile saved!" });
      navigate(`/u/${u}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
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
            <Wallet className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">Sign in to create a profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your wallet and sign a message. No email, no password —
              your wallet is your identity.
            </p>
            <div className="mt-6 flex justify-center">
              <WalletAuthButton />
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

      <main className="container max-w-2xl py-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 rounded-full"
        >
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Link>
        </Button>

        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          <h1 className="text-2xl font-bold">
            {profile ? "Edit your profile" : "Create your profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your public page will live at{" "}
            <span className="font-mono">
              /u/{username || "your-username"}
            </span>
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().slice(0, 30))
                }
                placeholder="alex_brews"
                className="mt-1.5 rounded-xl"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                3–30 chars. lowercase letters, numbers, underscores.
              </p>
            </div>

            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 60))}
                placeholder="Alex Brewer"
                className="mt-1.5 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                placeholder="What do you create?"
                rows={3}
                className="mt-1.5 rounded-xl resize-none"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {bio.length}/300
              </div>
            </div>

            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1.5 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="tipWallet">Tip wallet *</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="tipWallet"
                  value={tipWallet}
                  onChange={(e) => setTipWallet(e.target.value)}
                  placeholder="0x…"
                  className="rounded-xl font-mono text-sm"
                  required
                />
                {wallet.address && wallet.address !== tipWallet && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTipWallet(wallet.address!)}
                    className="rounded-xl whitespace-nowrap"
                  >
                    Use connected
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tips are sent directly to this address on Celo.
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Social links</Label>
              <div className="space-y-2">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Input
                      aria-label={label}
                      value={socials[key] ?? ""}
                      onChange={(e) =>
                        setSocials((s) => ({ ...s, [key]: e.target.value }))
                      }
                      placeholder={`${label} — ${placeholder}`}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="mt-8 w-full rounded-2xl gradient-warm text-primary-foreground shadow-warm hover:opacity-95 h-13 font-bold"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {profile ? "Save changes" : "Create profile"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ProfileEdit;
