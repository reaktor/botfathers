# 🚀 Asteroid Panic: Gravity Well — Implementation Requirements

---

## Platform

- Runs entirely in the **browser** — no server, no backend, no installation required
- Single HTML file (or minimal static files) that can be opened directly via `file://` or served from a simple static host
- No build step required to play

---

## Multiplayer

- **Local multiplayer only** — all players share the same keyboard on the same laptop
- No networking, WebSockets, or peer-to-peer of any kind
- All game state lives in memory on the client

---

## Technology

- Built with **HTML5 Canvas** for rendering the game world
- Pure **JavaScript** (or a lightweight library like Phaser.js) — no frameworks that require a build pipeline
- No external dependencies that require npm or a bundler; any libraries loaded via CDN `<script>` tags
- CSS kept minimal — the canvas is the game

---

## Input

- All keyboard input handled via `keydown` / `keyup` event listeners
- Must support **multiple simultaneous key presses** — no key conflict or ghosting issues in logic
- 4 independent control schemes active at the same time (see game rules document for controls table)

---

## Performance

- Runs at a minimum of **30 FPS** on a standard modern laptop
- Game loop uses `requestAnimationFrame` with delta-time for frame-rate-independent physics
- Physics (gravity, bullet curving, black hole pull) calculated each frame using delta-time so gameplay stays consistent regardless of frame rate

---

## Game State

- All state managed in JavaScript — player positions, HP, powerups, black hole size/position, platform states
- Match resets fully on game over with a restart option — no page reload needed
- No localStorage, cookies, or persistence needed between matches

---

## Audio (Optional)

- Sound effects via the **Web Audio API** — no external audio files required
- Background music optional, off by default

---

## Browser Compatibility

- Works in latest versions of **Chrome, Firefox, and Safari**
- No mobile support needed — keyboard input is required