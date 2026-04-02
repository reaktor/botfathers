# THE BOTFATHERS: GRAVITY WELL

*"In space, no one can hear you confess"*

A cyberpunk arena brawl where robot space priests fight for survival around a growing black hole. Last player standing wins.

## How to run

Open `index.html` in Chrome. That's it. No build step, no server needed — works with `file://`.

## Controls

| Player | Move | Shoot |
|--------|------|-------|
| P1 | WASD | Space |
| P2 | Arrow keys | Enter |
| P3 | IJKL | H |
| P4 | Numpad 8456 | Numpad 0 |

- **M** — mute/unmute audio
- **H** — how to play (on title screen)
- **Left/Right** — change player count (2-4) on title screen
- **Enter** — start game

## What happens

- Black hole in the center pulls everything in — touch it and you're dead
- Platforms collapse over time (outer ones first)
- Chaos events hit every ~20s: gravity surges, blackouts, meteor strikes, vacuum vents
- Arena layout randomises every match
- Some platforms move

## Tech

- Phaser 3 via CDN
- Tone.js for audio
- No modules, no bundler — everything on `window.AP` namespace
- Procedural background generation (unique each match)
- Animated WebP character sprites

## Hackathon 2026 — Reaktor
