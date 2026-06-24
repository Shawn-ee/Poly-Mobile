import fs from "fs";
import path from "path";

const schema = fs.readFileSync(path.join(process.cwd(), "prisma", "schema.prisma"), "utf8");

describe("live sports market schema contract", () => {
  test("Event supports additive live game metadata", () => {
    expect(schema).toContain("liveStatus      String?");
    expect(schema).toContain("period          String?");
    expect(schema).toContain("clock           String?");
    expect(schema).toContain("homeScore       Int?");
    expect(schema).toContain("awayScore       Int?");
    expect(schema).toContain("venue           String?");
    expect(schema).toContain("sourceUpdatedAt DateTime?");
    expect(schema).toContain("@@index([sportKey, leagueKey, liveStatus])");
    expect(schema).toContain("@@index([startTime])");
  });

  test("Market supports grouped sports markets and prop structure", () => {
    expect(schema).toContain("marketGroupKey          String?");
    expect(schema).toContain("marketGroupTitle        String?");
    expect(schema).toContain("displayOrder            Int");
    expect(schema).toContain("line                    Decimal?");
    expect(schema).toContain("@db.Decimal(18, 4)");
    expect(schema).toContain("unit                    String?");
    expect(schema).toContain("period                  String?");
    expect(schema).toContain("participantType         String?");
    expect(schema).toContain("participantName         String?");
    expect(schema).toContain("participantId           String?");
    expect(schema).toContain("propCategory            String?");
    expect(schema).toContain("@@index([eventId, marketGroupKey, displayOrder])");
    expect(schema).toContain("@@index([eventId, status, displayOrder])");
    expect(schema).toContain("@@index([marketType, propCategory])");
  });

  test("Market and Outcome support future manual resolution metadata without settlement behavior", () => {
    expect(schema).toContain("resolutionEvidenceText  String?");
    expect(schema).toContain("resolutionEvidenceUrl   String?");
    expect(schema).toContain("voidReason              String?");
    expect(schema).toContain("settlementStatus        String?");
    expect(schema).toContain("side                    String?");
    expect(schema).toContain("resolvedResult          String?");
    expect(schema).toContain("@@index([marketId, side])");
    expect(schema).toContain("@@index([marketId, resolvedResult])");
  });

  test("fixture can represent one event with grouped moneyline, spread, total, and player prop markets", () => {
    const groupedEvent = {
      title: "Lakers vs Warriors",
      sportKey: "basketball",
      leagueKey: "nba",
      homeTeamName: "Lakers",
      awayTeamName: "Warriors",
      liveStatus: "scheduled",
      markets: [
        {
          marketGroupKey: "main",
          marketType: "moneyline",
          title: "Game Winner",
          displayOrder: 0,
          outcomes: [
            { code: "HOME", side: "team_a", displayOrder: 0 },
            { code: "AWAY", side: "team_b", displayOrder: 1 },
          ],
        },
        {
          marketGroupKey: "spread",
          marketType: "spread",
          title: "Lakers -5.5",
          line: "-5.5",
          unit: "points",
          period: "full_game",
          participantType: "team",
          participantName: "Lakers",
          outcomes: [
            { code: "TEAM_A", side: "team_a", displayOrder: 0 },
            { code: "TEAM_B", side: "team_b", displayOrder: 1 },
          ],
        },
        {
          marketGroupKey: "total",
          marketType: "total",
          title: "Total Points 221.5",
          line: "221.5",
          unit: "points",
          outcomes: [
            { code: "OVER", side: "over", displayOrder: 0 },
            { code: "UNDER", side: "under", displayOrder: 1 },
          ],
        },
        {
          marketGroupKey: "player_prop",
          marketType: "player_prop",
          propCategory: "points",
          participantType: "player",
          participantName: "LeBron James",
          title: "LeBron James Points 26.5",
          line: "26.5",
          unit: "points",
          outcomes: [
            { code: "OVER", side: "over", displayOrder: 0 },
            { code: "UNDER", side: "under", displayOrder: 1 },
          ],
        },
      ],
    };

    expect(groupedEvent.markets).toHaveLength(4);
    expect(groupedEvent.markets.map((market) => market.marketGroupKey)).toEqual([
      "main",
      "spread",
      "total",
      "player_prop",
    ]);
    expect(groupedEvent.markets[3]).toMatchObject({
      participantType: "player",
      participantName: "LeBron James",
      propCategory: "points",
    });
    expect(groupedEvent.markets.flatMap((market) => market.outcomes).map((outcome) => outcome.side)).toEqual([
      "team_a",
      "team_b",
      "team_a",
      "team_b",
      "over",
      "under",
      "over",
      "under",
    ]);
  });
});
