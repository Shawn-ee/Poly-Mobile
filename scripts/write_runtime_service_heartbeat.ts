import { loadLocalEnvForScript } from "./local_env";

let prisma: typeof import("@/lib/db")["prisma"];
let writeRuntimeServiceHeartbeat: typeof import("@/server/services/runtimeServiceHeartbeat")["writeRuntimeServiceHeartbeat"];

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const booleanArg = (name: string, fallback = false) => {
  const value = argValue(name);
  if (value == null) return fallback;
  return value === "true" || value === "1" || value === "yes";
};

const numberArg = (name: string) => {
  const value = argValue(name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const required = (name: string) => {
  const value = argValue(name);
  if (!value) throw new Error(`Missing required --${name}=...`);
  return value;
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local runtime heartbeat in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));
  ({ writeRuntimeServiceHeartbeat } = await import("@/server/services/runtimeServiceHeartbeat"));

  const serviceName = required("serviceName");
  const serviceKind = required("serviceKind");
  const status = argValue("status") ?? "running";
  const pid = numberArg("pid");
  const running = booleanArg("running", status === "running");
  const continuous = argValue("continuous") == null ? null : booleanArg("continuous");
  const usesProviderQuota = booleanArg("usesProviderQuota", false);
  const installedOsService = booleanArg("installedOsService", false);
  const statePath = argValue("statePath") ?? null;
  const startedAt = argValue("startedAt") ?? null;
  const source = argValue("source") ?? "local-runtime-worker";

  const heartbeat = await writeRuntimeServiceHeartbeat({
    serviceName,
    serviceKind,
    status,
    pid,
    running,
    continuous,
    usesProviderQuota,
    installedOsService,
    statePath,
    startedAt,
    source,
    metadata: {
      emittedBy: "scripts/write_runtime_service_heartbeat.ts",
      workerOwned: true,
      command: "npm run mobile:runtime-heartbeat",
    },
  });

  process.stdout.write(`${JSON.stringify({ pass: true, heartbeat }, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
