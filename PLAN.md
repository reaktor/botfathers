# Asteroid Panic: Gravity Well — Implementation Plan

> **Living document.** Update this when the plan changes. Check it before starting new work.

## Context
Hackathon project — 4 devs building a retro local-multiplayer party shooter. Using Phaser 3 via CDN, no build step. Plan is structured as incremental milestones so each phase produces a playable artifact and devs can work in parallel.

---

## File Structure
```
project-root/
  index.html                    # Entry point, Phaser CDN, <script> tags in order
  PLAN.md                       # This file — shared team plan
  js/
    config.js                   # Phaser config, constants, shared namespace (window.AP)
    utils/SpriteFactory.js      # Procedural sprite generation (no image assets)
    entities/
      Player.js                 # Player state, movement, HP, powerup slot
      Bullet.js                 # Bullet pool, firing, collision
      BlackHole.js              # Black hole rendering, drift, growth, kill zone
      Platform.js               # Platform data, collapse logic
      Powerup.js                # 7 powerup types, effects, pickup/drop
    systems/
      InputManager.js           # 4 control schemes, Phaser addKey()
      GravitySystem.js          # Per-frame gravity pull on players + bullets
      ChaosEventSystem.js       # Random events every ~20s
      PowerupSpawner.js         # Timed random powerup spawning
      AudioManager.js           # Web Audio API procedural sounds
    scenes/
      BootScene.js              # Asset generation, preload
      MenuScene.js              # Title screen, player count select
      GameScene.js              # Main gameplay orchestrator
      GameOverScene.js          # Winner display, restart
```

All files use `window.AP` global namespace. No modules, no bundler, works with `file://`.

---

## Milestones

### Milestone 1 — Scaffold + Movement `[NOT STARTED]`
**Files:** `index.html`, `js/config.js`, `js/utils/SpriteFactory.js`, `js/systems/InputManager.js`, `js/entities/Player.js`, `js/scenes/BootScene.js`, `js/scenes/GameScene.js`

