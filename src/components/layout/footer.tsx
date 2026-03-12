import Link from "next/link";
import { Container } from "@/components/ui/container";

const footerLinks = [
  { href: "/private-proxies", label: "Private Proxies" },
  { href: "/shared-proxies", label: "Shared Proxies" },
  { href: "/socks5-proxies", label: "SOCKS5 Proxies" },
  { href: "/residential-proxies", label: "Residential Proxies" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/tos", label: "TOS" },
];

export function Footer() {
  return (
    <footer className="bg-navy-800 py-12">
      <Container>
        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-navy-200 transition-colors hover:text-white">{link.label}</Link>
          ))}
        </nav>
        <div className="mt-8 text-center text-sm text-navy-400">
          Copyright &copy; 2010 - {new Date().getFullYear()} ProxiesNow. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
