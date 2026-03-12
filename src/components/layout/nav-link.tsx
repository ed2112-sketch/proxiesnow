"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`text-sm font-medium transition-colors hover:text-accent ${isActive ? "text-accent" : "text-navy-200"}`}>
      {children}
    </Link>
  );
}
