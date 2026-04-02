(function () {
  'use strict';

  // Global namespace
  window.AP = window.AP || {};

  // Constants
  AP.GRAVITY = 300;
  AP.PLAYER_SPEED = 200;
  AP.JUMP_VELOCITY = -350;
  AP.PLATFORM_HEIGHT = 16;

  AP.PLAYER_RENDER_SIZE = 48;
  AP.PLAYER_HITBOX_W = 32;
  AP.PLAYER_HITBOX_H = 40;

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

  // Arena holes config — 2 holes per edge (floor + ceiling), positioned opposite each other
  // Each hole is { x, width } in fraction of game width (0-1)
  AP.HOLES = [
    { x: 0.15, width: 0.12 },  // left hole
    { x: 0.73, width: 0.12 },  // right hole
  ];

  // Platform data — simple array of rects, easy to swap for real arena in M2
  // Each: { x, y, width } as fractions of game size
  AP.PLATFORMS = [
    { x: 0.0,  y: 0.90, width: 0.30 },   // bottom-left
    { x: 0.70, y: 0.90, width: 0.30 },   // bottom-right
    { x: 0.35, y: 0.75, width: 0.30 },   // center-low
    { x: 0.05, y: 0.55, width: 0.25 },   // mid-left
    { x: 0.70, y: 0.55, width: 0.25 },   // mid-right
    { x: 0.30, y: 0.40, width: 0.40 },   // center-mid
    { x: 0.0,  y: 0.22, width: 0.22 },   // upper-left
    { x: 0.78, y: 0.22, width: 0.22 },   // upper-right
    { x: 0.38, y: 0.10, width: 0.24 },   // top-center
  ];

  // Game size — square, fills viewport height
  var size = Math.min(window.innerWidth, window.innerHeight);

  var config = {
    type: window.location.protocol === 'file:' ? Phaser.CANVAS : Phaser.AUTO,
    width: size,
    height: size,
    backgroundColor: '#0a0a1a',
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
  AP.config.scene = [AP.BootScene, AP.GameScene];
  AP.game = new Phaser.Game(AP.config);
});
