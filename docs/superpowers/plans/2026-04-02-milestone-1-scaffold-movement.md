# Milestone 1 — Scaffold + Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Phaser 3 game scaffold with one player (P1) that can move, jump, land on platforms, wrap horizontally at screen edges, and wrap vertically through floor/ceiling holes.

**Architecture:** Phaser 3 loaded via CDN with Arcade Physics. All game code uses a `window.AP` global namespace (no ES modules, no bundler). Scenes follow Phaser's scene lifecycle. Procedural sprites generated via `Graphics.generateTexture()`. The game renders as a square canvas centered on screen, filling the viewport height.

**Tech Stack:** Phaser 3.80+ (CDN), vanilla JS, Playwright for E2E testing.

---

## File Structure

```
project-root/
  index.html                        # Entry point — loads Phaser CDN + all JS files in order
  js/
    config.js                       # Phaser game config, constants, window.AP namespace init
    utils/SpriteFactory.js          # Procedural texture generation (player, platform)
    systems/InputManager.js         # P1 keyboard input (A/D/W), extensible for 4 players later
    entities/Player.js              # Player class: movement, jump, wrapping logic
    scenes/BootScene.js             # Generates textures, transitions to GameScene
    scenes/GameScene.js             # Main gameplay: creates platforms, player, holes, update loop
  tests/
    playwright.config.js            # Playwright config — serves index.html via local server
    milestone1.spec.js              # E2E tests for M1: render, movement, jumping, wrapping
```

---

### Task 1: Create index.html and config.js — project scaffold

**Files:**
- Create: `index.html`
- Create: `js/config.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asteroid Panic: Gravity Well</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/utils/SpriteFactory.js"></script>
  <script src="js/systems/InputManager.js"></script>
  <script src="js/entities/Player.js"></script>
  <script src="js/scenes/BootScene.js"></script>
  <script src="js/scenes/GameScene.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/config.js`**

This file initializes the global namespace and creates the Phaser game instance. The game is a square that fills the viewport height.

```js
(function () {
  'use strict';

  // Global namespace
  window.AP = window.AP || {};

  // Constants
  AP.GRAVITY = 300;
  AP.PLAYER_SPEED = 200;
  AP.JUMP_VELOCITY = -350;
  AP.PLAYER_SIZE = 24;
  AP.PLATFORM_HEIGHT = 16;

  // Arena holes config — 2 holes per edge (floor + ceiling), positioned opposite each other
  // Each hole is { x, width } in fraction of game width (0-1)
  AP.HOLES = [
    { x: 0.15, width: 0.12 },  // left hole
    { x: 0.73, width: 0.12 },  // right hole
  ];

  // Platform data — simple array of rects, easy to swap for real arena in M2
  // Each: { x, y, width } as fractions of game size
  AP.PLATFORMS = [
    { x: 0.0,  y: 0.90, width: 0.30 },   // bottom-left
    { x: 0.70, y: 0.90, width: 0.30 },   // bottom-right
    { x: 0.35, y: 0.75, width: 0.30 },   // center-low
    { x: 0.05, y: 0.55, width: 0.25 },   // mid-left
    { x: 0.70, y: 0.55, width: 0.25 },   // mid-right
    { x: 0.30, y: 0.40, width: 0.40 },   // center-mid
    { x: 0.0,  y: 0.22, width: 0.22 },   // upper-left
    { x: 0.78, y: 0.22, width: 0.22 },   // upper-right
    { x: 0.38, y: 0.10, width: 0.24 },   // top-center
  ];

  // Game size — square, fills viewport height
  var size = Math.min(window.innerWidth, window.innerHeight);

  var config = {
    type: Phaser.AUTO,
    width: size,
    height: size,
    backgroundColor: '#0a0a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: AP.GRAVITY },
        debug: false
      }
    },
    scene: [] // scenes registered after their files load
  };

  AP.gameSize = size;
  AP.config = config;
})();
```

- [ ] **Step 3: Open index.html in browser to verify no console errors**

Expected: black page, no errors. Phaser won't start yet (no scenes registered).

- [ ] **Step 4: Commit**

```bash
git add index.html js/config.js
git commit -m "feat(m1): add project scaffold with index.html and config.js"
```

---

### Task 2: Create SpriteFactory and BootScene — procedural textures

**Files:**
- Create: `js/utils/SpriteFactory.js`
- Create: `js/scenes/BootScene.js`

- [ ] **Step 1: Create `js/utils/SpriteFactory.js`**

Generates textures using Phaser Graphics. No image assets.

