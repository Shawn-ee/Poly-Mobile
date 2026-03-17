import BotMonitorDashboard from "@/components/admin/BotMonitorDashboard";
import { requireAdmin } from "@/lib/admin";

export default async function AdminBotsPage() {
  const admin = await requireAdmin();

  if ("error" in admin) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-neutral-600">
          {admin.status === 401 ? "Log in to access admin bot monitoring." : "You are not an admin."}
        </p>
      </main>
    );
  }

  return <BotMonitorDashboard />;
}
