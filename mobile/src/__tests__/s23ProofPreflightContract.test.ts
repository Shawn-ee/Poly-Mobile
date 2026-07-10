import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("S23 proof preflight contract", () => {
  test("checks the required Samsung S23 adb target before visual proof", () => {
    const script = read("mobile/scripts/s23-proof-preflight.ps1");
    const pkg = read("mobile/package.json");

    expect(script).toContain('adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp');
    expect(script).toContain('SM-S911U1');
    expect(script).toContain('adb @Arguments');
    expect(script).toContain('"devices", "-l"');
    expect(script).toContain('"mdns", "services"');
    expect(script).toContain('getprop", "ro.product.model"');
    expect(script).toContain("S23 proof device is not attached to adb");
    expect(script).toContain("PASS S23 proof preflight blocked as expected.");
    expect(script).toContain("PASS S23 proof preflight is ready for Android screenshot/XML proof.");
    expect(script).toContain('if ($resolvedSummaryPath)');
    expect(script).toContain('[string]$SummaryPath = ""');

    expect(pkg).toContain("preflight:s23-proof");
    expect(pkg).toContain("preflight:s23-proof:expect-blocked");
  });
});
