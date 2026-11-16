import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/hiresphere_test",
      MONGODB_DB_NAME: "hiresphere_test",
      JWT_ACCESS_SECRET: "test-access-secret-at-least-16-chars",
      JWT_REFRESH_SECRET: "test-refresh-secret-at-least-16-chars"
    }
  }
});
