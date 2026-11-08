// Shared skeleton-loader building blocks, composed by each route's loading.tsx
// into a shape that roughly matches the real page (see docs/RULES.md — Next.js
// App Router renders these automatically via Suspense while a page's data loads).

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/10 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 md:col-span-2">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-4 rounded-lg border border-black/10 p-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-6 w-5 shrink-0" />
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </aside>
      </section>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-5">
      <article className="space-y-4 md:col-span-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-5/6" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-3 border-t border-black/10 pt-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
      </article>
      <aside className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-16 w-20 shrink-0" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-7 w-48" />
      <ul className="divide-y divide-black/10">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="space-y-2 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Skeleton className="h-7 w-40" />
      <div className="space-y-3">
        <div className="flex gap-4 border-b border-black/10 pb-2">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="mx-auto max-w-sm space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function PostFormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
