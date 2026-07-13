import fs from "node:fs";
import path from "node:path";

type LoadLocalEnvResult = {
  loadedPath: string | null;
  loadedKeys: string[];
  missingKeys: string[];
};

function parseEnvValue(raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function candidateEnvPaths() {
  const candidates: string[] = [];
  if (process.env.DOTENV_CONFIG_PATH) {
    candidates.push(process.env.DOTENV_CONFIG_PATH);
  }

  let current = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    candidates.push(path.join(current, ".env"));
    candidates.push(path.join(current, "Poly", ".env"));
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return [...new Set(candidates.map((candidate) => path.resolve(candidate)))];
}

function loadEnvFile(filePath: string, requiredKeys: string[]) {
  if (!fs.existsSync(filePath)) return [];
  const loadedKeys: string[] = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!requiredKeys.includes(key) || process.env[key]) continue;
    process.env[key] = parseEnvValue(trimmed.slice(separator + 1));
    loadedKeys.push(key);
  }
  return loadedKeys;
}

export function loadLocalEnvForScript(requiredKeys = ["DATABASE_URL"]): LoadLocalEnvResult {
  const missingBefore = requiredKeys.filter((key) => !process.env[key]);
  if (missingBefore.length === 0) {
    return { loadedPath: null, loadedKeys: [], missingKeys: [] };
  }

  for (const candidate of candidateEnvPaths()) {
    const loadedKeys = loadEnvFile(candidate, missingBefore);
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);
    if (loadedKeys.length > 0 || missingKeys.length === 0) {
      return {
        loadedPath: loadedKeys.length > 0 ? candidate : null,
        loadedKeys,
        missingKeys,
      };
    }
  }

  return {
    loadedPath: null,
    loadedKeys: [],
    missingKeys: requiredKeys.filter((key) => !process.env[key]),
  };
}
