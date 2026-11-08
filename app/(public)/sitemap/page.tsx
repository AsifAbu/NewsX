import Link from "next/link";
import { prisma } from "@/lib/db";

const STATIC_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Search", href: "/search" },
  { label: "About Us", href: "/about" },
  { label: "Contact us", href: "/contact" },
  { label: "Advertisement", href: "/advertisement" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Comment Policy", href: "/comment-policy" },
];

export default async function SitemapPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-headline text-2xl font-bold">Sitemap</h1>

      <section>
        <h2 className="mb-2 font-headline text-lg font-bold">Pages</h2>
        <ul className="grid gap-1 sm:grid-cols-2">
          {STATIC_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-accent hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-headline text-lg font-bold">Categories</h2>
        <ul className="grid gap-1 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/?category=${c.id}`} className="text-accent hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
          {categories.length === 0 && <li className="text-neutral-500">No categories yet.</li>}
        </ul>
      </section>
    </div>
  );
}
