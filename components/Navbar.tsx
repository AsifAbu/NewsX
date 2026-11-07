import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

// Free, keyless weather API (Open-Meteo). Default location is a placeholder
// (Dhaka) — not in the original BRD/SRS; swap coordinates or wire up
// geolocation later. Fails silently so a weather outage never breaks the nav.
const WEATHER_CODE_LABEL: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  51: "Drizzle",
  61: "Rain",
  63: "Rain",
  80: "Showers",
  95: "Thunderstorm",
};

async function getWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=23.81&longitude=90.41&current_weather=true",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = Math.round(data?.current_weather?.temperature);
    const code = data?.current_weather?.weathercode;
    if (Number.isNaN(temp)) return null;
    return { temp, label: WEATHER_CODE_LABEL[code] ?? "" };
  } catch {
    return null;
  }
}

export default async function Navbar() {
  const session = await auth();

  const [categories, weather, notifications, unreadCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getWeather(),
    session?.user
      ? prisma.notification.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 15,
        })
      : Promise.resolve([]),
    session?.user
      ? prisma.notification.count({ where: { userId: session.user.id, isRead: false } })
      : Promise.resolve(0),
  ]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="border-b border-black/10 bg-white">
      {/* Row 1: logo + date/weather */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-headline text-2xl font-bold">
          News<span className="text-accent">X</span>
        </Link>
        <div className="text-sm text-neutral-500">
          {today}
          {weather && (
            <span className="ml-3">
              {weather.temp}°C{weather.label ? ` · ${weather.label}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: categories + search (3/4 width) | notifications + user (1/4 width) —
          same grid-cols-4 split as the content pages, so both align vertically. */}
      <div className="border-t border-black/10">
        <div className="mx-auto grid max-w-6xl grid-cols-4 items-center gap-5 px-4 py-2">
          <div className="col-span-3 flex items-center gap-4">
            <nav className="flex flex-1 gap-4 overflow-x-auto">
              <Link href="/" className="whitespace-nowrap text-sm font-medium text-neutral-700 hover:text-accent">
                Latest
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className="whitespace-nowrap text-sm font-medium text-neutral-700 hover:text-accent"
                >
                  {c.name}
                </Link>
              ))}
            </nav>

            <form action="/search" className="hidden items-center sm:flex">
              <input
                name="q"
                placeholder="Search"
                className="w-40 rounded-l border border-r-0 border-black/10 px-2 py-1 text-sm"
              />
              <button
                type="submit"
                aria-label="Search"
                className="rounded-r border border-black/10 bg-neutral-50 px-2 py-1 text-sm hover:text-accent"
              >
                🔍
              </button>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 text-sm">
            {session?.user ? (
              <>
                <NotificationBell
                  notifications={notifications.map((n) => ({
                    id: n.id,
                    message: n.message,
                    link: n.link,
                    isRead: n.isRead,
                    createdAt: n.createdAt.toISOString(),
                  }))}
                  unreadCount={unreadCount}
                />
                <UserMenu name={session.user.name ?? ""} role={session.user.role} />
              </>
            ) : (
              <Link
                href="/login"
                className="ml-auto whitespace-nowrap rounded bg-accent px-3 py-1.5 text-white hover:opacity-90"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