```js
(function () {
  'use strict';

  AP.SpriteFactory = {
    /**
     * Generate all game textures. Call from BootScene.create().
     * @param {Phaser.Scene} scene
     */
    createTextures: function (scene) {
      // Player texture — colored rectangle
      var pg = scene.add.graphics();
      pg.fillStyle(0x00ffcc, 1);
      pg.fillRect(0, 0, AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      pg.generateTexture('player', AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      pg.destroy();

      // Platform texture — 1x1 white pixel, stretched per-platform via displayWidth/displayHeight
      var plat = scene.add.graphics();
      plat.fillStyle(0x666688, 1);
      plat.fillRect(0, 0, 1, 1);
      plat.generateTexture('platform', 1, 1);
      plat.destroy();

      // Floor/ceiling solid segment texture — darker color to distinguish from platforms
      var seg = scene.add.graphics();
      seg.fillStyle(0x333355, 1);
      seg.fillRect(0, 0, 1, 1);
      seg.generateTexture('boundary', 1, 1);
      seg.destroy();
    }
  };
})();
```

- [ ] **Step 2: Create `js/scenes/BootScene.js`**

```js
(function () {
  'use strict';

  AP.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    create: function () {
      AP.SpriteFactory.createTextures(this);
      this.scene.start('GameScene');
    }
  });
})();
```

- [ ] **Step 3: Commit**

```bash
git add js/utils/SpriteFactory.js js/scenes/BootScene.js
git commit -m "feat(m1): add SpriteFactory and BootScene for procedural textures"
```

---

### Task 3: Create InputManager — P1 keyboard controls

**Files:**
- Create: `js/systems/InputManager.js`

- [ ] **Step 1: Create `js/systems/InputManager.js`**

Registers P1 keys (A/D/W). Structured so M2 can add P2-P4 easily.

```js
(function () {
  'use strict';

  AP.InputManager = {
    /**
     * Set up keyboard controls for a scene.
     * @param {Phaser.Scene} scene
     * @returns {Object} controls — keyed by player index (0-3), each has left, right, jump
     */
    create: function (scene) {
      var controls = {};

      // P1: A / D / W
      controls[0] = {
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        jump:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      };

      return controls;
    }
  };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/systems/InputManager.js
git commit -m "feat(m1): add InputManager with P1 keyboard controls"
```

---

### Task 4: Create Player entity — movement, jumping, wrapping

**Files:**
- Create: `js/entities/Player.js`

- [ ] **Step 1: Create `js/entities/Player.js`**

Player is a Phaser Sprite with movement, jumping, horizontal wrapping, and vertical hole wrapping.

```js
(function () {
  'use strict';

  AP.Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y) {
      Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'player');
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.body.setCollideWorldBounds(false); // we handle wrapping manually
      this.body.setSize(AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      this.facing = 1; // 1 = right, -1 = left
    },

    /**
     * Called each frame from GameScene.update().
     * @param {Object} keys — { left, right, jump } Phaser Key objects
     * @param {number} delta — ms since last frame
     * @param {Array} holes — AP.HOLES array
     * @param {number} gameSize — AP.gameSize
     * @param {number} boundaryThickness — pixel height of floor/ceiling boundaries
     */
    handleInput: function (keys, delta, holes, gameSize, boundaryThickness) {
      // Horizontal movement
      if (keys.left.isDown) {
        this.body.setVelocityX(-AP.PLAYER_SPEED);
        this.facing = -1;
      } else if (keys.right.isDown) {
        this.body.setVelocityX(AP.PLAYER_SPEED);
        this.facing = 1;
      } else {
        this.body.setVelocityX(0);
      }

      // Jump — only when on floor (touching something below)
      if (keys.jump.isDown && this.body.blocked.down) {
        this.body.setVelocityY(AP.JUMP_VELOCITY);
      }

      // Horizontal screen wrapping
      if (this.x < -this.width / 2) {
        this.x = gameSize + this.width / 2;
      } else if (this.x > gameSize + this.width / 2) {
        this.x = -this.width / 2;
      }

      // Vertical wrapping through holes
      this._checkVerticalWrap(holes, gameSize, boundaryThickness);
    },

    /**
     * Check if player is inside a hole region and has crossed the floor or ceiling boundary.
     * If so, teleport to the opposite edge, preserving momentum.
     */
    _checkVerticalWrap: function (holes, gameSize, boundaryThickness) {
      var playerCenterX = this.x;
      var inHole = false;

      for (var i = 0; i < holes.length; i++) {
        var holeLeft = holes[i].x * gameSize;
        var holeRight = (holes[i].x + holes[i].width) * gameSize;
        if (playerCenterX >= holeLeft && playerCenterX <= holeRight) {
          inHole = true;
          break;
        }
      }

      if (!inHole) return;

      // Fell through floor hole — appear at top
      if (this.y > gameSize + this.height / 2) {
        this.y = -this.height / 2;
      }
      // Jumped through ceiling hole — appear at bottom
      else if (this.y < -this.height / 2) {
        this.y = gameSize + this.height / 2;
      }
    }
  });
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/entities/Player.js
git commit -m "feat(m1): add Player entity with movement, jump, and screen wrapping"
```

---

### Task 5: Create GameScene — platforms, boundaries with holes, game loop

**Files:**
- Create: `js/scenes/GameScene.js`

- [ ] **Step 1: Create `js/scenes/GameScene.js`**

