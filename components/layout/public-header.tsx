import Link from "next/link";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
  { href: "/impressum", label: "Impressum" },
  { href: "/privacy", label: "Privacy" },
  { href: "/agb", label: "AGB" },
];

export const PublicHeader = () => (
  <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
    <div className="container flex h-16 items-center justify-between">
      <Link href="/" className="text-lg font-bold text-brand-900">
        ProBau<span className="text-swiss-red">.ch</span>
      </Link>

      <nav className="hidden items-center gap-6 md:flex">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-brand-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="secondary" size="sm">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Get started</Button>
        </Link>
      </div>
    </div>
  </header>
);
