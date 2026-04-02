(function () {
  'use strict';

  var BG_TILE_SIZE = 64;
  var PLATFORM_TILE_W = 64;
  var PLATFORM_TILE_H = 16;
  var BOUNDARY_TILE_W = 64;
  var BOUNDARY_TILE_H = 16;
  var HOLE_WARNING_W = 8;
  var HOLE_WARNING_H = 16;

  AP.SpriteFactory = {

    /** Called from BootScene after preload completes. */
    createTextures: function (scene) {
      this._createBackground(scene);
      this._createPlatform(scene);
      this._createBoundary(scene);
      this._createHoleWarning(scene);
      this._createPlayerFallback(scene);
    },

    /**
     * Procedural cyberpunk gothic space-station background (Phase 2.75 Agent B).
     * Regenerated every game load so each match looks different.
     * Uses a larger tile size for more visual variety per tile.
     */
    _createBackground: function (scene) {
      var TILE = 128; // larger tile for richer procedural detail
      var g = scene.add.graphics();

      // --- Dark base fill ---
      g.fillStyle(0x0a0a12, 1);
      g.fillRect(0, 0, TILE, TILE);

      // --- Subtle grid lines ---
      g.lineStyle(1, AP.GRID_LINE, 0.2);
      var gridStep = 16;
      for (var gx = 0; gx < TILE; gx += gridStep) {
        g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, TILE); g.strokePath();
      }
      for (var gy = 0; gy < TILE; gy += gridStep) {
        g.beginPath(); g.moveTo(0, gy); g.lineTo(TILE, gy); g.strokePath();
      }

      // --- Panel edge / border accent ---
      g.lineStyle(1, 0x1a1a2e, 0.4);
      g.strokeRect(1, 1, TILE - 2, TILE - 2);

      // --- Random vertical / horizontal pipes and conduits ---
      var pipeColors = [0x2a1a3e, 0x1a2a4e, 0x221133, 0x182244];
      var pipeCount = 2 + Math.floor(Math.random() * 4); // 2-5 pipes
      for (var pi = 0; pi < pipeCount; pi++) {
        var pipeW = 1 + Math.floor(Math.random() * 3); // 1-3px wide
        var color = pipeColors[Math.floor(Math.random() * pipeColors.length)];
        g.lineStyle(pipeW, color, 0.5 + Math.random() * 0.3);
        g.beginPath();
        if (Math.random() > 0.5) {
          // Vertical pipe
          var px = Math.floor(Math.random() * TILE);
          g.moveTo(px, 0);
          g.lineTo(px, TILE);
        } else {
          // Horizontal pipe
          var py = Math.floor(Math.random() * TILE);
          g.moveTo(0, py);
          g.lineTo(TILE, py);
        }
        g.strokePath();
      }

      // --- Circuit-trace patterns (thin neon lines with 90-degree turns) ---
      var traceColors = [AP.NEON_CYAN, AP.NEON_MAGENTA, AP.ELECTRIC_BLUE];
      var traceCount = 2 + Math.floor(Math.random() * 3); // 2-4 traces
      for (var ti = 0; ti < traceCount; ti++) {
        var tc = traceColors[Math.floor(Math.random() * traceColors.length)];
        g.lineStyle(1, tc, 0.04 + Math.random() * 0.06); // very dim
        g.beginPath();
        var cx = Math.floor(Math.random() * TILE);
        var cy = Math.floor(Math.random() * TILE);
        g.moveTo(cx, cy);
        // 2-4 right-angle segments
        var segs = 2 + Math.floor(Math.random() * 3);
        for (var si = 0; si < segs; si++) {
          var len = 10 + Math.floor(Math.random() * 40);
          if (si % 2 === 0) {
            cx = Math.max(0, Math.min(TILE, cx + (Math.random() > 0.5 ? len : -len)));
          } else {
            cy = Math.max(0, Math.min(TILE, cy + (Math.random() > 0.5 ? len : -len)));
          }
          g.lineTo(cx, cy);
        }
        g.strokePath();

        // Junction dot at end of trace
        g.fillStyle(tc, 0.08 + Math.random() * 0.06);
        g.fillCircle(cx, cy, 1 + Math.random());
      }

      // --- Rivet dots / panel fasteners ---
      var rivetCount = 4 + Math.floor(Math.random() * 8);
      for (var ri = 0; ri < rivetCount; ri++) {
        var rx = Math.floor(Math.random() * TILE);
        var ry = Math.floor(Math.random() * TILE);
        g.fillStyle(0x2a2a3e, 0.4 + Math.random() * 0.3);
        g.fillCircle(rx, ry, 1);
        // Tiny highlight
        g.fillStyle(0x3a3a5e, 0.2);
        g.fillCircle(rx, ry - 1, 0.5);
      }

      // --- Panel edge lines (random rectangles suggesting wall panels) ---
      var panelCount = 1 + Math.floor(Math.random() * 3);
      for (var pli = 0; pli < panelCount; pli++) {
        var plx = Math.floor(Math.random() * (TILE - 20));
        var ply = Math.floor(Math.random() * (TILE - 20));
        var plw = 15 + Math.floor(Math.random() * 30);
        var plh = 15 + Math.floor(Math.random() * 30);
        g.lineStyle(1, 0x1a1a2e, 0.3 + Math.random() * 0.2);
        g.strokeRect(plx, ply, plw, plh);
      }

      // --- Faint glow spots in magenta / cyan ---
      var glowCount = 2 + Math.floor(Math.random() * 4);
      var glowColors = [AP.NEON_CYAN, AP.NEON_MAGENTA];
      for (var gi = 0; gi < glowCount; gi++) {
        var gc = glowColors[Math.floor(Math.random() * glowColors.length)];
        var gxp = Math.floor(Math.random() * TILE);
        var gyp = Math.floor(Math.random() * TILE);
        var gradius = 3 + Math.random() * 6;
        // Outer glow (very faint)
        g.fillStyle(gc, 0.02 + Math.random() * 0.03);
        g.fillCircle(gxp, gyp, gradius * 2);
        // Inner glow (slightly brighter)
        g.fillStyle(gc, 0.04 + Math.random() * 0.04);
        g.fillCircle(gxp, gyp, gradius);
        // Core
        g.fillStyle(gc, 0.08 + Math.random() * 0.05);
        g.fillCircle(gxp, gyp, gradius * 0.4);
      }

      g.generateTexture('bg-panels', TILE, TILE);
      g.destroy();
    },

    /** Neon-edged platform with dark metallic fill. */
    _createPlatform: function (scene) {
      var g = scene.add.graphics();
      var w = PLATFORM_TILE_W;
      var h = PLATFORM_TILE_H;

      // Dark metallic fill
      g.fillStyle(0x181828, 1);
      g.fillRect(0, 0, w, h);

      // Inner metal highlight
      g.fillStyle(0x222238, 1);
      g.fillRect(2, 2, w - 4, h - 4);

      // Top neon edge (cyan glow)
      g.lineStyle(2, AP.NEON_CYAN, 0.8);
      g.beginPath();
      g.moveTo(0, 1);
      g.lineTo(w, 1);
      g.strokePath();

      // Softer glow line below
      g.lineStyle(1, AP.NEON_CYAN, 0.3);
      g.beginPath();
      g.moveTo(0, 3);
      g.lineTo(w, 3);
      g.strokePath();

      // Bottom edge (dimmer magenta)
      g.lineStyle(1, AP.NEON_MAGENTA, 0.4);
      g.beginPath();
      g.moveTo(0, h - 1);
      g.lineTo(w, h - 1);
      g.strokePath();

      // Side edges
      g.lineStyle(1, AP.NEON_CYAN, 0.3);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, h);
      g.strokePath();
      g.beginPath();
      g.moveTo(w - 1, 0);
      g.lineTo(w - 1, h);
      g.strokePath();

      g.generateTexture('platform', w, h);
      g.destroy();
    },

    /** Industrial grate boundary with heavier neon trim. */
    _createBoundary: function (scene) {
      var g = scene.add.graphics();
      var w = BOUNDARY_TILE_W;
      var h = BOUNDARY_TILE_H;

      // Dark grate base
      g.fillStyle(0x0f0f1e, 1);
      g.fillRect(0, 0, w, h);

      // Grate pattern — horizontal bars
      g.fillStyle(0x1a1a30, 1);
      for (var y = 0; y < h; y += 4) {
        g.fillRect(0, y, w, 2);
      }

      // Vertical grate bars
      for (var x = 0; x < w; x += 8) {
        g.fillRect(x, 0, 1, h);
      }

      // Heavy neon top edge
      g.lineStyle(2, AP.NEON_MAGENTA, 0.9);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, 0);
      g.strokePath();

      // Heavy neon bottom edge
      g.lineStyle(2, AP.NEON_CYAN, 0.9);
      g.beginPath();
      g.moveTo(0, h - 1);
      g.lineTo(w, h - 1);
      g.strokePath();

      g.generateTexture('boundary', w, h);
      g.destroy();
    },

    /** Neon warning strip for hole edges. */
    _createHoleWarning: function (scene) {
      var g = scene.add.graphics();
      var w = HOLE_WARNING_W;
      var h = HOLE_WARNING_H;

      // Base
      g.fillStyle(0x0a0a12, 1);
      g.fillRect(0, 0, w, h);

      // Warning stripes — alternating neon/dark
      var stripeH = 4;
      for (var y = 0; y < h; y += stripeH * 2) {
        g.fillStyle(AP.NEON_MAGENTA, 0.7);
        g.fillRect(0, y, w, stripeH);
      }

      // Bright edge line
      g.lineStyle(1, AP.NEON_MAGENTA, 1);
      g.beginPath();
      g.moveTo(w - 1, 0);
      g.lineTo(w - 1, h);
      g.strokePath();

      g.generateTexture('hole-warning', w, h);
      g.destroy();
    },

    /** Fallback colored square if botfather WebPs fail to load. */
    _createPlayerFallback: function (scene) {
      var s = AP.PLAYER_RENDER_SIZE;
      var g = scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, s, s);
      g.generateTexture('player-fallback', s, s);
      g.destroy();
    }
  };
})();
