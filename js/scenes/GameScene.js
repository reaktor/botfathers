(function () {
  'use strict';

  var BOUNDARY_THICKNESS = 16;

  AP.GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
      Phaser.Scene.call(this, { key: 'GameScene' });
    },

    create: function () {
      var size = AP.gameSize;
      this.controls = AP.InputManager.create(this);

      // Static group for all solid surfaces
      this.platforms = this.physics.add.staticGroup();

      // --- Build floor and ceiling with holes ---
      this._buildBoundary(0, size - BOUNDARY_THICKNESS, size, BOUNDARY_THICKNESS);  // floor
      this._buildBoundary(0, 0, size, BOUNDARY_THICKNESS);                           // ceiling

      // --- Platforms from config ---
      for (var i = 0; i < AP.PLATFORMS.length; i++) {
        var p = AP.PLATFORMS[i];
        var pw = p.width * size;
        var px = p.x * size + pw / 2;
        var py = p.y * size;
        var plat = this.platforms.create(px, py, 'platform');
        plat.setDisplaySize(pw, AP.PLATFORM_HEIGHT);
        plat.refreshBody();
      }

      // --- Player ---
      this.player = new AP.Player(this, size * 0.5, size * 0.7);

      // Player collides with platforms
      this.physics.add.collider(this.player, this.platforms);

      // Store for update
      this.boundaryThickness = BOUNDARY_THICKNESS;

      // --- Black Hole ---
      this.setupBlackHole();
    },

    setupBlackHole: function () {
      var size = AP.gameSize;
      // Place near center of arena
      this.blackHole = new AP.BlackHole(this, size * 0.5, size * 0.5);
      // Store on namespace so other systems (GravitySystem) can access it
      AP.blackHoleInstance = this.blackHole;
    },

    _buildBoundary: function (edgeX, edgeY, edgeW, edgeH) {
      var holes = AP.HOLES.slice().sort(function (a, b) { return a.x - b.x; });
      var size = AP.gameSize;
      var cursor = 0;

      for (var i = 0; i < holes.length; i++) {
        var holeStart = holes[i].x;
        var holeEnd = holes[i].x + holes[i].width;

        if (holeStart > cursor) {
          this._addBoundarySegment(edgeX + cursor * size, edgeY, (holeStart - cursor) * size, edgeH);
        }
        cursor = holeEnd;
      }

      if (cursor < 1) {
        this._addBoundarySegment(edgeX + cursor * size, edgeY, (1 - cursor) * size, edgeH);
      }
    },

    _addBoundarySegment: function (x, y, w, h) {
      var seg = this.platforms.create(x + w / 2, y + h / 2, 'boundary');
      seg.setDisplaySize(w, h);
      seg.refreshBody();
    },

    update: function (time, delta) {
      if (this.player && this.player.active) {
        this.player.handleInput(
          this.controls[0],
          delta,
          AP.HOLES,
          AP.gameSize,
          this.boundaryThickness
        );
      }

      // Update black hole (drift, grow, redraw)
      if (this.blackHole) {
        this.blackHole.update(time, delta);

        // Kill zone check — instant death on contact
        if (this.player && this.player.active &&
            this.blackHole.isInKillZone(this.player.x, this.player.y)) {
          // If player has an eliminate method (added by Team 1), use it;
          // otherwise just destroy
          if (typeof this.player.eliminate === 'function') {
            this.player.eliminate();
          } else {
            this.player.setActive(false).setVisible(false);
          }
        }
      }
    }
  });
})();
