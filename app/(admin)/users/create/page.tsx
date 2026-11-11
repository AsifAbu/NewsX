import { requireRole } from "@/lib/require-role";
import CreateUserForm from "@/components/CreateUserForm";

export default async function CreateUserPage() {
  await requireRole(["ADMIN"]);
  return <CreateUserForm />;
}
