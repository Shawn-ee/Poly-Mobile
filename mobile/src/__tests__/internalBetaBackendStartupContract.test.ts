import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const scriptSource = () => readFileSync("scripts/start_holiwyn_internal_beta_backend.ps1", "utf8");

describe("internal beta backend startup contract", () => {
  test("sets the local auth callback base to the selected backend port by default", () => {
    const source = scriptSource();

    expect(source).toContain("[string]$AuthBaseUrl = \"\"");
    expect(source).toContain("$resolvedAuthBaseUrl = if ($AuthBaseUrl.Trim())");
    expect(source).toContain("\"http://127.0.0.1:$Port\"");
    expect(source).toContain("`$env:NEXTAUTH_URL='$resolvedAuthBaseUrl'");
    expect(source).toContain("nextAuthUrl = $resolvedAuthBaseUrl");
    expect(source).toContain("pass -AuthBaseUrl to reuse a hosted backend auth origin");
  });
});
