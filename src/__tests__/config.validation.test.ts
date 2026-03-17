import { validateConfig } from "@/lib/config";

describe("config validation", () => {
  test("strict env requires database/auth/admin settings", () => {
    const result = validateConfig({
      APP_ENV: "production",
      DATABASE_URL: "",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
      NEXTAUTH_URL: "",
      ADMIN_EMAILS: "",
    } as NodeJS.ProcessEnv);

    expect(result.strict).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("development env can pass with warnings", () => {
    const result = validateConfig({
      APP_ENV: "development",
      DATABASE_URL: "postgresql://dev",
      NEXTAUTH_SECRET: "dev-secret",
    } as NodeJS.ProcessEnv);

    expect(result.strict).toBe(false);
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

