import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // A single isolated test is 100% reliable every time (~1-4s) — confirmed
  // by repeated isolated runs. Full-suite local runs on a heavily loaded
  // dev machine (many parallel real browsers each doing crypto.subtle
  // hashing + Angular bootstrap, competing with everything else running on
  // the machine at the time) can occasionally miss a tight assertion
  // window with no underlying app bug; CI's dedicated runner doesn't carry
  // that same contention, and `retries` absorbs any residual timing noise.
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'html',
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4210',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build once and serve the static production output, rather than
    // pointing at `ng serve`. The dev server serves unbundled native ESM
    // (hundreds of module requests per load); every Playwright test is a
    // fresh browser context with no cache, so a full e2e run means many
    // cold full-dependency-graph loads hitting one dev-server process back
    // to back — that caused real, non-deterministic failures. A prebuilt
    // static bundle sidesteps it entirely, and is closer to what ships.
    command: 'npm run build && npx serve -s dist/task-manager-crud/browser -l 4210',
    url: 'http://localhost:4210',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
