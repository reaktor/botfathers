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

      // --- Tiled cyberpunk background ---
      this._buildBackground(size);

      // Static group for all solid surfaces
      this.platforms = this.physics.add.staticGroup();

      // --- Build floor and ceiling with holes ---
      this._buildBoundary(0, size - BOUNDARY_THICKNESS, size, BOUNDARY_THICKNESS);
      this._buildBoundary(0, 0, size, BOUNDARY_THICKNESS);

      // --- Hole warning strips ---
      this._buildHoleWarnings(size, BOUNDARY_THICKNESS);

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
      this.player = new AP.Player(this, size * 0.5, size * 0.7, 0);

      // Player collides with platforms
      this.physics.add.collider(this.player, this.platforms);

      // Store for update
      this.boundaryThickness = BOUNDARY_THICKNESS;

      // --- Audio: start on first interaction ---
      this._audioStarted = false;
      this.input.once('pointerdown', this._startAudio, this);
      this.input.keyboard.once('keydown', this._startAudio, this);

      // --- Phase 2 hookpoint stubs ---
      // this.setupBlackHole();
      // this.setupGravity();
      // this.setupBullets();
      // this.setupPowerups();
      // this.setupChaos();
      // this.setupColliders();
    },

    _buildBackground: function (size) {
      this.add.tileSprite(size / 2, size / 2, size, size, 'bg-panels');
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

    _buildHoleWarnings: function (size, boundaryH) {
      var holes = AP.HOLES;
      for (var i = 0; i < holes.length; i++) {
        var holeLeft = holes[i].x * size;
        var holeRight = (holes[i].x + holes[i].width) * size;

        // Left edge of hole — floor warning
        var warnFL = this.add.image(holeLeft, size - boundaryH / 2, 'hole-warning');
        warnFL.setDisplaySize(8, boundaryH);
        // Right edge of hole — floor warning
        var warnFR = this.add.image(holeRight, size - boundaryH / 2, 'hole-warning');
        warnFR.setDisplaySize(8, boundaryH);
        warnFR.setFlipX(true);

        // Left edge of hole — ceiling warning
        var warnCL = this.add.image(holeLeft, boundaryH / 2, 'hole-warning');
        warnCL.setDisplaySize(8, boundaryH);
        // Right edge of hole — ceiling warning
        var warnCR = this.add.image(holeRight, boundaryH / 2, 'hole-warning');
        warnCR.setDisplaySize(8, boundaryH);
        warnCR.setFlipX(true);

        // Pulse tween on all four warning strips
        var warnings = [warnFL, warnFR, warnCL, warnCR];
        for (var j = 0; j < warnings.length; j++) {
          this.tweens.add({
            targets: warnings[j],
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    },

    _startAudio: function () {
      if (this._audioStarted) return;
      this._audioStarted = true;
      if (AP.AudioManager && AP.AudioManager.start) {
        AP.AudioManager.start();
      }
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

      // --- Phase 2 hookpoint stubs ---
      // this.updateGravity(delta);
      // this.updateBullets(delta);
      // this.updatePowerups(delta);
      // this.updatePlatforms(delta);
      // this.updateChaos(time);
      // this.checkWinCondition();
    }
  });
})();
