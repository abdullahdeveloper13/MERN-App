import { cn } from "../../utils/cn";
import { getInitials } from "../../utils/format";

export function Avatar({
  src,
  name,
  size = "md",
  className
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl"
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "Avatar"}
        className={cn("rounded-full object-cover", dimensions[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800",
        dimensions[size],
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
