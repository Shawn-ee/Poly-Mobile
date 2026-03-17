import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/server/services/__tests__/canonical_route_auth.phase5.test.ts",
      "src/server/services/__tests__/canonical_unit.phase5.test.ts",
      "src/server/services/__tests__/canonical_client.phase6.test.ts",
    ],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