This is the main scene. It creates the floor/ceiling boundaries (with holes), platforms, the player, sets up collisions, and runs the update loop.

```js
(function () {
  'use strict';

  var BOUNDARY_THICKNESS = 16;

  AP.GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
      Phaser.Scene.call(this, { key: 'GameScene' });
    },

    create: function () {
      var size = AP.gameSize;
      this.controls = AP.InputManager.create(this);

      // Static group for all solid surfaces
      this.platforms = this.physics.add.staticGroup();

      // --- Build floor and ceiling with holes ---
      this._buildBoundary(0, size - BOUNDARY_THICKNESS, size, BOUNDARY_THICKNESS);  // floor
      this._buildBoundary(0, 0, size, BOUNDARY_THICKNESS);                           // ceiling

      // --- Platforms from config ---
      for (var i = 0; i < AP.PLATFORMS.length; i++) {
        var p = AP.PLATFORMS[i];
        var pw = p.width * size;
        var px = p.x * size + pw / 2;
        var py = p.y * size;
        var plat = this.platforms.create(px, py, 'platform');
        plat.setDisplaySize(pw, AP.PLATFORM_HEIGHT);
        plat.refreshBody();
      }

      // --- Player ---
      this.player = new AP.Player(this, size * 0.5, size * 0.7);

      // Player collides with platforms
      this.physics.add.collider(this.player, this.platforms);

      // Store for update
      this.boundaryThickness = BOUNDARY_THICKNESS;
    },

    /**
     * Build a boundary edge (floor or ceiling) as solid segments with holes cut out.
     * @param {number} edgeX — left x of the full edge
     * @param {number} edgeY — top y of the edge
     * @param {number} edgeW — full width of the edge
     * @param {number} edgeH — height of the boundary
     */
    _buildBoundary: function (edgeX, edgeY, edgeW, edgeH) {
      // Sort holes by x position
      var holes = AP.HOLES.slice().sort(function (a, b) { return a.x - b.x; });
      var size = AP.gameSize;
      var cursor = 0; // current x position (fraction)

      for (var i = 0; i < holes.length; i++) {
        var holeStart = holes[i].x;
        var holeEnd = holes[i].x + holes[i].width;

        // Solid segment before this hole
        if (holeStart > cursor) {
          this._addBoundarySegment(edgeX + cursor * size, edgeY, (holeStart - cursor) * size, edgeH);
        }
        cursor = holeEnd;
      }

      // Solid segment after last hole
      if (cursor < 1) {
        this._addBoundarySegment(edgeX + cursor * size, edgeY, (1 - cursor) * size, edgeH);
      }
    },

    _addBoundarySegment: function (x, y, w, h) {
      var seg = this.platforms.create(x + w / 2, y + h / 2, 'boundary');
      seg.setDisplaySize(w, h);
      seg.refreshBody();
    },

    update: function (time, delta) {
      if (this.player && this.player.active) {
        this.player.handleInput(
          this.controls[0],
          delta,
          AP.HOLES,
          AP.gameSize,
          this.boundaryThickness
        );
      }
    }
  });
})();
```

- [ ] **Step 2: Register scenes and start the game — append to `js/config.js`**

Add the following at the end of `js/config.js`, after the IIFE:

```js
// Boot the game after all scripts have loaded
window.addEventListener('load', function () {
  AP.config.scene = [AP.BootScene, AP.GameScene];
  AP.game = new Phaser.Game(AP.config);
});
```

- [ ] **Step 3: Open index.html in browser — verify player stands on platform, can move and jump**

Expected: Square black canvas centered on screen. Cyan square (player) on platforms. A/D moves left/right, W jumps. Horizontal wrapping at edges. Floor and ceiling have visible gaps (holes).

- [ ] **Step 4: Commit**

```bash
git add js/scenes/GameScene.js js/config.js
git commit -m "feat(m1): add GameScene with platforms, boundaries with holes, and game loop"
```

---

### Task 6: Write Playwright E2E tests

**Files:**
- Create: `tests/playwright.config.js`
- Create: `tests/milestone1.spec.js`

- [ ] **Step 1: Create `tests/playwright.config.js`**

```js
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
```

- [ ] **Step 2: Create `tests/milestone1.spec.js`**

```js
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
```

- [ ] **Step 3: Install `serve` for local file serving and run the tests**

```bash
npx playwright test --config=tests/playwright.config.js
```

Expected: All 10 tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test(m1): add Playwright E2E tests for scaffold and movement"
```

---

### Task 7: Update PLAN.md — mark Milestone 1 as complete

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Update milestone status in PLAN.md**

Change:
```
### Milestone 1 — Scaffold + Movement `[NOT STARTED]`
```
To:
```
### Milestone 1 — Scaffold + Movement `[DONE]`
```

- [ ] **Step 2: Commit**

```bash
git add PLAN.md
git commit -m "docs: mark Milestone 1 as done in PLAN.md"
```
