import { Coffee } from "lucide-react";

export const CoffeeMark = ({ className = "h-6 w-6" }: { className?: string }) => (
  <div className="relative inline-flex">
    <Coffee className={className} />
    <span className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent/60 animate-steam" />
    <span
      className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent/40 animate-steam"
      style={{ animationDelay: "0.6s" }}
    />
  </div>
);
