"use client";

import Link from "next/link";

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
}: EventCardProps) {
  return (
    <Link
      href={`/events/${slug}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-start gap-4">
          {image || icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image ?? icon ?? ""}
              alt={title}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
              EVT
            </div>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{title}</h3>
            {description ? (
              <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] uppercase text-neutral-600">
              {category ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">{category}</span>
              ) : null}
              {source ? (
                <span className="rounded-full border border-neutral-200 px-2 py-0.5">{source}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs text-neutral-500">
        <span>{marketCount} markets</span>
        {typeof activeMarketCount === "number" ? <span>{activeMarketCount} active</span> : null}
      </div>
    </Link>
  );
}
