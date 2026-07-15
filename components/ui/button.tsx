import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "link";
type ButtonSize = "md" | "sm";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-premium-gold text-midnight hover:bg-[#d9b438] active:bg-[#b8921f]",
  secondary:
    "border border-premium-gold/70 text-premium-gold hover:border-premium-gold hover:bg-premium-gold/10 active:bg-premium-gold/15",
  link: "px-0 text-premium-gold underline-offset-4 hover:text-warm-white hover:underline"
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-12 rounded px-6 text-base",
  sm: "min-h-10 rounded px-4 text-sm"
};

export function Button({
  children,
  className = "",
  href,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${
    variant === "link" ? "text-base" : sizeClasses[size]
  } ${className}`;

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
