import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");
const googleStartSource = () => readFileSync("src/app/api/auth/google/start/route.ts", "utf8");
const googleCallbackSource = () => readFileSync("src/app/api/auth/google/callback/route.ts", "utf8");

describe("Google mobile auth contract", () => {
  test("mobile launches the backend Google flow with a Holiwyn app return target", () => {
    const source = appSource();

    expect(source).toContain('process.env.EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL || "holiwyn://auth/google"');
    expect(source).toContain("mobileReturnTo=");
    expect(source).toContain("GOOGLE_AUTH_URL");
    expect(source).toContain('url.includes("googleAuth=success")');
    expect(source).toContain("setForcedRuntimePortfolioSyncNonce");
    expect(source).toContain('setMainTab("portfolio")');
    expect(source).not.toContain("EXPO_PUBLIC_GOOGLE_CLIENT_ID");
    expect(source).not.toContain("EXPO_PUBLIC_GOOGLE_CLIENT_SECRET");
  });

  test("backend keeps the Poly Google Cloud OAuth credential/token exchange on the server", () => {
    const start = googleStartSource();
    const callback = googleCallbackSource();

    expect(start).toContain("GOOGLE_CLIENT_ID");
    expect(start).toContain('parsed.protocol === "holiwyn:"');
    expect(start).toContain("MOBILE_RETURN_TO_COOKIE");
    expect(callback).toContain("GOOGLE_CLIENT_SECRET");
    expect(callback).toContain("createApiCredential");
    expect(callback).toContain("Holiwyn Mobile Google");
    expect(callback).toContain('googleAuth: "success"');
    expect(callback).toContain('apiKey: mobileCredential.token');
    expect(callback).toContain("https://oauth2.googleapis.com/token");
    expect(callback).toContain("https://openidconnect.googleapis.com/v1/userinfo");
    expect(callback).not.toContain("GOOGLE_CLIENT_SECRET=");
  });
});
