import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /capture-mobile-orientation\.spec\.ts/,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8081',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/_capture-server.js',
    port: 8081,
    reuseExistingServer: true,
  },
});
