# Asteroid Panic: Gravity Well — Implementation Plan

> **Living document.** Update this when the plan changes. Check it before starting new work.

## Context
Hackathon project — **3 human devs**, each running a **squad of 3 Claude agents** (2 coders + 1 reviewer). Using Phaser 3 via CDN, no build step. `PLAN.md` on `main` is the single source of truth.

---

## File Structure
```
project-root/
  index.html                    # Entry point, Phaser CDN + Tone.js CDN, <script> tags in order
  PLAN.md                       # This file — shared team plan
  assets/                       # SpriteCook-generated PNGs (added in Phase 1.5)
    bg-panels.png               # Industrial background tile (metal panels, pipes, circuits)
    platform-neon.png           # Neon-edged platform tile
    boundary-grate.png          # Floor/ceiling industrial grate texture
    hole-warning.png            # Pulsing neon warning strip for holes
    player-cyan.png             # P1 sprite
    player-magenta.png          # P2 sprite
    player-green.png            # P3 sprite
    player-orange.png           # P4 sprite
  js/
    config.js                   # Phaser config, constants, shared namespace (window.AP)
    utils/SpriteFactory.js      # Asset loading helper + fallback procedural generation
    entities/
      Player.js                 # Player state, movement, HP, powerup slot, shooting
      Bullet.js                 # Bullet pool, firing, collision
      BlackHole.js              # Black hole rendering, drift, growth, kill zone
      Platform.js               # Platform data, collapse logic
      Powerup.js                # 7 powerup types, effects, pickup/drop
    systems/
      InputManager.js           # 4 control schemes, Phaser addKey()
      GravitySystem.js          # Per-frame gravity pull on players + bullets
      ChaosEventSystem.js       # Random events every ~20s
      PowerupSpawner.js         # Timed random powerup spawning
      AudioManager.js           # Tone.js synth engine — retro cyberpunk sound design
    scenes/
      BootScene.js              # Asset preload (SpriteCook PNGs) + fallback procedural generation
      MenuScene.js              # Title screen, player count select
      GameScene.js              # Main gameplay orchestrator (hookpoint skeleton)
      GameOverScene.js          # Winner display, restart
```

All files use `window.AP` global namespace. No modules, no bundler, works with `file://`.

---

## How to Dev (Read This First)

### The squad model: 2 coders + 1 reviewer per team

Each human dev runs **3 Claude agents** in separate terminals:

```
Team N
├── Coder A  (worktree: team-N-a)  →  builds feature subset A
├── Coder B  (worktree: team-N-b)  →  builds feature subset B
└── Manager  (no worktree, reads main + worktrees)  →  reviews code, checks spec, catches bugs
```

The **two coders** work in parallel on different files within the team's scope. The **manager** reviews their output, flags issues, and ensures the code matches the spec before merge.

### Step by step

**1. Pull latest main**
```bash
cd /path/to/botfathers
git pull
```

**2. Open 3 terminals for your team**

Terminal 1 — Coder A:
```bash
claude
> /worktree team-N-a
# paste Coder A prompt (see below)
```

Terminal 2 — Coder B:
```bash
claude
> /worktree team-N-b
# paste Coder B prompt (see below)
```

Terminal 3 — Manager (start after coders have committed):
```bash
claude
# paste Manager prompt (see below)
# manager works from main, reads worktree branches via git
```

**3. Workflow**
1. Coder A and Coder B build in parallel (different files, zero overlap)
2. Each coder commits to their worktree branch when done
3. Manager reviews both branches:
   - Reads the code, checks against PLAN.md spec
   - Checks for bugs, missing edge cases, interface contract compliance
   - Flags issues back to the human dev
4. Human dev merges both worktree branches into main
5. Update PLAN.md decisions log

---

## Team Prompts

### Team 1 — Shooting + Combat + Powerups

#### Team 1 Coder A — Bullets + Combat
```
Read PLAN.md and docs/gameplay.md first. You are Team 1 Coder A.

Your job: implement the bullet/shooting system and combat mechanics.

FILES YOU OWN (only touch these):
- js/entities/Bullet.js (create new)

GAMESCENE METHODS YOU OWN (only write inside these):
- setupBullets()
- updateBullets(delta)
- checkWinCondition()

PLAYER.JS METHODS YOU OWN (only add these):
- Player.prototype.shoot(bulletGroup)
- Player.prototype.takeDamage(amount)
- Player.prototype.eliminate()

DO NOT touch any other files or methods. Your teammate (Coder B) handles powerups.

Spec:
- Bullet pool: Arcade.Group, maxSize 50
- Fire in facing direction, 0.5s cooldown, no self-hits
- Bullet-platform collider = destroy bullet, off-screen = recycle
- 3 HP per player, eliminated at 0 HP
- Last player alive triggers win (checkWinCondition)
- Do NOT implement bullet curving (that's Phase 3)

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 1 Coder B — Powerups
```
Read PLAN.md and docs/gameplay.md first. You are Team 1 Coder B.

