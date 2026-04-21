import { Link } from "react-router-dom";
import { CoffeeMark } from "@/components/CoffeeMark";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/socials";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  profile: Profile;
  as?: "link" | "static";
}

export const ProfileCard = ({ profile, as = "link" }: Props) => {
  const socials = (profile.socials ?? {}) as SocialLinks;
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => socials[p.key]?.trim());

  const content = (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-smooth hover:shadow-warm">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name ?? profile.username} avatar`}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/30 text-xl font-bold text-primary">
              {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 shadow-soft">
            <CoffeeMark className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">
            {profile.display_name || profile.username}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            @{profile.username}
          </p>
          {profile.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
              {profile.bio}
            </p>
          )}
          {activeSocials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeSocials.map(({ key, icon: Icon }) => (
                <span
                  key={key}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (as === "static") return content;
  return <Link to={`/u/${profile.username}`}>{content}</Link>;
};
