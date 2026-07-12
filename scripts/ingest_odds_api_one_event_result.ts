import fs from "node:fs/promises";
import path from "node:path";
import { oddsApiGetJson, assertQuotaBudget, type OddsApiCallRecord } from "@/server/services/theOddsApiSingleEventProvider";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_EVENT_ID = "f9aa13a662d1658e5a02cfc06d6a2d73";
const DEFAULT_SPORT_KEY = "soccer_fifa_world_cup";
const DEFAULT_FIXTURE_PATH =
  "docs/mobile/harness/odds-api-live-runtime/odds-api-score-fixture.redacted.json";
const DEFAULT_TRUSTED_RESULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_SUMMARY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json";

type OddsApiScoreTeam = {
  name: string;
  score: string;
};

type OddsApiScoreEvent = {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores?: OddsApiScoreTeam[] | null;
  last_update?: string | null;
};

type FixtureShape = {
  source?: string;
  sportKey?: string;
  scores?: OddsApiScoreEvent[];
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function numberScore(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreFor(event: OddsApiScoreEvent, team: string) {
  const entry = (event.scores ?? []).find((item) => item.name.toLowerCase() === team.toLowerCase());
  return numberScore(entry?.score);
}

function inferAdvanceTeam(event: OddsApiScoreEvent, homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return event.home_team;
  if (awayScore > homeScore) return event.away_team;
  return null;
}

function toTrustedResult(params: {
  eventSlug: string;
  event: OddsApiScoreEvent;
  source: string;
}) {
  assert(params.event.completed === true, "Scores event is not completed.");
  const homeScore = scoreFor(params.event, params.event.home_team);
  const awayScore = scoreFor(params.event, params.event.away_team);
  assert(homeScore != null, `Missing score for home team ${params.event.home_team}.`);
  assert(awayScore != null, `Missing score for away team ${params.event.away_team}.`);
  const advanceTeam = inferAdvanceTeam(params.event, homeScore, awayScore);
  return {
    source: params.source,
    sourceEventId: params.event.id,
    eventSlug: params.eventSlug,
    eventTitle: `${params.event.away_team} vs. ${params.event.home_team}`,
    status: "final",
    period: "full_time",
    homeTeam: params.event.home_team,
    awayTeam: params.event.away_team,
    homeScore,
    awayScore,
    advanceTeam,
    evidenceUrl: null,
    recordedAt: params.event.last_update ?? new Date().toISOString(),
  };
}

async function fetchLiveScores(params: {
  sportKey: string;
  eventId: string;
  apiKey: string;
  daysFrom: string;
  calls: OddsApiCallRecord[];
}) {
  const scores = await oddsApiGetJson<OddsApiScoreEvent[]>({
    name: "scores",
    path: `/sports/${encodeURIComponent(params.sportKey)}/scores`,
    apiKey: params.apiKey,
    calls: params.calls,
    searchParams: {
      daysFrom: params.daysFrom,
      dateFormat: "iso",
      eventIds: params.eventId,
    },
  });
  return scores;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to ingest one-event result in production.");
  }

  const live = hasFlag("live");
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const eventId = argValue("eventId") ?? DEFAULT_EVENT_ID;
  const sportKey = argValue("sportKey") ?? DEFAULT_SPORT_KEY;
  const fixturePath = argValue("fixture") ?? argValue("fixturePath") ?? DEFAULT_FIXTURE_PATH;
  const trustedResultOutputPath =
    argValue("trustedResultOutput") ?? argValue("resultOutput") ?? DEFAULT_TRUSTED_RESULT_OUTPUT_PATH;
  const summaryPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const daysFrom = argValue("daysFrom") ?? "3";
  const maxCredits = Number(argValue("maxCredits") ?? "2");
  const minRemaining = Number(argValue("minRemaining") ?? "2");
  const calls: OddsApiCallRecord[] = [];

  let scores: OddsApiScoreEvent[];
  let source: string;
  if (live) {
    const apiKey = process.env.THE_ODDS_API_KEY?.trim();
    assert(apiKey, "THE_ODDS_API_KEY must be set in the environment for --live result ingestion.");
    scores = await fetchLiveScores({ sportKey, eventId, apiKey, daysFrom, calls });
    assertQuotaBudget({ calls, maxCredits, minRemaining });
    source = "the-odds-api-scores";
  } else {
    const fixture = await readJson<FixtureShape>(fixturePath);
    scores = fixture.scores ?? [];
    source = fixture.source ?? "the-odds-api-scores-fixture";
  }

  const selected = scores.find((event) => event.id === eventId) ?? null;
  const p0: string[] = [];
  if (!selected) p0.push(`Scores response did not include event ${eventId}.`);
  if (selected && selected.completed !== true) p0.push(`Scores event ${eventId} is not completed.`);

  let trustedResult: ReturnType<typeof toTrustedResult> | null = null;
  if (selected && p0.length === 0) {
    trustedResult = toTrustedResult({ eventSlug, event: selected, source });
    await writeJson(trustedResultOutputPath, trustedResult);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-result-ingestion",
    pass: p0.length === 0 && trustedResult != null,
    mode: live ? "live-provider" : "fixture-replay",
    eventSlug,
    eventId,
    sportKey,
    provider: {
      source,
      endpoint: live ? `/v4/sports/${sportKey}/scores` : null,
      live,
      daysFrom,
      quota: {
        maxCredits,
        minRemaining,
        calls,
      },
    },
    selectedScoreEvent: selected
      ? {
          id: selected.id,
          sportKey: selected.sport_key,
          commenceTime: selected.commence_time,
          completed: selected.completed,
          homeTeam: selected.home_team,
          awayTeam: selected.away_team,
          lastUpdate: selected.last_update ?? null,
        }
      : null,
    trustedResultOutputPath,
    trustedResult,
    runtimeTruth: {
      officialResultProviderPathAvailable: true,
      liveProviderCallRequiresExplicitFlag: true,
      defaultModeUsesQuota: false,
      trustedResultContractProduced: trustedResult != null,
      settlementExecutionAttempted: false,
    },
    gaps: {
      p0,
      p1: live
        ? ["Live result ingestion is proven for one event; unattended result polling is still not installed."]
        : ["Default proof uses provider-shaped replay. Run with --live and THE_ODDS_API_KEY to verify a current provider score response."],
      p2: ["Multi-event result ingestion and operator UI remain future work."],
    },
  };

  await writeJson(summaryPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