Your job: implement the powerup system.

FILES YOU OWN (only touch these):
- js/entities/Powerup.js (create new)
- js/systems/PowerupSpawner.js (create new)

GAMESCENE METHODS YOU OWN (only write inside these):
- setupPowerups()
- updatePowerups(delta)

PLAYER.JS METHODS YOU OWN (only add these):
- Player.prototype.pickupPowerup(type)
- Player.prototype.dropPowerup()
- Player.prototype.clearPowerup()

DO NOT touch any other files or methods. Your teammate (Coder A) handles bullets/combat.

Spec:
- 7 types: Rapid Fire, Shield, Triple Shot, Speed Boost, Gravity Boots, Big Bullet, Invisibility
- Spawn on random active platforms every 10-15s
- One powerup per player, new replaces old
- Duration timers per type (see gameplay.md)
- Dropped on death, floats briefly for pickup
- Each type has distinct color + procedural sprite
- Do NOT implement powerup effects on bullets or gravity (that's Phase 3)

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 1 Manager — Review
```
Read PLAN.md and docs/gameplay.md first. You are Team 1 Manager.

Your job: review the code written by Coder A and Coder B. Do NOT write code yourself.

Coder A branch: team-1-a (Bullet.js, combat in GameScene + Player.js)
Coder B branch: team-1-b (Powerup.js, PowerupSpawner.js, powerups in GameScene + Player.js)

Review checklist:
1. Read every file they created or modified
2. Check against PLAN.md spec — does the code match the requirements?
3. Check against docs/gameplay.md — are game rules implemented correctly?
4. Check interface contracts — will their code integrate with other teams' work in Phase 3?
5. Check for bugs: off-by-one errors, missing edge cases, memory leaks (bullet pool cleanup?)
6. Check they stayed in their lane — did they touch files/methods they don't own?
7. Check code quality: delta-time usage, no hardcoded magic numbers, proper cleanup
8. Verify both branches can merge without conflicts (they shouldn't touch the same files)

Output a review summary with:
- ✅ What looks good
- ⚠️ Issues to fix (with file + line reference)
- 🔗 Integration risks for Phase 3

Do NOT modify any files. Report findings to the human dev.
```

---

### Team 2 — Platform Collapse + Chaos Events

#### Team 2 Coder A — Platform Collapse
```
Read PLAN.md and docs/gameplay.md first. You are Team 2 Coder A.

Your job: implement platform collapse mechanics.

FILES YOU OWN (only touch these):
- js/entities/Platform.js (extend — add collapse methods only, don't break existing static platform code)

GAMESCENE METHODS YOU OWN (only write inside these):
- updatePlatforms(delta)

DO NOT touch any other files or methods. Your teammate (Coder B) handles chaos events.

Spec:
- Add to Platform: startCollapse() begins 2-second warning flash (blinking/tween)
- Add to Platform: collapse() removes platform from play (disable body, hide sprite)
- updatePlatforms(delta): staggered collapse timers starting ~20s into match
- Outer/less important platforms collapse first, central ones last
- Expose: AP.ChaosEventSystem.getActivePlatforms() returns non-collapsed platforms (or put this helper on the platforms group)

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 2 Coder B — Chaos Events
```
Read PLAN.md and docs/gameplay.md first. You are Team 2 Coder B.

Your job: implement the chaos event system.

FILES YOU OWN (only touch these):
- js/systems/ChaosEventSystem.js (create new)

GAMESCENE METHODS YOU OWN (only write inside these):
- setupChaos()
- updateChaos(time)

DO NOT touch any other files or methods. Your teammate (Coder A) handles platform collapse.

Spec:
- Fire a random chaos event every ~20 seconds
- 5 event types:
  - Gravity Surge: set a flag, double gravity pull for 4s (GravitySystem reads this in Phase 3)
  - Blackout: darken screen for 3s (overlay graphic, only player outlines visible)
  - Meteor Strike: pick a random active platform, call its startCollapse() (uses Coder A's interface)
  - Event Horizon Flash: set a flag, black hole doubles size for 2s (BlackHole reads this in Phase 3)
  - Vacuum Vent: apply directional force to all players for 3s (set velocity offset)
- Show visual announcement text when event fires
- Expose: AP.ChaosEventSystem.isActive(eventName) returns bool

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 2 Manager — Review
```
Read PLAN.md and docs/gameplay.md first. You are Team 2 Manager.

Your job: review the code written by Coder A and Coder B. Do NOT write code yourself.

Coder A branch: team-2-a (Platform.js collapse logic, updatePlatforms in GameScene)
Coder B branch: team-2-b (ChaosEventSystem.js, setupChaos + updateChaos in GameScene)

Review checklist:
1. Read every file they created or modified
2. Check against PLAN.md spec — does the code match the requirements?
3. Check against docs/gameplay.md — are game rules implemented correctly?
4. Check Coder A didn't break existing Platform.js static functionality
5. Check Coder B's chaos events use flags/interfaces rather than directly modifying other systems
6. Check Meteor Strike event correctly calls Coder A's startCollapse() interface
7. Check they stayed in their lane — did they touch files/methods they don't own?
8. Check for bugs: timer cleanup, event stacking, collapse of already-collapsed platforms
9. Verify both branches can merge without conflicts

Output a review summary with:
- ✅ What looks good
- ⚠️ Issues to fix (with file + line reference)
- 🔗 Integration risks for Phase 3

Do NOT modify any files. Report findings to the human dev.
```

---

### Team 3 — Black Hole + Gravity

#### Team 3 Coder A — Black Hole
```
Read PLAN.md and docs/gameplay.md first. You are Team 3 Coder A.

Your job: implement the black hole entity.

FILES YOU OWN (only touch these):
- js/entities/BlackHole.js (create new)

GAMESCENE METHODS YOU OWN (only write inside these):
- setupBlackHole()

DO NOT touch any other files or methods. Your teammate (Coder B) handles the gravity system.

Spec:
- Black hole renders as a glowing/pulsing circle near center of the arena
- Visual: layered circles with alpha, maybe a particle swirl or tween pulse
- Drifts slowly around center (gentle sine/cosine movement, stays in center ~30% of map)
- Grows passively over time (radius increases slowly)
- Has a kill zone — contact with black hole = instant death for any player
- Expose on AP namespace: BlackHole class with x, y, radius, pullStrength properties
- pullStrength scales with radius (bigger = stronger pull)
- feedBullet() method: increases radius by a small amount (called in Phase 3 when bullets hit it)

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 3 Coder B — Gravity System
```
Read PLAN.md and docs/gameplay.md first. You are Team 3 Coder B.

Your job: implement the gravity system that pulls things toward the black hole.

FILES YOU OWN (only touch these):
- js/systems/GravitySystem.js (create new)

GAMESCENE METHODS YOU OWN (only write inside these):
- setupGravity()
- updateGravity(delta)

DO NOT touch any other files or methods. Your teammate (Coder A) handles the BlackHole entity.

Spec:
- GravitySystem manages a list of physics bodies and applies pull toward the black hole each frame
- Inverse-square gravity: force = pullStrength / (distance^2), capped to prevent insane velocities
- Pull is applied as velocity delta (force * delta/1000) each frame
- Mild at edges, noticeable mid-map, overwhelming near center
- Gets black hole position/strength from AP.BlackHole instance (Coder A's work)
- Expose interface:
  - AP.GravitySystem.addBody(physicsBody) — register for gravity pull
  - AP.GravitySystem.removeBody(physicsBody) — unregister
  - AP.GravitySystem.getBlackHole() — returns { x, y, radius, pullStrength }
- setupGravity(): create system, register all players from this.players array
- updateGravity(delta): apply pull to all registered bodies
- In Phase 3, Dev 1's bullets will be registered via addBody()

Commit when done. Update PLAN.md decisions log if you deviate.
```

#### Team 3 Manager — Review
```
Read PLAN.md and docs/gameplay.md first. You are Team 3 Manager.

Your job: review the code written by Coder A and Coder B. Do NOT write code yourself.

Coder A branch: team-3-a (BlackHole.js, setupBlackHole in GameScene)
Coder B branch: team-3-b (GravitySystem.js, setupGravity + updateGravity in GameScene)

Review checklist:
1. Read every file they created or modified
2. Check against PLAN.md spec — does the code match the requirements?
3. Check against docs/gameplay.md — are game rules implemented correctly?
4. Check BlackHole exposes x, y, radius, pullStrength for GravitySystem to read
5. Check GravitySystem correctly reads BlackHole position (not hardcoded)
6. Check gravity uses delta-time for frame-rate independence
7. Check inverse-square formula has a force cap to prevent physics explosions
8. Check addBody/removeBody interface works for Phase 3 bullet integration
9. Check kill zone detection — does touching the black hole actually kill players?
10. Check they stayed in their lane — did they touch files/methods they don't own?
11. Verify both branches can merge without conflicts

Output a review summary with:
- ✅ What looks good
- ⚠️ Issues to fix (with file + line reference)
- 🔗 Integration risks for Phase 3

Do NOT modify any files. Report findings to the human dev.
```

---

## Swarm Workflow

### How agents coordinate
1. **PLAN.md on `main`** is the contract — every agent reads it before starting
2. **Each coder works in their own worktree/branch** — no two agents on the same branch
3. **File ownership is strict** — each coder only touches their assigned files
4. **GameScene.js uses hookpoints** — each coder fills in only their assigned stubs
5. **Manager reviews before merge** — catches bugs, spec violations, and integration risks
6. **Merge to main between phases** — human dev resolves any conflicts

### GameScene.js hookpoint skeleton
```js
create() {
  this.setupArena();       // Phase 1 scaffold
  this.setupPlayers();     // Phase 1 scaffold
  this.setupBlackHole();   // Team 3 Coder A
  this.setupGravity();     // Team 3 Coder B
  this.setupBullets();     // Team 1 Coder A
  this.setupPowerups();    // Team 1 Coder B
  this.setupChaos();       // Team 2 Coder B
  this.setupColliders();   // Phase 3 integration
}

update(time, delta) {
  this.updateGravity(delta);    // Team 3 Coder B
  this.updateBullets(delta);    // Team 1 Coder A
  this.updatePowerups(delta);   // Team 1 Coder B
  this.updatePlatforms(delta);  // Team 2 Coder A
  this.updateChaos(time);       // Team 2 Coder B
  this.checkWinCondition();     // Team 1 Coder A
}
```

---

## Phases

### Phase 1 — Scaffold `[DONE]`
**Who:** All together (one session)

**Created:**
- `index.html`, `js/config.js`, `js/utils/SpriteFactory.js`, `js/systems/InputManager.js`
- `js/entities/Player.js` (movement), `js/entities/Platform.js` (static)
- `js/scenes/BootScene.js`, `js/scenes/GameScene.js` (hookpoint stubs)

**Status:** 4 players moving/jumping on platforms, all control schemes working, screen wrapping working.

---

### Phase 1.5 — Arena Visual Overhaul + Audio `[DONE]`
**Who:** Dedicated team (before Phase 2 parallel build)
**Files:** Modify `SpriteFactory.js`, `BootScene.js`, `GameScene.js`, `config.js`; Create `js/systems/AudioManager.js`

**Theme:** Cyberpunk industrial arena — dark metallic background with bright neon accents. Reference: wrecked space station interior with glowing pipes, grates, and panels. Bright neon colors (magenta, cyan, green, electric blue) against dark industrial surfaces.

#### Arena Visual Overhaul (SpriteCook assets)
- **Asset pipeline:** Generate PNGs in SpriteCook, drop into `assets/` folder. `BootScene.js` preloads them via `this.load.image()`. `SpriteFactory.js` keeps procedural fallbacks in case assets are missing (graceful degradation for dev).
- **Background:** `bg-panels.png` — dark industrial cyberpunk tile (metal panels, pipes, vents, circuit-line details). Tiled across the arena. Dark base (`#0a0a12`) with subtle grid lines and panel edges in dim purple/blue.
- **Platforms:** `platform-neon.png` — neon-edged blocks with dark metallic fill and bright glowing edges. 9-patch or tiled to fit different platform widths. 12-15 irregular platforms across full screen.
- **Boundaries (floor/ceiling):** `boundary-grate.png` — industrial grate texture with neon trim. Brighter and heavier than regular platforms to frame the arena.
- **Holes:** `hole-warning.png` — pulsing neon warning strips at hole edges.
- **Players:** `player-cyan.png`, `player-magenta.png`, `player-green.png`, `player-orange.png` — 4 distinct cyberpunk character sprites with bright neon colors.

#### Game Sound (Tone.js)
- **Background track:** Pulsing synthwave loop — low BPM, dark bass with arpeggiated synth melody. Starts on first user interaction (browser autoplay policy).
- **Movement SFX:** Subtle synth blip on jump.
- **Ambient:** Low electrical hum layered under the music.
- Mute toggle via `M` key.

**Testable:** Cyberpunk arena renders with neon platforms and industrial background, 4 players have distinct neon colors, background music plays.

---

### Phase 2 — Parallel Build `[NOT STARTED]`
**Who:** 3 teams × 3 agents = 9 agents running simultaneously

| Team | Coder A | Coder B | Manager |
|------|---------|---------|---------|
| Team 1 | Bullets + combat | Powerups | Reviews both |
| **Team 2** | **Platform collapse ✅** | **Chaos events ✅** | **Reviewed ✅** |
| Team 3 | Black hole entity | Gravity system | Reviews both |

All coders work in parallel. Managers review after coders commit.

#### Team 2 — DONE (PR #2)
**Platform Collapse** (`js/entities/Platform.js`):
- `AP.PlatformCollapse.startCollapse(scene, plat)` — 2s warning flash then collapse
- `AP.PlatformCollapse.getActivePlatforms(platformGroup)` — returns non-collapsed platforms
- Priority tiers: outer (tier 1) → mid (tier 2) → central (tier 3). Staggered from ~20s, every 8s.

**Chaos Events** (`js/systems/ChaosEventSystem.js`):
- Instance: `scene.chaosSystem` — call `chaosSystem.isActive(eventName)` to check flags
- Events: `gravitySurge` (4s flag), `blackout` (3s overlay depth 900), `meteorStrike` (instant, calls startCollapse), `eventHorizonFlash` (2s flag), `vacuumVent` (3s directional force)
- Phase 3 wiring: GravitySystem checks `isActive('gravitySurge')`, BlackHole checks `isActive('eventHorizonFlash')`

---

### Phase 2C — Multi-player Rendering (Team 3) `[NOT STARTED]`
**Who:** Team 3 (Johan)
**Files:** Modify `js/scenes/GameScene.js`, `js/entities/Player.js`

**Goal:** Replace the single-player setup with proper 2-4 player spawning so all players are rendered and controllable.

**Spec:**
- Read `playerCount` from scene data (passed by MenuScene): `this.scene.settings.data.playerCount || 4`
- Replace `this.player` with `this.players[]` array
- Spawn players in 4 corners of the arena with distinct colors
- All 4 control schemes from `InputManager` active simultaneously
- Each player collides with platforms
- Register all players with `GravitySystem.addBody()`
- Kill zone check loops over all players
- Players pass through each other (no player-player collision)
- Backwards compatible: if no MenuScene data, default to 4 players
- **Win condition:** When only 1 player remains alive, end the match and transition to GameOverScene showing which player won (e.g. "Player 2 wins!")
- `checkWinCondition()` runs each frame — counts alive players, triggers game over when <= 1

**Testable:** Open index.html — 2-4 colored players spawn in corners, each controllable with their own keys, all affected by gravity and black hole kill zone. When all but one player die (black hole), game ends and shows the winner.

---

### Phase 3 — Integration `[NOT STARTED]`
**Who:** All together (one session on main)

1. Merge all 6 coder branches into `main`
2. **Bullet curving** — register bullets with `GravitySystem.addBody()`
3. **Bullets feed black hole** — bullet-blackhole overlap calls `BlackHole.feedBullet()`
4. **Powerup effects on combat** — Rapid Fire removes cooldown, Triple Shot fires spread, Big Bullet fires 2-damage heavy-curve shot
5. **Gravity Boots** — query powerup state in GravitySystem to reduce pull
6. **Black hole eats platforms** — wire BlackHole overlap to Platform.startCollapse()
7. **Chaos event effects** — Gravity Surge doubles pull, Blackout darkens screen, Event Horizon Flash grows black hole
8. **Wire all colliders in `setupColliders()`**
9. **Playtest and tune values**

---

### Phase 2.5 — UI & Onboarding (Team 2 bonus) `[DONE]`
**Who:** Team 2 (while Teams 1 & 3 finish Phase 2)
**Files:** Create `MenuScene.js`, `GameOverScene.js`; modify `BootScene.js`, `GameScene.js` (countdown only), `config.js` (scene list), `index.html` (script tags)

#### Agent A — MenuScene (title + controls + player count)
```
FILES YOU OWN:
- js/scenes/MenuScene.js (CREATE)
- js/scenes/BootScene.js (modify: go to MenuScene instead of GameScene)
- index.html (add MenuScene.js script tag)
- js/config.js (add MenuScene to scene list)

Spec:
- Cyberpunk-styled title screen: "ASTEROID PANIC: GRAVITY WELL" in neon text
- Controls display showing all 4 player control schemes:
  - P1: WASD + Space (shoot)
  - P2: Arrow keys + Enter (shoot)
  - P3: IJKL + H (shoot)
  - P4: Numpad 8456 + 0 (shoot)
- Player count selector (2-4 players), default 4
- "PRESS ENTER TO START" prompt (pulses/blinks)
- Pass selected player count to GameScene via scene data: this.scene.start('GameScene', { playerCount: n })
- Dark background (#0a0a1a), monospace font, neon magenta/cyan colors
- BootScene should go to MenuScene instead of GameScene
```

#### Agent B — GameOverScene + Countdown
```
FILES YOU OWN:
- js/scenes/GameOverScene.js (CREATE)
- js/scenes/GameScene.js (ONLY add countdown logic at start of create())
- index.html (add GameOverScene.js script tag)
- js/config.js (add GameOverScene to scene list)

Spec:
GameOverScene:
- Receives winner data: this.scene.start('GameOverScene', { winner: playerIndex })
- Display "PLAYER N WINS" in winner's neon color
- Show final stats if available (kills, survival time)
- "PRESS ENTER TO RESTART" → goes back to MenuScene
- Cyberpunk styling matching MenuScene

Countdown (in GameScene):
- 3-2-1-GO! countdown at start of match before gameplay begins
- Large centered text, each number holds for 1s
- Players visible but input disabled during countdown
- "GO!" text fades out, gameplay begins
- Use Phaser time events, not raw timers
```

---

### Phase 2.75 — Chaos Wiring + Arena Variety + Branding (Team 2) `[DONE]`
**Who:** Team 2 (while Teams 1 & 3 finish Phase 2 / early Phase 3)
**Files:** Modify `GameScene.js`, `GravitySystem.js`, `BlackHole.js`, `config.js`, `SpriteFactory.js`, `MenuScene.js`

#### Agent A — Event Horizon Flash + Black Hole Eats Platforms
Wire remaining chaos flag into BlackHole + add platform-eating overlap.
NOTE: gravitySurge → GravitySystem is ALREADY DONE by Team 3 (GravitySystem.js:68-71). Do NOT duplicate.

```
FILES YOU OWN:
- js/entities/BlackHole.js (add eventHorizonFlash check)
- js/scenes/GameScene.js (add black hole ↔ platform overlap in update loop)

Spec:
- BlackHole.update(): check if scene.chaosSystem exists and isActive('eventHorizonFlash')
  - If active: temporarily double the visual radius and kill zone radius for that frame
  - When event ends, radius returns to normal (don't permanently grow)
  - Access chaos system via: this.scene.chaosSystem.isActive('eventHorizonFlash')
- GameScene.update(): after blackHole.update(), loop over this._platformSprites
  - For each active (non-collapsed) platform, check if blackHole overlaps it
  - Use distance check between blackHole center and platform center vs blackHole.radius + platform half-width
  - If overlapping: call AP.PlatformCollapse.startCollapse(this, plat)
  - This makes the black hole "eat" platforms it drifts into
- All changes must be additive — don't break existing blackhole behaviour
- Do NOT touch GravitySystem.js (gravitySurge already wired by Team 3)
```

#### Agent B — Procedural Arena + Branding
Make each match feel different and brand the game.

```
FILES YOU OWN:
- js/config.js (randomise hole positions + platform layout per game load)
- js/utils/SpriteFactory.js (procedural cyberpunk gothic background)
- js/scenes/MenuScene.js (update title branding)

Spec:
Randomised Arena (config.js):
- On each game load, randomise AP.HOLES positions:
  - Always 2 holes in floor/ceiling, but randomise their x position (keep width ~0.12)
  - Constrain: holes must be at least 0.25 apart, not at extreme edges (0.05-0.83 range)
- Randomise platform positions each load:
  - Keep 9 platforms in 3 tiers (3 bottom ~0.75-0.90, 3 mid ~0.40-0.60, 3 top ~0.10-0.25)
  - Randomise x positions within each tier, spread across left/center/right zones
  - Randomise y within tier range (+/- small offset)
  - CRITICAL reachability constraint: every platform must be jumpable from at least one other platform or the floor
    - Max vertical gap between reachable surfaces must be <= jump height (AP.JUMP_VELOCITY = -350, so roughly 0.18 * gameSize vertical reach)
    - No platform should be isolated with no way to reach it
    - Validate layout after generation: for each platform, check that at least one lower surface exists within jump range (vertical) and walk range (horizontal, accounting for screen wrap)
    - If validation fails, regenerate
  - Randomise widths slightly (0.20-0.40 range) but ensure total coverage gives enough landing area

Procedural Background (SpriteFactory.js):
- Generate a cyberpunk gothic space station background using canvas:
  - Dark base (#0a0a12) with subtle grid lines
  - Random vertical/horizontal pipes and conduits (dim purple/blue, 1-3px wide)
  - Scattered circuit-trace patterns (thin neon lines with 90° turns)
  - Occasional panel edges / rivet dots
  - Faint glow spots in magenta/cyan at random positions
  - Overall feel: wrecked space station interior, dark and industrial
- Generate as a Phaser texture in createTextures(), tile across arena in GameScene
- Regenerate each game load so every match looks slightly different

Branding (MenuScene.js):
- Update game title to: "BOTFATHERS" as main title (large, neon magenta)
- Subtitle: "GRAVITY WELL" (smaller, neon cyan)
- Add tagline below: "A Cyberpunk Arena Brawl" (small, dim white)
- Keep existing controls display and player count selector
```

---

### Phase 3 Polish — Visual Juice (Team 2) `[IN PROGRESS]`
**Who:** Team 2 (PR branch: team-2/phase-3-polish)
**Issues:** #25, #22, #21, #29, #30

#### Agent A — Character Sprites on Title Screen + Death Particles (#25, #21)
```
FILES YOU OWN:
- js/scenes/MenuScene.js (add character sprites to title screen)
- js/entities/Player.js (trigger death particles on eliminate)
- js/scenes/GameScene.js (camera shake on player death)

Spec:
Title Screen Sprites (#25):
- Show all 4 player character sprites centered on MenuScene
- Row below the tagline, above the controls section
- Larger than in-game size (2-3x AP.PLAYER_RENDER_SIZE)
- Each tinted in player color (cyan, magenta, green, orange)
- Gentle idle animation (subtle bob or pulse tween)
- Use same sprite assets from BootScene (botfather WebPs or fallback)

Death Particles + Camera Shake (#21):
- On player eliminate(): spawn burst of particles in player's color
- 15-25 small particles flying outward, fade over 0.5s
- Use Phaser particle emitter or manual graphics
- Camera shake: brief 100-200ms shake on death (scene.cameras.main.shake())
- Must be performant — no lingering particle objects
```

#### Agent B — Starfield Parallax + Black Hole Particle Swirl (#22)
```
FILES YOU OWN:
- js/scenes/GameScene.js (parallax starfield layer behind everything)
- js/entities/BlackHole.js (enhanced particle swirl)

Spec:
Starfield Parallax (#22):
- Add a slow-scrolling star layer behind the main background
- Stars drift slightly based on a gentle sine wave or fixed slow scroll
- Separate from the main background — this is a depth/parallax layer
- Very subtle movement, adds depth without distraction
- Use Phaser tileSprite or a group of star sprites

Black Hole Particle Swirl:
- Enhance existing black hole particles with more visible swirl
- Particles should visually spiral inward toward the center
- Vary particle sizes and speeds for organic feel
- Maybe add a faint accretion disk glow ring around the event horizon
- Don't break existing BlackHole update/visual logic — enhance it
```

---

### Phase 4 — Polish `[NOT STARTED]`
**Who:** Split freely, no file conflicts

| Task | Files |
|------|-------|
| HUD (HP, powerup, black hole size) | HUD methods in `GameScene.js` |
| Audio (Tone.js cyberpunk synth) | `AudioManager.js` |

**Audio palette (Tone.js) — gameplay SFX** (background track + ambient already in Phase 1.5):
- Square wave laser shots, bitcrushed hit impacts
- Low rumble black hole drone (pitch scales with size)
- Distorted death explosion, synthwave powerup chimes

---

## File Ownership Matrix

| File | Phase 1 | T1 Coder A | T1 Coder B | T2 Coder A | T2 Coder B | T3 Coder A | T3 Coder B | Phase 3 |
|------|---------|------------|------------|------------|------------|------------|------------|---------|
| `GameScene.js` | DONE (stubs) | `setupBullets` `updateBullets` `checkWinCondition` | `setupPowerups` `updatePowerups` | `updatePlatforms` | `setupChaos` `updateChaos` | `setupBlackHole` | `setupGravity` `updateGravity` | `setupColliders` |
| `Player.js` | DONE (movement) | `shoot` `takeDamage` `eliminate` | `pickupPowerup` `dropPowerup` `clearPowerup` | — | — | — | — | — |
| `Platform.js` | DONE (static) | — | — | `startCollapse` `collapse` | — | — | — | — |
| `Bullet.js` | — | **CREATE** | — | — | — | — | — | add curving |
| `Powerup.js` | — | — | **CREATE** | — | — | — | — | wire effects |
| `PowerupSpawner.js` | — | — | **CREATE** | — | — | — | — | — |
| `ChaosEventSystem.js` | — | — | — | — | **CREATE** | — | — | wire effects |
| `BlackHole.js` | — | — | — | — | — | **CREATE** | — | — |
| `GravitySystem.js` | — | — | — | — | — | — | **CREATE** | wire bullets |
| `AudioManager.js` | — | — | — | — | — | — | — | Phase 1.5: CREATE, Phase 4: add gameplay SFX |
| `SpriteFactory.js` | DONE | — | — | — | — | — | — | Phase 1.5: cyberpunk textures |

**Rule: If your name isn't in a cell, don't touch that file/method.**

---

## Key Technical Decisions
- **Custom gravity** layered on top of Phaser's base gravity — inverse-square with force capping
- **SpriteCook assets** — cyberpunk PNGs in `assets/`, loaded in BootScene. SpriteFactory keeps procedural fallbacks for dev/graceful degradation
- **Global namespace** (`window.AP`) — no ES modules to keep `file://` compatibility
- **Bullet pooling** via Phaser's Arcade Group for performance
- **Audio: Tone.js via CDN** — retro cyberpunk synth sound design. CDN: `https://cdn.jsdelivr.net/npm/tone/build/Tone.min.js`
- **GameScene hookpoints** — skeleton with no-op stubs so coders work independently without merge conflicts
- **Horizontal wrapping** at screen edges, **vertical wrapping** through floor/ceiling holes
- **Squad model** — 2 coders + 1 manager per team for quality control

---

## Verification
1. After each phase, open `index.html` in Chrome — game should be playable at that phase's level
2. Test all 4 control schemes simultaneously (hold keys across schemes)
3. Check FPS via Phaser debug or `scene.game.loop.actualFps` — must stay above 30
4. Test edge cases: all players die simultaneously, black hole eats all platforms, rapid powerup pickup

---

## Decisions Log

> When something changes from the original plan, log it here. Keep entries short.
> Format: `[DATE] [WHO] — What changed and why`

[2026-04-02] Johan — Using Tone.js via CDN for audio instead of raw Web Audio API. Going for retro cyberpunk/synthwave sound.
[2026-04-02] Claude — Milestone 1: horizontal wrapping at screen edges + vertical wrapping through floor/ceiling holes.
[2026-04-02] Claude — Milestone 1: all movement/gravity must use delta-time from Phaser's update().
[2026-04-02] Claude — Milestone 1: hardcoded platforms as simple data array.
[2026-04-02] Codex — Milestone 1 scaffold verified against Phaser 3 docs patterns.
[2026-04-02] Johan — Restructured for 3 devs with squad model (2 coders + 1 manager per team). 9 agents total in Phase 2.
[2026-04-02] User — Added Phase 1.5: cyberpunk arena visual overhaul + Tone.js background music. Neon-edged platforms, industrial background, bright cyberpunk theme. Background track and ambient audio pulled forward from Phase 4.
[2026-04-02] User — Switched from procedural-only sprites to SpriteCook-generated PNGs in `assets/`. SpriteFactory keeps procedural fallbacks for dev. Assets loaded via Phaser preload in BootScene.
[2026-04-02] Team 2 — Phase 2 complete (PR #2). Platform collapse + chaos events implemented. Vacuum Vent fixed to use delta-time. ChaosEventSystem uses flag-based isActive() API — no direct coupling to Phase 3 systems.
[2026-04-02] Team 2 — Phase 2.5 complete (PR #4). MenuScene, GameOverScene, 3-2-1 countdown. Game flow: Boot → Menu → Game → GameOver → Menu.
[2026-04-02] Team 2 — Phase 2.75 complete (PR #10):
  - eventHorizonFlash wired into BlackHole (doubles size/kill zone temporarily via _baseRadius)
  - Black hole eats platforms on overlap (triggers startCollapse)
  - Randomised holes + platforms per match with reachability validation + minimum gap check
  - Moving platforms (~60% per tier, sine wave oscillation)
  - Full-screen procedural spaceship background (starfield, nebula, hull sections, conduits, emergency lights)
  - Rebranded to "THE BOTFATHERS" / "GRAVITY WELL" / "In space, no one can hear you confess"
  - Default 2 players, minimum 2
[2026-04-02] Team 1 — Phase 1.5: Used existing botfather WebP sprites (214x214 single frames) for player characters instead of generating new PNGs. Tinted per player, scaled to 48px. Arena textures procedurally generated via Phaser Graphics API. Removed stale AP.PLAYER_SIZE constant (replaced by AP.PLAYER_RENDER_SIZE).

---

## Blockers & Questions

> Things that need team discussion before someone can continue. Remove once resolved.

- [x] Resolved: GameScene.js hookpoint stubs added
- [x] Resolved: setupPlayers() now creates all 4 players with corner spawn points

---

## Scope Cut List

> Features we're dropping or deferring if time runs out. Move items here instead of deleting them.

_Nothing cut yet._
