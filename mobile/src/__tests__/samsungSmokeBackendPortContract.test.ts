import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Samsung smoke backend port contract", () => {
  test("uses the active Holiwyn backend port for health checks and server-mode Samsung runtime", () => {
    const smoke = read("mobile/scripts/smoke.ps1");
    const samsung = read("mobile/scripts/smoke-samsung.ps1");

    expect(smoke).toContain('[string]$BackendBaseUrl = "http://127.0.0.1:3002"');
    expect(smoke).not.toContain('[string]$BackendBaseUrl = "http://127.0.0.1:3000"');
    expect(samsung).toContain("[int]$BackendPort = 3002");
    expect(samsung).toContain('$resolvedBackendBaseUrl = "http://${resolvedExpoHost}:$BackendPort"');
    expect(samsung).toContain('Write-Host "Backend base: $resolvedBackendBaseUrl"');
    expect(samsung).toContain("$env:EXPO_PUBLIC_API_BASE_URL = $resolvedBackendBaseUrl");
    expect(samsung).not.toContain('http://${resolvedExpoHost}:3000');
  });
});
