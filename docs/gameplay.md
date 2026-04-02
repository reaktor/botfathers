# 🚀 Asteroid Panic: Gravity Well — Game Rules

A fast, chaotic 2–4 player party shooter. Players battle across a full-screen space station while a black hole warps gravity, curves bullets, and grows hungrier the longer the match goes on. Last astronaut standing wins.

---

## Players & Controls

2–4 players share a single keyboard. Each player controls one astronaut with a distinct color.

| Player | Move Left | Move Right | Jump | Shoot |
|--------|-----------|------------|------|-------|
| P1 | `A` | `D` | `W` | `F` |
| P2 | `←` | `→` | `↑` | `Space` |
| P3 | `J` | `L` | `I` | `H` |
| P4 | `Numpad 4` | `Numpad 6` | `Numpad 8` | `Numpad 0` |

Players spawn in the four corners of the screen at the start of each match.

---

## The Arena

A full-screen 2D platformer map — irregular platforms scattered at various heights and positions across the entire screen, like a wrecked space station interior. There are no scrolling or off-screen areas; everything happens on one screen.

The map has natural zones: safer outer edges where gravity is weak, and high-risk central areas where gravity is intense but curved shots are devastating.

---

## The Black Hole

A black hole sits near the center of the screen and is the defining feature of every match. It starts small, but it grows and moves as the match progresses.

- **It grows** every time a shot is fired into it — the more aggressive the shooting, the hungrier it becomes
- **It drifts** slowly around the center of the map, making some platforms more dangerous than others over time
- **It eats platforms** it drifts over, permanently removing them from play
- **Its gravitational pull strengthens** as it grows — the larger it is, the harder it is to stay away from the center
- **Falling into the black hole is instant death**, regardless of remaining HP

Firing carelessly feeds the black hole and makes the match more dangerous for everyone.

---

## Gravity

The black hole exerts a constant inward gravitational pull on all players and projectiles. The strength of this pull scales with distance to the black hole:

- **Outer edges of the map** — mild pull, easy to resist with normal movement
- **Mid-map platforms** — noticeable pull, requires active effort to stay in place
- **Near the black hole** — overwhelming pull, extremely high risk

Players must actively move and jump to counteract gravity, especially as the black hole grows and the pull intensifies across the whole map.

---

## Shooting & Bullet Curving

- Players fire laser bolts in the direction they are currently facing
- Bullets immediately begin **curving inward** toward the black hole during flight
- There is a **0.5 second cooldown** between shots — no spamming
- Bullets disappear on contact with platforms and walls
- Bullets that miss all players and fly into the black hole **feed it**, making it grow

The bullet curve is the core skill mechanic. Skilled players can:

- **Bend shots around cover** by firing at an angle and letting gravity arc the bullet
- **Lob shots** at a high trajectory and let gravity pull them down onto lower platforms
- **Lead moving targets** by accounting for both the target's movement arc and the bullet's curve
- **Fight near the core** for maximum curve effect — devastating shots, but one misstep means death

---

## Health & Elimination

- Each player starts with **3 HP**
- A bullet hit deals **1 HP** of damage
- Falling into the black hole is **instant death**, regardless of HP
- Falling off the edges of the screen is **instant death**, regardless of HP
- When a player is eliminated, they **explode** and drop any powerup they were currently holding
- Dropped powerups float briefly and can be picked up by surviving players

---

## Winning

The **last astronaut alive** wins the match. There are no points or time limits — elimination is the only path to victory.

Target match length: **60–90 seconds.**

---

## Powerups

Powerups spawn randomly on platforms around the map every 10–15 seconds. Each player can only hold **one powerup at a time** — picking up a new one immediately replaces the current one. When a player is eliminated, their held powerup is dropped.

| Powerup | Effect | Duration |
|---------|--------|----------|
| 🔴 **Rapid Fire** | No cooldown between shots | 8 seconds |
| 🔵 **Shield** | Blocks the next 1 hit completely | Until hit |
| 🟡 **Triple Shot** | Fires 3 bullets in a spread pattern | 8 seconds |
| 🟢 **Speed Boost** | Faster movement and higher jump | 6 seconds |
| 🟠 **Gravity Boots** | Significantly reduced gravitational pull | 6 seconds |
| 🟣 **Big Bullet** | Fires one giant shot dealing 2 damage, curves heavily | Single shot |
| ⚪ **Invisibility** | Player becomes semi-transparent and hard to spot | 5 seconds |

---

## Platform Collapse

Platforms are not permanent. Over the course of a match, platforms periodically crumble and disappear, shrinking the safe area and forcing players into closer — and deadlier — proximity.

Platforms are also destroyed if the black hole drifts over them. As the black hole grows and moves, it can carve a path through the map, eliminating platforms permanently.

---

## Chaos Events

Every ~20 seconds, a random station emergency event triggers. These events affect all players equally and add unpredictability to every match.

| Event | Effect |
|-------|--------|
| **Gravity Surge** | Gravitational pull doubles for 4 seconds — very hard to stay on platforms |
| **Blackout** | The screen goes dark for 3 seconds — only player outlines are visible |
| **Meteor Strike** | A random platform is instantly and permanently destroyed |
| **Event Horizon Flash** | The black hole briefly doubles in size then contracts back — its kill zone expands temporarily |
| **Vacuum Vent** | A strong wind pushes all players in one direction for 3 seconds |

---

## Match Flow Summary

1. Players spawn in the four corners of the screen
2. The black hole starts small — gravity and bullet curve are mild
3. Missed shots feed the black hole — it grows, drifts, and pulls harder
4. Platforms collapse over time and the black hole eats others as it moves
5. Chaos events fire every ~20 seconds, disrupting any stable positioning
6. The final moments are a cramped, high-gravity, curve-shot duel
7. The last player alive wins