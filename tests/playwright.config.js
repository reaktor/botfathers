// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 800, height: 800 },
  },
  webServer: {
    command: 'npx serve .. -l 8732 --no-clipboard',
    port: 8732,
    reuseExistingServer: true,
  },
});
