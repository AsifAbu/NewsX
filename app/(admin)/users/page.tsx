import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Users</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-neutral-500">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {users.map((u) => {
            const deactivated = u.deactivatedAt && u.deactivatedAt <= now;
            const scheduled = u.deactivatedAt && u.deactivatedAt > now;
            return (
              <tr key={u.id}>
                <td className="py-2">
                  <Link href={`/users/${u.id}`} className="font-medium hover:text-accent">
                    {u.name}
                  </Link>
                </td>
                <td className="py-2 text-neutral-600">{u.email}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">
                  {deactivated && <span className="text-red-600">Deactivated</span>}
                  {scheduled && (
                    <span className="text-amber-600">
                      Scheduled {u.deactivatedAt!.toLocaleString()}
                    </span>
                  )}
                  {!u.deactivatedAt && <span className="text-green-700">Active</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
