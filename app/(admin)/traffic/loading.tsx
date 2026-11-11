import { Skeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-black/10 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