- Set up Phaser 3 with Arcade Physics
- One player (P1) moving and jumping on hardcoded platforms
- Procedural sprites via `Graphics.generateTexture()`
- Basic gravity (Phaser's `arcade.gravity.y = 300`)
- **Testable:** Open `index.html`, one colored rectangle moves/jumps on platforms

### Milestone 2 — Multiplayer Input + Arena `[NOT STARTED]`
**Files:** Modify `InputManager.js`, `GameScene.js`, `Player.js`

- All 4 control schemes active simultaneously
- 4 players with distinct colors, spawn in corners
- Arena layout: 12-15 irregular platforms across full screen
- Players pass through each other (no player-player collision)
- **Testable:** 4 players move independently on shared keyboard

### Milestone 3 — Black Hole + Gravity `[NOT STARTED]`
**Files:** `js/entities/BlackHole.js`, `js/systems/GravitySystem.js`, modify `GameScene.js`

- Black hole renders as glowing circle near center
- Custom inverse-square gravity pull applied per-frame (NOT Phaser's built-in)
- Pull strength scales with distance: mild at edges, overwhelming near center
- Black hole drifts slowly, grows passively over time
- Contact with black hole or screen edge = instant death
- **Testable:** Players get pulled toward center, die if they touch it

### Milestone 4 — Shooting + Bullet Curving `[NOT STARTED]`
**Files:** `js/entities/Bullet.js`, modify `Player.js`, `GravitySystem.js`, `GameScene.js`

- Fire laser bolts in facing direction, 0.5s cooldown
- Gravity system applies pull to bullets (1.5x multiplier for visible curve)
- Bullet-player overlap = 1 damage, bullet-platform = destroy bullet
- Bullets entering black hole feed it (growth)
- 3 HP per player, elimination at 0, last standing wins
- Bullet pool: `Arcade.Group` with `maxSize: 50`
- **Testable:** Full core gameplay loop — shoot, curve, damage, win

### Milestone 5 — Powerups `[NOT STARTED]`
**Files:** `js/entities/Powerup.js`, `js/systems/PowerupSpawner.js`, modify `GameScene.js`, `Player.js`

- 7 types: Rapid Fire, Shield, Triple Shot, Speed Boost, Gravity Boots, Big Bullet, Invisibility
- Spawn on random platforms every 10-15s
- One powerup per player, new pickup replaces old
- Dropped on death, floatable for pickup
- **Testable:** Powerups appear, can be collected, effects work

### Milestone 6 — Platform Collapse + Chaos Events `[NOT STARTED]`
**Files:** `js/systems/ChaosEventSystem.js`, modify `Platform.js`, `GameScene.js`

- Platforms get staggered collapse timers (start at ~20s into match)
- 2-second warning flash before disappearing
- Black hole destroys overlapping platforms
- 5 chaos events every ~20s: Gravity Surge, Blackout, Meteor Strike, Event Horizon Flash, Vacuum Vent
- **Testable:** Arena shrinks over time, chaos disrupts gameplay

### Milestone 7 — Polish `[NOT STARTED]`
**Files:** `js/scenes/MenuScene.js`, `js/scenes/GameOverScene.js`, `js/systems/AudioManager.js`, modify all scenes

- Title screen with player count selection (2-4)
- 3-2-1 countdown before match start
- HUD: HP indicators per player, active powerup icon, black hole size indicator
- Death particle explosions, camera shake on elimination
- Starfield parallax background, black hole particle swirl
- Game over screen showing winner, restart without reload
- Optional: procedural audio via Web Audio API
- **Testable:** Complete game experience end to end

---

## Team Parallelism (4 devs)
After Milestone 1 (done together as scaffold), work can split:

| Dev | Focus | Files |
|-----|-------|-------|
| Dev A | Black hole + gravity system | `BlackHole.js`, `GravitySystem.js` |
| Dev B | Shooting + bullets | `Bullet.js`, bullet collision in `GameScene.js` |
| Dev C | Powerups | `Powerup.js`, `PowerupSpawner.js` |
| Dev D | Arena design + platform collapse | `Platform.js`, arena layout in `GameScene.js` |

Chaos events and polish are done together at the end.

---

## Key Technical Decisions
- **Custom gravity** layered on top of Phaser's base gravity — inverse-square with force capping
- **Procedural sprites** — no image assets, everything generated via `Graphics + generateTexture()`
- **Global namespace** (`window.AP`) — no ES modules to keep `file://` compatibility
- **Bullet pooling** via Phaser's Arcade Group for performance

---

## Verification
1. After each milestone, open `index.html` in Chrome — game should be playable
2. Test all 4 control schemes simultaneously (hold keys across schemes)
3. Check FPS via Phaser debug or `scene.game.loop.actualFps` — must stay above 30
4. Test edge cases: all players die simultaneously, black hole eats all platforms, rapid powerup pickup

---

## Decisions Log

> When something changes from the original plan, log it here. Keep entries short.
> Format: `[DATE] [WHO] — What changed and why`

_No decisions yet._

<!-- Example entries:
[2026-04-02] Johan — Switched from inverse-square to linear gravity falloff, felt more fun in playtesting
[2026-04-02] Dev B — Reduced bullet pool from 50 to 30, no visible difference and saves memory
[2026-04-02] Dev C — Cut Invisibility powerup, too hard to balance in time — may revisit in polish
-->

---

## Blockers & Questions

> Things that need team discussion before someone can continue. Remove once resolved.

_No blockers yet._

<!-- Example entries:
- [ ] How should GameScene handle integration when Dev A and Dev B both modify it? — merge carefully or use separate methods?
- [ ] Gravity feels too strong at default settings — need playtesting before locking values
- [x] Resolved: Using Phaser 3.80.1 from CDN, confirmed it works with file:// protocol
-->

---

## Scope Cut List

> Features we're dropping or deferring if time runs out. Move items here instead of deleting them.

_Nothing cut yet._
