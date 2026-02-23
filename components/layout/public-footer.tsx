import Link from "next/link";

const links = [
  { href: "/impressum", label: "Impressum" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/agb", label: "AGB" },
];

export const PublicFooter = () => (
  <footer className="border-t border-neutral-200 bg-white">
    <div className="container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-neutral-600">
        © {new Date().getFullYear()} ProBau.ch AG. All rights reserved.
      </p>
      <div className="flex items-center gap-5">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-neutral-600 transition-colors hover:text-brand-900"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  </footer>
);
