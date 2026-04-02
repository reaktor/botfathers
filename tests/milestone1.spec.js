// @ts-check
const { test, expect } = require('@playwright/test');

const GAME_URL = 'http://localhost:8732/index.html';

// Helper: wait for Phaser to boot and GameScene to be active
async function waitForGame(page) {
  await page.goto(GAME_URL);
  // Wait for AP.game to exist and GameScene to be running
  await page.waitForFunction(() => {
    return window.AP &&
           window.AP.game &&
           window.AP.game.scene &&
           window.AP.game.scene.isActive('GameScene');
  }, { timeout: 10000 });
}

// Helper: get player position from the game
async function getPlayerPos(page) {
  return page.evaluate(() => {
    var scene = window.AP.game.scene.getScene('GameScene');
    return { x: scene.player.x, y: scene.player.y };
  });
}

// Helper: hold a key for a duration
async function holdKey(page, key, durationMs) {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
  // Let physics settle for 2 frames
  await page.waitForTimeout(50);
}

test.describe('Milestone 1 — Scaffold + Movement', () => {

  test('game boots and canvas renders', async ({ page }) => {
    await waitForGame(page);
    // Phaser creates a canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('player exists and is positioned on screen', async ({ page }) => {
    await waitForGame(page);
    const pos = await getPlayerPos(page);
    const size = await page.evaluate(() => window.AP.gameSize);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.x).toBeLessThan(size);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.y).toBeLessThan(size);
  });

  test('player moves right when D is pressed', async ({ page }) => {
    await waitForGame(page);
    // Let player settle on platform
    await page.waitForTimeout(500);
    const before = await getPlayerPos(page);
    await holdKey(page, 'd', 300);
    const after = await getPlayerPos(page);
    expect(after.x).toBeGreaterThan(before.x);
  });

  test('player moves left when A is pressed', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(500);
    const before = await getPlayerPos(page);
    await holdKey(page, 'a', 300);
    const after = await getPlayerPos(page);
    expect(after.x).toBeLessThan(before.x);
  });

  test('player jumps when W is pressed', async ({ page }) => {
    await waitForGame(page);
    // Let player settle
    await page.waitForTimeout(500);
    const before = await getPlayerPos(page);
    await page.keyboard.down('w');
    await page.waitForTimeout(150);
    await page.keyboard.up('w');
    // Check mid-jump position (should be above starting point)
    await page.waitForTimeout(100);
    const midJump = await getPlayerPos(page);
    expect(midJump.y).toBeLessThan(before.y);
  });

  test('player wraps horizontally from right to left', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(500);
    // Teleport player to right edge
    await page.evaluate(() => {
      var scene = window.AP.game.scene.getScene('GameScene');
      scene.player.x = window.AP.gameSize + scene.player.width;
    });
    // Wait one frame for wrapping logic
    await page.waitForTimeout(100);
    const pos = await getPlayerPos(page);
    const size = await page.evaluate(() => window.AP.gameSize);
    // Player should have wrapped to left side
    expect(pos.x).toBeLessThan(size * 0.1);
  });

  test('player wraps horizontally from left to right', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(500);
    // Teleport player to left edge
    await page.evaluate(() => {
      var scene = window.AP.game.scene.getScene('GameScene');
      scene.player.x = -scene.player.width;
    });
    await page.waitForTimeout(100);
    const pos = await getPlayerPos(page);
    const size = await page.evaluate(() => window.AP.gameSize);
    // Player should have wrapped to right side
    expect(pos.x).toBeGreaterThan(size * 0.9);
  });

  test('player wraps vertically through floor hole', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(500);
    // Teleport player into a floor hole position, below the screen
    const holeCenter = await page.evaluate(() => {
      var h = window.AP.HOLES[0];
      return (h.x + h.width / 2) * window.AP.gameSize;
    });
    await page.evaluate((cx) => {
      var scene = window.AP.game.scene.getScene('GameScene');
      scene.player.x = cx;
      scene.player.y = window.AP.gameSize + scene.player.height;
    }, holeCenter);
    await page.waitForTimeout(100);
    const pos = await getPlayerPos(page);
    // Player should have appeared near the top
    const size = await page.evaluate(() => window.AP.gameSize);
    expect(pos.y).toBeLessThan(size * 0.1);
  });

  test('player wraps vertically through ceiling hole', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(500);
    const holeCenter = await page.evaluate(() => {
      var h = window.AP.HOLES[0];
      return (h.x + h.width / 2) * window.AP.gameSize;
    });
    await page.evaluate((cx) => {
      var scene = window.AP.game.scene.getScene('GameScene');
      scene.player.x = cx;
      scene.player.y = -scene.player.height;
    }, holeCenter);
    await page.waitForTimeout(100);
    const pos = await getPlayerPos(page);
    const size = await page.evaluate(() => window.AP.gameSize);
    // Player should have appeared near the bottom
    expect(pos.y).toBeGreaterThan(size * 0.9);
  });

  test('platforms are rendered', async ({ page }) => {
    await waitForGame(page);
    const platformCount = await page.evaluate(() => {
      var scene = window.AP.game.scene.getScene('GameScene');
      return scene.platforms.getLength();
    });
    // 9 platforms + floor segments + ceiling segments
    expect(platformCount).toBeGreaterThanOrEqual(9);
  });

  test('game runs above 30 FPS', async ({ page }) => {
    await waitForGame(page);
    await page.waitForTimeout(1000); // let it run for a second
    const fps = await page.evaluate(() => {
      return window.AP.game.loop.actualFps;
    });
    expect(fps).toBeGreaterThan(30);
  });
});
