import Link from "next/link";
import { auth } from "@/lib/auth";

// Dummy/placeholder contact details and social links — swap for the real
// NewsX accounts and numbers later (see CLAUDE.md "original data add later").
const EMAIL = "contact@newsx.example";
const WHATSAPP = "+880 1XXX-XXXXXX";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
];

const FOOTER_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact us", href: "/contact" },
  { label: "Sitemap", href: "/sitemap" },
  { label: "Advertisement", href: "/advertisement" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Comment Policy", href: "/comment-policy" },
];

function SocialIcon({ label }: { label: string }) {
  const common = "h-4 w-4 fill-current";
  switch (label) {
    case "Facebook":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v7h4v-7h3l1-4h-4v-2c0-.6.4-1 1-1z" />
        </svg>
      );
    case "Twitter":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.3 1.7-2.3-.8.5-1.7.8-2.6 1-1.5-1.6-4-1.7-5.6-.2-1 .9-1.4 2.3-1.2 3.6-3.3-.2-6.3-1.8-8.3-4.3-.3.6-.5 1.3-.5 2 0 1.4.7 2.6 1.8 3.3-.6 0-1.3-.2-1.8-.5v.1c0 1.9 1.4 3.5 3.2 3.9-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2 2.8 3.8 2.8-1.4 1.1-3.2 1.8-5.1 1.8-.3 0-.7 0-1-.1 1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M12 2c2.7 0 3 0 4.1.1 1.1 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1.1.4 2.2.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1.1-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.3-2.2.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1.1 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1.1-.4-2.2C2 15 2 14.7 2 12s0-3 .1-4.1c0-1.1.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.3 2.2-.4C8 2 8.3 2 11 2zm0 1.8c-2.6 0-2.9 0-4 .1-.9 0-1.4.2-1.7.3-.4.2-.7.3-1 .6-.3.3-.5.6-.6 1-.1.3-.3.8-.3 1.7-.1 1.1-.1 1.4-.1 4s0 2.9.1 4c0 .9.2 1.4.3 1.7.1.4.3.7.6 1 .3.3.6.5 1 .6.3.1.8.3 1.7.3 1.1.1 1.4.1 4 .1s2.9 0 4-.1c.9 0 1.4-.2 1.7-.3.4-.1.7-.3 1-.6.3-.3.5-.6.6-1 .1-.3.3-.8.3-1.7.1-1.1.1-1.4.1-4s0-2.9-.1-4c0-.9-.2-1.4-.3-1.7-.1-.4-.3-.7-.6-1-.3-.3-.6-.5-1-.6-.3-.1-.8-.3-1.7-.3-1.1-.1-1.4-.1-4-.1zm0 3.5a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8zm5-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M21.6 7.2s-.2-1.5-.8-2.2c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4s-3.9 0-6.7.1c-.4.1-1.3.1-2.1.9-.6.7-.8 2.2-.8 2.2S2.2 9 2.2 10.8v1.4c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.2c.8.8 1.9.8 2.3.9 1.7.2 7.1.2 7.1.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.7.8-2.2.8-2.2s.2-1.8.2-3.6v-1.4c0-1.8-.2-3.6-.2-3.6zM9.9 14.6V8.8l5.3 2.9-5.3 2.9z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function Footer() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-white">
      {/* Top bar: email / social / WhatsApp — placeholder data, see CLAUDE.md */}
      <div className="border-b border-black/10">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 divide-y divide-black/10 px-4 py-4 text-center text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-2 sm:py-0">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Email Us</p>
            <a href={`mailto:${EMAIL}`} className="text-neutral-700 hover:text-accent">
              {EMAIL}
            </a>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Follow Us</p>
            <div className="mt-1 flex justify-center gap-4 text-neutral-700">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} className="hover:text-accent">
                  <SocialIcon label={s.label} />
                </a>
              ))}
            </div>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs uppercase tracking-wide text-neutral-400">WhatsApp</p>
            <span className="text-neutral-700">{WHATSAPP}</span>
          </div>
        </div>
      </div>

      {/* Bottom bar: logo | nav links | copyright */}
      <div className="bg-neutral-900 text-neutral-300">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-4 px-4 py-6 text-sm sm:flex-row sm:justify-between">
          <Link href="/" className="font-headline text-xl font-bold text-white">
            News<span className="text-accent">X</span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/traffic" className="hover:text-white">
                Site Traffic
              </Link>
            )}
          </nav>

          <div className="text-center text-xs text-neutral-400 sm:text-right">
            <p>
              Copyright © {year} NewsX. All rights reserved.
            </p>
            <p>Technical Partner: TBD</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
