// Supported social platforms for creator profile cards.
import {
  Twitter,
  Github,
  Globe,
  Instagram,
  Youtube,
  Linkedin,
  Send,
  type LucideIcon,
} from "lucide-react";

export interface SocialPlatform {
  key: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  prefix?: string; // stripped when rendering a handle
  href: (value: string) => string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "twitter",
    label: "X / Twitter",
    placeholder: "your_handle",
    icon: Twitter,
    href: (v) =>
      v.startsWith("http") ? v : `https://twitter.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "farcaster",
    label: "Farcaster",
    placeholder: "your_handle",
    icon: Send,
    href: (v) =>
      v.startsWith("http") ? v : `https://warpcast.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "github",
    label: "GitHub",
    placeholder: "username",
    icon: Github,
    href: (v) =>
      v.startsWith("http") ? v : `https://github.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "username",
    icon: Instagram,
    href: (v) =>
      v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "@channel or full URL",
    icon: Youtube,
    href: (v) =>
      v.startsWith("http") ? v : `https://youtube.com/${v.replace(/^@/, "@")}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "in/your-name",
    icon: Linkedin,
    href: (v) =>
      v.startsWith("http") ? v : `https://linkedin.com/${v.replace(/^\//, "")}`,
  },
  {
    key: "website",
    label: "Website",
    placeholder: "https://yoursite.com",
    icon: Globe,
    href: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
];

export type SocialLinks = Record<string, string>;
