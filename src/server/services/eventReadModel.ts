import type { Event } from "@prisma/client";

type EventCounts = {
  markets?: number | { markets?: number };
};

const metadataObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const arrayFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return Array.isArray(value) ? value : [];
};

export const serializeEventSummary = (
  event: Pick<
    Event,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "category"
    | "sportKey"
    | "leagueKey"
    | "eventType"
    | "homeTeamName"
    | "awayTeamName"
    | "startTime"
    | "status"
    | "liveStatus"
    | "period"
    | "clock"
    | "homeScore"
    | "awayScore"
    | "source"
    | "externalEventId"
    | "externalSlug"
    | "venue"
    | "image"
    | "imageUrl"
    | "icon"
    | "metadata"
    | "sourceUpdatedAt"
    | "createdAt"
    | "updatedAt"
  > & {
    _count?: EventCounts;
    markets?: Array<{ status: string; referenceMetadata?: unknown }>;
  },
) => {
  const markets = event.markets ?? [];
  const marketCount =
    typeof event._count?.markets === "number"
      ? event._count.markets
      : typeof event._count?.markets === "object"
        ? event._count.markets.markets ?? markets.length
        : markets.length;
  const activeMarketCount = markets.filter((market) => market.status === "LIVE").length;
  const metadata = metadataObject(event.metadata);
  const mobileLiveDetail = metadataObject(metadata.mobileLiveDetail);
  const liveStats = arrayFromMetadata(metadata, "liveStats").length
    ? arrayFromMetadata(metadata, "liveStats")
    : arrayFromMetadata(mobileLiveDetail, "liveStats");
  const chartHistory = arrayFromMetadata(metadata, "chartHistory").length
    ? arrayFromMetadata(metadata, "chartHistory")
    : arrayFromMetadata(mobileLiveDetail, "chartHistory");

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    sportKey: event.sportKey,
    leagueKey: event.leagueKey,
    eventType: event.eventType,
    homeTeamName: event.homeTeamName,
    awayTeamName: event.awayTeamName,
    startTime: event.startTime,
    status: event.status,
    liveStatus: event.liveStatus,
    period: event.period,
    clock: event.clock,
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    source: event.source,
    externalEventId: event.externalEventId,
    externalSlug: event.externalSlug,
    venue: event.venue,
    image: event.image,
    imageUrl: event.imageUrl,
    icon: event.icon,
    sourceUpdatedAt: event.sourceUpdatedAt,
    marketCount,
    activeMarketCount,
    hasGroupedMarkets: Boolean(metadata.referenceGroup),
    liveStats,
    chartHistory,
    metadata: event.metadata,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
