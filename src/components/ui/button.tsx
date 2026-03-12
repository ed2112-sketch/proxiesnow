import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary: "bg-accent text-white hover:bg-accent-600 shadow-sm",
  secondary: "bg-navy text-white hover:bg-navy-700 shadow-sm",
  outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({ children, href, variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...props}>{children}</button>;
}
