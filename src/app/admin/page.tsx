import Link from "next/link";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { getAdminCommandCenterSnapshot } from "@/server/services/adminCommandCenter";
import type { CommandCenterStatusItem } from "@/server/services/adminCommandCenter";

const statusTone: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-800",
  stopped: "border-neutral-300 bg-neutral-100 text-neutral-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  planned: "border-blue-200 bg-blue-50 text-blue-700",
};

export default async function AdminCommandCenterPage() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return (
      <AdminShell
        active="overview"
        title="Command Center"
        description="Admin access is required to view backend/runtime operations."
      >
        <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          {admin.status === 401 ? "Log in to access the admin command center." : "You are not an admin."}
        </section>
      </AdminShell>
    );
  }

  const snapshot = await getAdminCommandCenterSnapshot();
  const implemented = snapshot.sections.filter((section) => section.implemented);
  const placeholders = snapshot.sections.filter((section) => !section.implemented);

  return (
    <AdminShell
      active="overview"
      title="Command Center"
      description="Unified read-only operations overview for backend health, runtime services, provider data, bots, settlement readiness, mobile proof, and production safety boundaries."
      actions={
        <>
          <Link className={actionClass} href="/admin/events">
            Events & Markets
          </Link>
          <Link className={actionClass} href="/admin/system">
            Runtime Services
          </Link>
          <Link className={actionClass} href="/admin/bots">
            Bots
          </Link>
        </>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Overall status" value={snapshot.status} status={snapshot.status} />
        <Metric label="Live markets" value={`${snapshot.metrics.activePublicMarkets} / ${snapshot.metrics.totalPublicMarkets}`} />
        <Metric label="Imported markets/outcomes" value={`${snapshot.metrics.importedMarketCount} / ${snapshot.metrics.importedOutcomeCount}`} />
        <Metric label="Provider snapshots" value={snapshot.metrics.providerSnapshotCount} />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">Operational Status</h2>
              <p className="mt-1 text-xs text-neutral-500">Generated {formatDate(snapshot.generatedAt)}</p>
            </div>
            <StatusBadge status={snapshot.status} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.overview.statuses.map((item) => (
              <StatusCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-base font-semibold text-neutral-950">Current Event & Next Action</h2>
          <div className="mt-3 text-sm">
            <div className="text-xs uppercase text-neutral-500">Active/internal tester event</div>
            <div className="mt-1 font-semibold text-neutral-950">{snapshot.event?.title ?? "Unknown"}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {snapshot.event?.slug ?? "No event slug"} · {snapshot.event?.status ?? snapshot.event?.liveStatus ?? "unknown"}
            </div>
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="text-xs font-semibold uppercase">Suggested next action</div>
            <div className="mt-1">{snapshot.overview.nextAction}</div>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Info label="Provider latest" value={snapshot.providerData.latestSnapshot?.fetchedAt ? formatDate(snapshot.providerData.latestSnapshot.fetchedAt) : "Unknown"} />
            <Info label="Runtime state" value={snapshot.localRuntime.currentState ?? "Unknown"} />
            <Info label="Pending settlement reviews" value={String(snapshot.metrics.pendingSettlementReviews)} />
            <Info label="Pending withdrawals" value={String(snapshot.metrics.pendingWithdrawals)} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Panel title="Current Blockers">
          {snapshot.overview.blockers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="py-2 pr-3">Area</th>
                    <th className="py-2 pr-3">Blocker</th>
                    <th className="py-2 pr-3">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.overview.blockers.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100 align-top">
                      <td className="py-2 pr-3 font-medium">{item.label}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{item.blocker}</td>
                      <td className="py-2 pr-3 text-neutral-700">{item.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">No command-center blockers reported.</p>
          )}
        </Panel>

        <Panel title="Section Coverage">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Info label="Implemented" value={implemented.map((section) => section.label).join(", ")} />
            <Info label="Read-only / planned" value={placeholders.map((section) => section.label).join(", ")} />
            <Info label="Production boundary" value={snapshot.overview.statuses.find((item) => item.id === "production-readiness")?.nextAction ?? "Unknown"} />
            <Info label="Environment" value={`${snapshot.environment.env} / node ${snapshot.environment.nodeEnv}`} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Panel title="Bots & Liquidity">
          <div className="grid gap-2 text-sm">
            <Info label="Active bots" value={String(snapshot.metrics.botOverview?.activeBots ?? 0)} />
            <Info label="Open bot orders" value={String(snapshot.metrics.botOverview?.totalOpenOrders ?? 0)} />
            <Info label="Fills today" value={String(snapshot.metrics.botOverview?.totalFillsToday ?? 0)} />
            <Info label="API errors today" value={String(snapshot.metrics.botOverview?.totalApiErrorsToday ?? 0)} />
          </div>
        </Panel>
        <Panel title="Provider Data">
          <div className="grid gap-2 text-sm">
            <Info label="Latest source" value={snapshot.providerData.latestSnapshot?.source ?? "Unknown"} />
            <Info label="Latest quality" value={snapshot.providerData.latestSnapshot?.qualityStatus ?? "Unknown"} />
            <Info label="Provider run" value={snapshot.providerData.latestProviderRun?.status ?? "Unknown"} />
            <Info label="Quota cost latest run" value={String(snapshot.providerData.latestProviderRun?.quotaCost ?? 0)} />
          </div>
        </Panel>
        <Panel title="Environment Flags">
          <div className="grid gap-2 text-sm">
            {Object.entries(snapshot.environment.envPresence).map(([key, present]) => (
              <Info key={key} label={key} value={present ? "Present" : "Missing"} />
            ))}
          </div>
        </Panel>
      </section>
    </AdminShell>
  );
}

const actionClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-500 hover:text-neutral-950";

function Metric({ label, value, status }: { label: string; value: string | number; status?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase text-neutral-500">{label}</div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold text-neutral-950">{value}</div>
    </div>
  );
}

function StatusCard({ item }: { item: CommandCenterStatusItem }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-neutral-950">{item.label}</div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.localOnly ? <SmallBadge>Local Only</SmallBadge> : null}
        {item.productionSafe ? <SmallBadge>Production Safe</SmallBadge> : null}
        {!item.productionSafe && item.productionSafe !== undefined ? <SmallBadge>Not Production Safe</SmallBadge> : null}
      </div>
      <div className="mt-2 text-xs text-neutral-500">{item.lastUpdated ? formatDate(item.lastUpdated) : "No timestamp"}</div>
      {item.blocker ? <div className="mt-2 font-mono text-xs text-red-700">{item.blocker}</div> : null}
      <div className="mt-2 text-xs text-neutral-700">{item.nextAction}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-1 break-words text-neutral-900">{value || "Unknown"}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone[status] ?? statusTone.unknown}`}>
      {status}
    </span>
  );
}

function SmallBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600">
      {children}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
