"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { CommandCenterServiceItem } from "@/server/services/adminCommandCenter";

type CommandCenterPayload = {
  generatedAt: string;
  status: string;
  services: CommandCenterServiceItem[];
  environment: {
    env: string;
    nodeEnv: string;
    valid: boolean;
  };
};

const statusTone: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-800",
  stopped: "border-neutral-300 bg-neutral-100 text-neutral-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  planned: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function AdminSystemPage() {
  const [data, setData] = useState<CommandCenterPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/command-center", { cache: "no-store", credentials: "same-origin" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setError(payload?.error ?? "Failed to load runtime services.");
      setData(null);
      setLoading(false);
      return;
    }
    setData(payload as CommandCenterPayload);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell
      active="services"
      title="Runtime Services"
      description="DB-backed and admin-safe runtime service monitor. Local tester loops are clearly separated from production-safe service ownership."
      actions={
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-500"
        >
          Refresh
        </button>
      }
    >
      {loading ? <p className="text-sm text-neutral-600">Loading runtime services...</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <Metric label="Overall" value={data.status} status={data.status} />
            <Metric label="Environment" value={`${data.environment.env} / ${data.environment.nodeEnv}`} />
            <Metric label="Last updated" value={formatDate(data.generatedAt)} />
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-base font-semibold text-neutral-950">Service State</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Running</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Last heartbeat</th>
                    <th className="py-2 pr-3">Last run</th>
                    <th className="py-2 pr-3">Provider quota</th>
                    <th className="py-2 pr-3">Settlement exec</th>
                    <th className="py-2 pr-3">OS service</th>
                    <th className="py-2 pr-3">Boundary</th>
                    <th className="py-2 pr-3">Blocker / next action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.map((service) => (
                    <tr key={service.id} className="border-b border-neutral-100 align-top">
                      <td className="py-3 pr-3 font-medium text-neutral-950">{service.label}</td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="py-3 pr-3">{triState(service.running)}</td>
                      <td className="py-3 pr-3">{service.mode}</td>
                      <td className="py-3 pr-3">{service.lastHeartbeat ? formatDate(service.lastHeartbeat) : "-"}</td>
                      <td className="py-3 pr-3">{service.lastRun ? formatDate(service.lastRun) : "-"}</td>
                      <td className="py-3 pr-3">{service.usesProviderQuota ? "true" : "false"}</td>
                      <td className="py-3 pr-3">{service.activeSettlementExecution ? "true" : "false"}</td>
                      <td className="py-3 pr-3">{service.installedOsService ? "true" : "false"}</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {service.localOnly ? <SmallBadge>Local Only</SmallBadge> : null}
                          {service.productionSafe ? <SmallBadge>Production Safe</SmallBadge> : <SmallBadge>Not Production Safe</SmallBadge>}
                        </div>
                      </td>
                      <td className="max-w-[300px] py-3 pr-3">
                        {service.blocker ? <div className="font-mono text-xs text-red-700">{service.blocker}</div> : null}
                        <div className="mt-1 text-xs text-neutral-700">{service.nextAction}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

function Metric({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase text-neutral-500">{label}</div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <div className="mt-2 text-lg font-semibold text-neutral-950">{value}</div>
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
    <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
      {children}
    </span>
  );
}

function triState(value: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
