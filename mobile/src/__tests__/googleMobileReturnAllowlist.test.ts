import { describe, expect, test } from "vitest";
import { isAllowedMobileReturnUrl } from "../../../src/lib/mobileReturnUrl";

describe("Google mobile return allowlist", () => {
  test("allows Holiwyn app scheme in production and local modes", () => {
    expect(isAllowedMobileReturnUrl("holiwyn://auth/google", "production")).toBe(true);
    expect(isAllowedMobileReturnUrl("holiwyn://auth/google", "development")).toBe(true);
  });

  test("allows Expo Go return links only outside production", () => {
    expect(isAllowedMobileReturnUrl("exp://172.16.200.10:8081/--/auth/google", "development")).toBe(true);
    expect(isAllowedMobileReturnUrl("exps://u.expo.dev/project-id/--/auth/google", "test")).toBe(true);
    expect(isAllowedMobileReturnUrl("exp://172.16.200.10:8081/--/auth/google", "production")).toBe(false);
    expect(isAllowedMobileReturnUrl("exps://u.expo.dev/project-id/--/auth/google", "production")).toBe(false);
  });

  test("rejects web, javascript, and malformed mobile return values", () => {
    expect(isAllowedMobileReturnUrl("https://example.com/auth/google", "development")).toBe(false);
    expect(isAllowedMobileReturnUrl("http://127.0.0.1:3002/auth/google", "development")).toBe(false);
    expect(isAllowedMobileReturnUrl("javascript:alert(1)", "development")).toBe(false);
    expect(isAllowedMobileReturnUrl("not a url", "development")).toBe(false);
  });
});
