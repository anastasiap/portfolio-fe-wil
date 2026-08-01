import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'guest-chromium',
      testIgnore: [/auth\.setup\.ts/, /\.auth\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'authenticated-chromium',
      testMatch: /\.auth\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'src/e2e/.auth/user.json',
        trace: 'off',
      },
    },
  ],
});
