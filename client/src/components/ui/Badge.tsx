import type { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

type Tone = "slate" | "brand" | "green" | "amber" | "rose" | "violet";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700"
};

export function Badge({
  tone = "slate",
  className,
  children
}: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  published: "green",
  active: "green",
  hired: "green",
  verified: "green",
  offered: "brand",
  interview: "violet",
  shortlisted: "amber",
  reviewing: "amber",
  applied: "slate",
  draft: "slate",
  paused: "amber",
  closed: "rose",
  archived: "rose",
  rejected: "rose",
  withdrawn: "rose"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "slate"}>{status.replaceAll("_", " ")}</Badge>;
}
