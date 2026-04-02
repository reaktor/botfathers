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
     * Procedural spaceship interior background — full screen, no tiling.
     * Damaged hull with space visible through breaches, structural beams,
     * conduits, emergency lighting. Unique every match.
     */
    _createBackground: function (scene) {
      var S = AP.gameSize;
      var g = scene.add.graphics();

      // --- Deep space base ---
      g.fillStyle(0x020206, 1);
      g.fillRect(0, 0, S, S);

      // --- Starfield ---
      var starColors = [0xffffff, 0xaaccff, 0xffeedd, 0x88aaff, 0xccddff];
      var starCount = 150 + Math.floor(Math.random() * 100);
      for (var si = 0; si < starCount; si++) {
        var sx = Math.random() * S;
        var sy = Math.random() * S;
        var sc = starColors[Math.floor(Math.random() * starColors.length)];
        var sa = 0.15 + Math.random() * 0.5;
        var sr = Math.random() < 0.05 ? 2 : (Math.random() < 0.2 ? 1 : 0.5);
        g.fillStyle(sc, sa);
        g.fillCircle(sx, sy, sr);
      }

      // --- Nebula clouds (large soft washes) ---
      var nebColors = [0x1a0033, 0x001122, 0x0a0022, 0x000d1a, 0x120020];
      var nebCount = 3 + Math.floor(Math.random() * 3);
      for (var ni = 0; ni < nebCount; ni++) {
        var nc = nebColors[Math.floor(Math.random() * nebColors.length)];
        var nx = Math.random() * S;
        var ny = Math.random() * S;
        var nr = S * (0.15 + Math.random() * 0.25);
        g.fillStyle(nc, 0.15 + Math.random() * 0.1);
        g.fillCircle(nx, ny, nr);
        g.fillStyle(nc, 0.06);
        g.fillCircle(nx, ny, nr * 1.4);
      }

      // --- Hull structure: large dark wall sections covering parts of the view ---
      // These are irregular shapes that frame the space view
      var wallColor = 0x08080e;

      // Left wall section
      var lww = S * (0.02 + Math.random() * 0.06);
      g.fillStyle(wallColor, 0.9);
      g.fillRect(0, 0, lww, S);
      g.lineStyle(1, 0x181828, 0.6);
      g.beginPath(); g.moveTo(lww, 0); g.lineTo(lww, S); g.strokePath();

      // Right wall section
      var rww = S * (0.02 + Math.random() * 0.06);
      g.fillStyle(wallColor, 0.9);
      g.fillRect(S - rww, 0, rww, S);
      g.lineStyle(1, 0x181828, 0.6);
      g.beginPath(); g.moveTo(S - rww, 0); g.lineTo(S - rww, S); g.strokePath();

      // --- Structural beams (thick dark bars crossing the view) ---
      var beamCount = 2 + Math.floor(Math.random() * 3);
      for (var bi = 0; bi < beamCount; bi++) {
        var bw = 3 + Math.floor(Math.random() * 6);
        var bAlpha = 0.4 + Math.random() * 0.3;
        g.fillStyle(0x0a0a14, bAlpha);
        if (Math.random() > 0.4) {
          // Horizontal beam
          var by = Math.floor(Math.random() * S);
          g.fillRect(0, by, S, bw);
          // Highlight edge
          g.lineStyle(1, 0x16162a, 0.3);
          g.beginPath(); g.moveTo(0, by); g.lineTo(S, by); g.strokePath();
        } else {
          // Vertical beam
          var bx = Math.floor(Math.random() * S);
          g.fillRect(bx, 0, bw, S);
          g.lineStyle(1, 0x16162a, 0.3);
          g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, S); g.strokePath();
        }
      }

      // --- Hull panels (scattered dark rectangles with edge detail) ---
      var panelCount = 5 + Math.floor(Math.random() * 6);
      for (var pli = 0; pli < panelCount; pli++) {
        var plx = Math.floor(Math.random() * S);
        var ply = Math.floor(Math.random() * S);
        var plw = S * (0.05 + Math.random() * 0.15);
        var plh = S * (0.03 + Math.random() * 0.1);
        g.fillStyle(0x080810, 0.5 + Math.random() * 0.35);
        g.fillRect(plx, ply, plw, plh);
        g.lineStyle(1, 0x1a1a2e, 0.3 + Math.random() * 0.2);
        g.strokeRect(plx, ply, plw, plh);
        // Bolts at corners
        g.fillStyle(0x222233, 0.4);
        g.fillCircle(plx + 3, ply + 3, 1.5);
        g.fillCircle(plx + plw - 3, ply + 3, 1.5);
        g.fillCircle(plx + 3, ply + plh - 3, 1.5);
        g.fillCircle(plx + plw - 3, ply + plh - 3, 1.5);
      }

      // --- Conduit runs (pipes that cross the hull) ---
      var conduitColors = [0x12122a, 0x1a1133, 0x101828];
      var conduitCount = 4 + Math.floor(Math.random() * 4);
      for (var ci = 0; ci < conduitCount; ci++) {
        var cw = 2 + Math.floor(Math.random() * 3);
        var cc = conduitColors[Math.floor(Math.random() * conduitColors.length)];
        g.lineStyle(cw, cc, 0.5 + Math.random() * 0.3);
        // Conduits with bends (not just straight lines)
        g.beginPath();
        var cx = Math.random() * S;
        var cy = Math.random() * S;
        g.moveTo(cx, cy);
        var segs = 2 + Math.floor(Math.random() * 3);
        for (var cs = 0; cs < segs; cs++) {
          if (cs % 2 === 0) {
            cx += (Math.random() - 0.5) * S * 0.4;
          } else {
            cy += (Math.random() - 0.5) * S * 0.4;
          }
          cx = Math.max(0, Math.min(S, cx));
          cy = Math.max(0, Math.min(S, cy));
          g.lineTo(cx, cy);
        }
        g.strokePath();
      }

      // --- Emergency accent lights (small neon glows) ---
      var accentColors = [AP.NEON_CYAN, AP.NEON_MAGENTA, 0xff3322, 0xffaa00];
      var accentCount = 5 + Math.floor(Math.random() * 6);
      for (var ai = 0; ai < accentCount; ai++) {
        var ac = accentColors[Math.floor(Math.random() * accentColors.length)];
        var ax = Math.random() * S;
        var ay = Math.random() * S;
        var ar = 4 + Math.random() * 8;
        g.fillStyle(ac, 0.03 + Math.random() * 0.03);
        g.fillCircle(ax, ay, ar * 3);
        g.fillStyle(ac, 0.08 + Math.random() * 0.06);
        g.fillCircle(ax, ay, ar);
        g.fillStyle(ac, 0.2 + Math.random() * 0.15);
        g.fillCircle(ax, ay, 2);
      }

      g.generateTexture('bg-panels', S, S);
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
