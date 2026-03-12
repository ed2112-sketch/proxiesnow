"use client";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { NavLink } from "./nav-link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/private-proxies", label: "Private Proxies" },
  { href: "/shared-proxies", label: "Shared Proxies" },
  { href: "/socks5-proxies", label: "SOCKS5 Proxies" },
  { href: "/residential-proxies", label: "Residential Proxies" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="bg-navy-800 sticky top-0 z-50">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">ProxiesNow</Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
            ))}
            <Button href="/login" variant="primary" size="sm">Sign In</Button>
          </nav>
          <button className="text-white md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="flex flex-col gap-4 pb-4 md:hidden">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
            ))}
            <Button href="/login" variant="primary" size="sm">Sign In</Button>
          </nav>
        )}
      </Container>
    </header>
  );
}
