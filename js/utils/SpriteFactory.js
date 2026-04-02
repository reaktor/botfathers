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

    /** Dark industrial tile with grid lines and circuit traces. */
    _createBackground: function (scene) {
      var g = scene.add.graphics();
      var s = BG_TILE_SIZE;

      // Base fill
      g.fillStyle(AP.DARK_BASE, 1);
      g.fillRect(0, 0, s, s);

      // Subtle grid lines
      g.lineStyle(1, AP.GRID_LINE, 0.3);
      // Vertical grid
      for (var x = 0; x < s; x += 16) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, s);
        g.strokePath();
      }
      // Horizontal grid
      for (var y = 0; y < s; y += 16) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(s, y);
        g.strokePath();
      }

      // Panel edge accents
      g.lineStyle(1, AP.GRID_LINE, 0.5);
      g.strokeRect(1, 1, s - 2, s - 2);

      // Circuit traces — diagonal details
      g.lineStyle(1, AP.NEON_CYAN, 0.06);
      g.beginPath();
      g.moveTo(4, s * 0.7);
      g.lineTo(s * 0.3, s * 0.7);
      g.lineTo(s * 0.3, s * 0.4);
      g.lineTo(s * 0.5, s * 0.4);
      g.strokePath();

      g.lineStyle(1, AP.NEON_MAGENTA, 0.06);
      g.beginPath();
      g.moveTo(s * 0.6, s * 0.2);
      g.lineTo(s * 0.6, s * 0.5);
      g.lineTo(s * 0.85, s * 0.5);
      g.lineTo(s * 0.85, s * 0.8);
      g.strokePath();

      // Small dot accents at circuit junctions
      g.fillStyle(AP.NEON_CYAN, 0.1);
      g.fillCircle(s * 0.3, s * 0.4, 2);
      g.fillStyle(AP.NEON_MAGENTA, 0.1);
      g.fillCircle(s * 0.6, s * 0.5, 2);

      g.generateTexture('bg-panels', s, s);
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
