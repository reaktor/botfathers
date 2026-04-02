(function () {
  'use strict';

  // Global namespace
  window.AP = window.AP || {};

  // Constants
  AP.GRAVITY = 600;
  AP.PLAYER_SPEED = 200;
  AP.JUMP_VELOCITY = -500;
  AP.PLATFORM_HEIGHT = 16;

  AP.PLAYER_RENDER_SIZE = 82;
  AP.PLAYER_HITBOX_W = 54;
  AP.PLAYER_HITBOX_H = 68;

  AP.PLAYER_COLORS = [
    0x00ffff,  // P1 cyan
    0xff00ff,  // P2 magenta
    0x00ff66,  // P3 green
    0xff8800   // P4 orange
  ];

  AP.NEON_CYAN    = 0x00ffff;
  AP.NEON_MAGENTA = 0xff00ff;
  AP.NEON_GREEN   = 0x00ff66;
  AP.ELECTRIC_BLUE = 0x4466ff;
  AP.DARK_BASE    = 0x0a0a12;
  AP.GRID_LINE    = 0x1a1a2e;

  // --- Randomised Arena Generation (Phase 2.75 Agent B) ---
  // Each game load produces a fresh layout for holes and platforms.

  /** Return a random float in [min, max). */
  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /** Generate 2 randomised hole positions, constrained to safe range and minimum separation. */
  function generateHoles() {
    var MIN_X = 0.05;
    var MAX_X = 0.83;
    var HOLE_W = 0.12;
    var MIN_SEP = 0.25;

    for (var attempt = 0; attempt < 100; attempt++) {
      var x1 = randRange(MIN_X, MAX_X - HOLE_W);
      var x2 = randRange(MIN_X, MAX_X - HOLE_W);

      // Ensure minimum separation between hole centres
      var centre1 = x1 + HOLE_W / 2;
      var centre2 = x2 + HOLE_W / 2;
      if (Math.abs(centre1 - centre2) >= MIN_SEP) {
        // Sort so left hole comes first
        if (x1 > x2) { var tmp = x1; x1 = x2; x2 = tmp; }
        return [
          { x: x1, width: HOLE_W },
          { x: x2, width: HOLE_W }
        ];
      }
    }
    // Fallback — safe default
    return [
      { x: 0.15, width: 0.12 },
      { x: 0.73, width: 0.12 }
    ];
  }

  /**
   * Generate 9 randomised platforms in 3 tiers with reachability validation.
   * Tiers: bottom (y 0.75-0.90), mid (y 0.40-0.60), top (y 0.10-0.25).
   * Each tier has left / centre / right zone platforms.
   *
   * Reachability: every platform must be jumpable from at least one lower
   * surface (another platform or the floor at y=1.0).
   * Jump reach ≈ v0^2 / (2*g) expressed as fraction of gameSize.
   * With JUMP_VELOCITY=-500, GRAVITY=600: reach = 250000/1200 = ~208px.
   * For a typical 600-800px arena that is ~0.26-0.35 fraction.
   * We use a conservative 0.30 as max vertical gap and 0.55 horizontal
   * reach (walk + screen wrap means generous horizontal coverage).
   */
  function generatePlatforms() {
    // Tier definitions: { yMin, yMax } as fractions
    var tiers = [
      { yMin: 0.75, yMax: 0.90 },  // bottom tier
      { yMin: 0.40, yMax: 0.60 },  // mid tier
      { yMin: 0.10, yMax: 0.25 }   // top tier
    ];

    // Zone x-ranges for left / centre / right within each tier
    var zones = [
      { xMin: 0.00, xMax: 0.25 },  // left zone
      { xMin: 0.30, xMax: 0.50 },  // centre zone
      { xMin: 0.55, xMax: 0.80 }   // right zone
    ];

    var WIDTH_MIN = 0.22;
    var WIDTH_MAX = 0.35;

    // Max vertical gap a player can jump (fraction of gameSize).
    // v0^2/(2g) = 500^2/(2*600) = 208.  Conservative fraction ~0.30.
    var MAX_JUMP_V = 0.30;
    // Horizontal reach — generous because of screen wrap
    var MAX_JUMP_H = 0.55;

    var MAX_ATTEMPTS = 50;

    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      var platforms = [];

      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t];
        for (var z = 0; z < zones.length; z++) {
          var zone = zones[z];
          var w = randRange(WIDTH_MIN, WIDTH_MAX);
          // Clamp x so platform does not extend past 1.0
          var maxX = Math.min(zone.xMax, 1.0 - w);
          var x = randRange(zone.xMin, Math.max(zone.xMin, maxX));
          var y = randRange(tier.yMin, tier.yMax);
          platforms.push({ x: x, y: y, width: w });
        }
      }

      // --- Minimum gap validation (no tiny gaps that trap players) ---
      var MIN_GAP = 0.06; // minimum horizontal gap between platforms on same tier
      var gapOk = true;
      for (var a = 0; a < platforms.length && gapOk; a++) {
        for (var b = a + 1; b < platforms.length && gapOk; b++) {
          // Only check platforms in similar y range (same tier)
          if (Math.abs(platforms[a].y - platforms[b].y) > 0.20) continue;
          var aLeft = platforms[a].x;
          var aRight = platforms[a].x + platforms[a].width;
          var bLeft = platforms[b].x;
          var bRight = platforms[b].x + platforms[b].width;
          // Check if they overlap
          if (aLeft < bRight && bLeft < aRight) { gapOk = false; break; }
          // Check gap between them
          var gap = Math.max(bLeft - aRight, aLeft - bRight);
          if (gap > 0 && gap < MIN_GAP) { gapOk = false; break; }
        }
      }
      if (!gapOk) continue;

      // --- Reachability validation ---
      if (validateReachability(platforms, MAX_JUMP_V, MAX_JUMP_H)) {
        // Mark ~3 platforms as moving (one per tier, random pick)
        var tierIndices = [[0,1,2],[3,4,5],[6,7,8]];
        for (var mi = 0; mi < tierIndices.length; mi++) {
          if (Math.random() < 0.6) { // 60% chance per tier
            var pick = tierIndices[mi][Math.floor(Math.random() * 3)];
            platforms[pick].moving = true;
            platforms[pick].moveSpeed = randRange(0.015, 0.04); // fraction of gameSize per second
            platforms[pick].moveRange = randRange(0.08, 0.15);  // how far it drifts from origin
          }
        }
        return platforms;
      }
    }

    // Fallback to safe default layout
    return [
      { x: 0.0,  y: 0.90, width: 0.30 },
      { x: 0.70, y: 0.90, width: 0.30 },
      { x: 0.35, y: 0.75, width: 0.30 },
      { x: 0.05, y: 0.55, width: 0.25 },
      { x: 0.70, y: 0.55, width: 0.25 },
      { x: 0.30, y: 0.40, width: 0.40 },
      { x: 0.0,  y: 0.22, width: 0.22 },
      { x: 0.78, y: 0.22, width: 0.22 },
      { x: 0.38, y: 0.10, width: 0.24 }
    ];
  }

  /**
   * Check that every platform is reachable from at least one lower surface.
   * A "surface" is another platform or the floor (y=1.0, full width).
   * Screen-wrap means horizontal distance is the minimum of direct and
   * wrapped distance.
   */
  function validateReachability(platforms, maxJumpV, maxJumpH) {
    // Build list of surfaces: all platforms + the floor
    var surfaces = [];
    for (var i = 0; i < platforms.length; i++) {
      surfaces.push({
        xCentre: platforms[i].x + platforms[i].width / 2,
        y: platforms[i].y,
        halfW: platforms[i].width / 2
      });
    }
    // Floor as a surface (y=1.0, spans full width)
    var floor = { xCentre: 0.5, y: 1.0, halfW: 0.5 };

    for (var p = 0; p < platforms.length; p++) {
      var plat = surfaces[p];
      var reachable = false;

      // Check against every other surface that is BELOW (higher y = lower on screen)
      for (var s = 0; s < surfaces.length; s++) {
        if (s === p) continue;
        var other = surfaces[s];
        if (other.y <= plat.y) continue; // must be below

        var vGap = other.y - plat.y;
        if (vGap > maxJumpV) continue;

        // Horizontal distance accounting for screen wrap
        var dx = Math.abs(plat.xCentre - other.xCentre);
        var wrappedDx = 1.0 - dx;           // distance going through screen edges
        var hDist = Math.min(dx, wrappedDx);
        // Subtract half-widths so we measure edge-to-edge reachability
        hDist = Math.max(0, hDist - plat.halfW - other.halfW);

        if (hDist <= maxJumpH) {
          reachable = true;
          break;
        }
      }

      // Also check floor as a surface below
      if (!reachable) {
        var vGapFloor = floor.y - plat.y;
        if (vGapFloor <= maxJumpV && vGapFloor > 0) {
          reachable = true;
        }
      }

      if (!reachable) return false;
    }

    return true;
  }

  // Generate randomised arena layout on each game load
  AP.HOLES = generateHoles();
  AP.PLATFORMS = generatePlatforms();

  // Game size — square, fills viewport height
  var size = Math.min(window.innerWidth, window.innerHeight);

  var config = {
    type: Phaser.AUTO,
    width: size,
    height: size,
    backgroundColor: '#0a0a1a',
    dom: { createContainer: true },
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

// Boot the game after all scripts have loaded
window.addEventListener('load', function () {
  AP.config.scene = [AP.BootScene, AP.MenuScene, AP.GameScene, AP.GameOverScene];
  AP.game = new Phaser.Game(AP.config);
});
