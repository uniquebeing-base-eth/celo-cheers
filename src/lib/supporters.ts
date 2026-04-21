// Local-only supporter wall (no backend).
export interface Supporter {
  id: string;
  address: string;
  amount: string;
  token: string;
  message: string;
  hash?: string;
  createdAt: number;
}

const KEY = "donation.supporters.v1";

export function loadSupporters(): Supporter[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Supporter[];
  } catch {
    return [];
  }
}

export function saveSupporter(s: Supporter) {
  const all = loadSupporters();
  all.unshift(s);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
