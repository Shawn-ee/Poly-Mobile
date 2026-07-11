import { readFileSync } from "node:fs";

describe("mobile manual testing env helper", () => {
  const packageJson = () => readFileSync("package.json", "utf8");
  const helper = () => readFileSync("scripts/prepare_mobile_manual_testing_env.ps1", "utf8");
  const doc = () => readFileSync("docs/mobile/audits/BATCH_INTERNAL_READINESS_HARNESS.md", "utf8");

  it("exposes safe package scripts for real and dry-run manual server-mode prep", () => {
    const pkg = packageJson();

    expect(pkg).toContain("mobile:manual-testing-env");
    expect(pkg).toContain("mobile:manual-testing-env:dry-run");
    expect(pkg).toContain("mobile:google-auth-runtime-preflight");
    expect(pkg).toContain("mobile:google-auth-runtime-preflight:strict");
    expect(pkg).toContain("npm --prefix mobile run check:google-auth-runtime");
    expect(pkg).toContain("prepare_mobile_manual_testing_env.ps1");
  });

  it("writes secrets only to local runtime output and redacts committed summaries", () => {
    const source = helper();

    expect(source).toContain(".runtime\\mobile-manual-testing");
    expect(source).toContain("server-mode-env.ps1");
    expect(source).toContain("Do not commit this file");
    expect(source).toContain("token = if ($DryRun) { \"[dry-run-not-created]\" } else { \"[redacted]\" }");
    expect(source).not.toContain("Set-Content -LiteralPath \"docs");
  });

  it("sets the required Expo server-mode variables without starting unrelated services", () => {
    const source = helper();

    expect(source).toContain("EXPO_PUBLIC_ORDER_MODE='server'");
    expect(source).toContain("EXPO_PUBLIC_MARKET_DATA_MODE='server'");
    expect(source).toContain("EXPO_PUBLIC_API_BASE_URL");
    expect(source).toContain("EXPO_PUBLIC_API_KEY");
    expect(source).toContain("mobile:internal-beta-backend:start");
    expect(source).toContain("npm run start -- --host lan");
    expect(source).not.toContain("reference:snapshot-watch");
    expect(source).not.toContain("bot:polymarket:mm:live-local");
  });

  it("documents how to clear the manual API-key readiness gap", () => {
    const text = doc();

    expect(text).toContain("manual_server_mode_needs_generated_mobile_api_key");
    expect(text).toContain("npm run mobile:manual-testing-env");
    expect(text).toContain(".runtime/mobile-manual-testing/server-mode-env.ps1");
    expect(text).toContain("local-only");
  });
});
