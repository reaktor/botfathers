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
     * Procedural space station interior background.
     * Deep space visible through hull breaches, metallic walls, conduits, warning markings.
     * Regenerated every game load.
     */
    _createBackground: function (scene) {
      var TILE = 256;
      var g = scene.add.graphics();

      // --- Deep space base (near-black with slight blue tint) ---
      g.fillStyle(0x020208, 1);
      g.fillRect(0, 0, TILE, TILE);

      // --- Distant stars (tiny dots, white/blue/warm) ---
      var starColors = [0xffffff, 0xaaccff, 0xffeedd, 0x88aaff, 0xffccaa];
      var starCount = 30 + Math.floor(Math.random() * 40);
      for (var si = 0; si < starCount; si++) {
        var sx = Math.random() * TILE;
        var sy = Math.random() * TILE;
        var sc = starColors[Math.floor(Math.random() * starColors.length)];
        var sa = 0.3 + Math.random() * 0.7;
        var sr = Math.random() < 0.1 ? 1.5 : (Math.random() < 0.3 ? 1 : 0.5);
        g.fillStyle(sc, sa);
        g.fillCircle(sx, sy, sr);
      }

      // --- Faint nebula wash (large soft color patches) ---
      var nebulaColors = [0x220044, 0x001133, 0x110022, 0x002244];
      var nebulaCount = 1 + Math.floor(Math.random() * 2);
      for (var ni = 0; ni < nebulaCount; ni++) {
        var nc = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        var nx = Math.random() * TILE;
        var ny = Math.random() * TILE;
        var nr = 40 + Math.random() * 60;
        g.fillStyle(nc, 0.08 + Math.random() * 0.06);
        g.fillCircle(nx, ny, nr);
        g.fillStyle(nc, 0.04);
        g.fillCircle(nx, ny, nr * 1.5);
      }

      // --- Hull plating overlay (semi-transparent dark panels over the stars) ---
      // This creates the "looking through a damaged hull" effect
      var panelCount = 3 + Math.floor(Math.random() * 4);
      for (var pli = 0; pli < panelCount; pli++) {
        var plx = Math.floor(Math.random() * TILE);
        var ply = Math.floor(Math.random() * TILE);
        var plw = 30 + Math.floor(Math.random() * 80);
        var plh = 20 + Math.floor(Math.random() * 60);
        // Dark hull panel
        g.fillStyle(0x0a0a14, 0.7 + Math.random() * 0.25);
        g.fillRect(plx, ply, plw, plh);
        // Panel edge highlight
        g.lineStyle(1, 0x1a1a2e, 0.5);
        g.strokeRect(plx, ply, plw, plh);
        // Inner seam
        if (plw > 40) {
          g.lineStyle(1, 0x111122, 0.3);
          g.beginPath();
          g.moveTo(plx + plw / 2, ply);
          g.lineTo(plx + plw / 2, ply + plh);
          g.strokePath();
        }
      }

      // --- Conduits and pipes (running across hull) ---
      var pipeColors = [0x1a1a30, 0x221133, 0x182244, 0x151528];
      var pipeCount = 3 + Math.floor(Math.random() * 4);
      for (var pi = 0; pi < pipeCount; pi++) {
        var pipeW = 2 + Math.floor(Math.random() * 4);
        var pc = pipeColors[Math.floor(Math.random() * pipeColors.length)];
        g.lineStyle(pipeW, pc, 0.6 + Math.random() * 0.3);
        g.beginPath();
        if (Math.random() > 0.5) {
          var px = Math.floor(Math.random() * TILE);
          g.moveTo(px, 0); g.lineTo(px, TILE);
        } else {
          var py = Math.floor(Math.random() * TILE);
          g.moveTo(0, py); g.lineTo(TILE, py);
        }
        g.strokePath();
        // Pipe highlight edge
        g.lineStyle(1, 0x2a2a44, 0.2);
        g.beginPath();
        if (Math.random() > 0.5) {
          g.moveTo(px - pipeW / 2, 0); g.lineTo(px - pipeW / 2, TILE);
        } else {
          g.moveTo(0, py - pipeW / 2); g.lineTo(TILE, py - pipeW / 2);
        }
        g.strokePath();
      }

      // --- Warning stripes (diagonal hazard markings) ---
      if (Math.random() < 0.4) {
        var wy = Math.floor(Math.random() * TILE);
        g.fillStyle(0x332200, 0.3);
        g.fillRect(0, wy, TILE, 6);
        for (var ws = 0; ws < TILE; ws += 12) {
          g.fillStyle(0x554400, 0.25);
          g.fillRect(ws, wy, 6, 6);
        }
      }

      // --- Dim neon accent lights (emergency lighting feel) ---
      var accentColors = [AP.NEON_CYAN, AP.NEON_MAGENTA, 0xff4422];
      var accentCount = 2 + Math.floor(Math.random() * 3);
      for (var ai = 0; ai < accentCount; ai++) {
        var ac = accentColors[Math.floor(Math.random() * accentColors.length)];
        var ax = Math.random() * TILE;
        var ay = Math.random() * TILE;
        // Small light source
        g.fillStyle(ac, 0.06 + Math.random() * 0.04);
        g.fillCircle(ax, ay, 8 + Math.random() * 12);
        g.fillStyle(ac, 0.12 + Math.random() * 0.08);
        g.fillCircle(ax, ay, 2 + Math.random() * 3);
      }

      // --- Rivet dots along panel edges ---
      var rivetCount = 6 + Math.floor(Math.random() * 10);
      for (var ri = 0; ri < rivetCount; ri++) {
        var rx = Math.floor(Math.random() * TILE);
        var ry = Math.floor(Math.random() * TILE);
        g.fillStyle(0x2a2a3e, 0.3 + Math.random() * 0.2);
        g.fillCircle(rx, ry, 1);
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
