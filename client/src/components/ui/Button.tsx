import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "inverse" | "inverseOutline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-200",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:ring-brand-200",
  outline: "border border-slate-300 bg-white text-ink-700 hover:bg-slate-50 focus-visible:ring-slate-200",
  ghost: "text-ink-700 hover:bg-slate-100 focus-visible:ring-slate-200",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200",
  inverse: "bg-white text-brand-800 shadow-pop hover:bg-brand-50 focus-visible:ring-white/50",
  inverseOutline: "border border-white/40 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/30"
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9 p-0"
};

interface Props extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
