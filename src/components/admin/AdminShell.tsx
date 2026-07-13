import Link from "next/link";
import type { ReactNode } from "react";
import PageContainer from "@/components/ui/PageContainer";
import { cn } from "@/components/ui/cn";

export const adminSections = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "events", label: "Events & Markets", href: "/admin/events" },
  { id: "services", label: "Runtime Services", href: "/admin/system" },
  { id: "bots", label: "Bots & Liquidity", href: "/admin/bots" },
  { id: "trading-risk", label: "Trading & Risk", href: "/admin#trading-risk" },
  { id: "settlement", label: "Settlement", href: "/admin#settlement" },
  { id: "users-wallets", label: "Users & Wallets", href: "/admin#users-wallets" },
  { id: "provider-data", label: "Provider Data", href: "/admin/reference-markets" },
  { id: "mobile-app", label: "Mobile App", href: "/admin/mobile-provider-mapping" },
  { id: "agents-proof", label: "Agents & Proof", href: "/admin/agents" },
  { id: "settings", label: "System Settings", href: "/admin/system" },
  { id: "audit-logs", label: "Audit Logs", href: "/admin#audit-logs" },
] as const;

export type AdminSectionId = (typeof adminSections)[number]["id"];

export default function AdminShell({
  active,
  title,
  description,
  children,
  actions,
}: {
  active: AdminSectionId;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <PageContainer className="space-y-5" size="wide">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Holiwyn Admin</div>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">{title}</h1>
          <p className="mt-1 max-w-4xl text-sm text-neutral-600">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <nav className="flex gap-2 overflow-x-auto border-b border-neutral-200 pb-2" aria-label="Admin sections">
        {adminSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className={cn(
              "whitespace-nowrap rounded-md border px-3 py-2 text-xs font-semibold",
              section.id === active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950",
            )}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      {children}
    </PageContainer>
  );
}
