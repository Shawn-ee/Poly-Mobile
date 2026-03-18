import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type BotRunState = {
  currentRunId: string;
  currentRunStartedAt: string;
  updatedAt: string;
};

const BOT_RUN_STATE_PATH = path.resolve(process.cwd(), ".bot-run-state.json");

export function readBotRunState(): BotRunState | null {
  try {
    const raw = readFileSync(BOT_RUN_STATE_PATH, "utf8").trim();
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<BotRunState>;
    if (
      typeof parsed.currentRunId !== "string" ||
      typeof parsed.currentRunStartedAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      currentRunId: parsed.currentRunId,
      currentRunStartedAt: parsed.currentRunStartedAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function getBotRunStartDate(): Date | null {
  const state = readBotRunState();
  if (!state) {
    return null;
  }

  const startedAt = new Date(state.currentRunStartedAt);
  return Number.isNaN(startedAt.getTime()) ? null : startedAt;
}

export function writeBotRunState(startedAt: Date = new Date()): BotRunState {
  const state: BotRunState = {
    currentRunId: `bot-run-${startedAt.getTime()}`,
    currentRunStartedAt: startedAt.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mkdirSync(path.dirname(BOT_RUN_STATE_PATH), { recursive: true });
  writeFileSync(BOT_RUN_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

export function getBotRunStatePath(): string {
  return BOT_RUN_STATE_PATH;
}
