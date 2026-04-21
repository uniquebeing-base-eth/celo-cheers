// Configuration for the donation app.
// Replace these with your own creator address & relayer URL.

export const CREATOR = {
  name: "Alex Brewer",
  handle: "alexbrews",
  bio: "Indie maker shipping open-source tools. Your support keeps the espresso machine running ☕",
  address: "0x000000000000000000000000000000000000dEaD" as `0x${string}`,
};

// Relayer URL expected by senditwithcelo-sdk.
// You can leave this empty during development; donations will then be skipped on submit.
export const RELAYER_URL =
  (import.meta.env.VITE_RELAYER_URL as string) || "";

// Quick-select donation amounts (in cUSD).
export const QUICK_AMOUNTS = [1, 3, 5, 10] as const;
