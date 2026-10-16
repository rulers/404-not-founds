import { defineConfig, devices } from "@playwright/test";
import nextConfig from "./next.config";
const basePath = nextConfig.basePath ?? "";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    baseURL: `http://127.0.0.1:3000${basePath}/`,
  },
  webServer: {
    command: "node tests/serve.mjs",
    port: 3000,
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
