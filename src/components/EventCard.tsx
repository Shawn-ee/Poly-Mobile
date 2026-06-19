"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type EventCardProps = {
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  source?: string | null;
  marketCount: number;
  activeMarketCount?: number | null;
  image?: string | null;
  icon?: string | null;
  topOutcomes?: string[] | null;
  groupedLabel?: string | null;
};

export default function EventCard({
  slug,
  title,
  description,
  category,
  source,
  marketCount,
  activeMarketCount,
  image,
  icon,
  topOutcomes,
  groupedLabel,
}: EventCardProps) {
  return (
    <Link
      href={`/events/${slug}`}
      className="group block h-full"
    >
      <Card interactive className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-start gap-4">
          {image || icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image ?? icon ?? ""} alt={title} className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-cyan-700">
              EVT
            </div>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-[var(--poly-text)]">{title}</h3>
            {description ? <p className="mt-2 line-clamp-3 text-sm text-[var(--poly-muted)]">{description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1">
              {category ? <Badge>{category}</Badge> : null}
              {source ? <Badge tone="teal">{source}</Badge> : null}
              {groupedLabel ? <Badge tone="primary">{groupedLabel}</Badge> : null}
            </div>
            {topOutcomes?.length ? (
              <div className="mt-3 text-xs text-[var(--poly-muted)]">
                Top outcomes: {topOutcomes.join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs font-medium text-[var(--poly-muted)]">
        <span>{marketCount} markets</span>
        {typeof activeMarketCount === "number" ? <span>{activeMarketCount} active</span> : null}
        <span className="ml-auto text-[var(--poly-primary)] transition group-hover:text-[var(--poly-primary-hover)]">Open event</span>
      </div>
      </Card>
    </Link>
  );
}
