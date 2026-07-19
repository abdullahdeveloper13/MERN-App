import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ className, children, ...props }: Props) {
  return (
    <button className={["btn", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
