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
      this._platformSprites = [];
      for (var i = 0; i < AP.PLATFORMS.length; i++) {
        var p = AP.PLATFORMS[i];
        var pw = p.width * size;
        var px = p.x * size + pw / 2;
        var py = p.y * size;
        var plat = this.platforms.create(px, py, 'platform');
        plat.setDisplaySize(pw, AP.PLATFORM_HEIGHT);
        plat.refreshBody();
        // Initialise collapse state (Team 2 Coder A)
        AP.PlatformCollapse.initCollapseState(plat, i);
        this._platformSprites.push(plat);
      }

      // --- Platform collapse system state (Team 2 Coder A) ---
      this._matchTime = 0;
      this._collapseQueue = this._buildCollapseQueue();
      this._nextCollapseIndex = 0;
      this._nextCollapseTime = AP.PlatformCollapse.FIRST_COLLAPSE_DELAY;

      // Expose getActivePlatforms for ChaosEventSystem (Team 2 Coder B)
      var platformGroup = this.platforms;
      AP.ChaosEventSystem = AP.ChaosEventSystem || {};
      AP.ChaosEventSystem.getActivePlatforms = function () {
        return AP.PlatformCollapse.getActivePlatforms(platformGroup);
      };

      // --- Player ---
      this.player = new AP.Player(this, size * 0.5, size * 0.7);

      // Player collides with platforms
      this.physics.add.collider(this.player, this.platforms);

      // Store for update
      this.boundaryThickness = BOUNDARY_THICKNESS;

      // --- Black Hole ---
      this.setupBlackHole();

      // --- Gravity system (must come after black hole) ---
      this.setupGravity();
    },

    setupBlackHole: function () {
      var size = AP.gameSize;
      this.blackHole = new AP.BlackHole(this, size * 0.5, size * 0.5);
      AP.blackHoleInstance = this.blackHole;
    },

    setupGravity: function () {
      AP.GravitySystem.reset();

      if (this.player) {
        AP.GravitySystem.addBody(this.player);
      }

      if (this.players) {
        for (var i = 0; i < this.players.length; i++) {
          AP.GravitySystem.addBody(this.players[i]);
        }
      }
    },

    updateGravity: function (delta) {
      AP.GravitySystem.update(delta);
      // --- Chaos event system (Team 2 Coder B) ---
      this.setupChaos();
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

      // Gravity applied after input so it adds to player velocity instead of being overwritten
      this.updateGravity(delta);

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
      this.updatePlatforms(delta);
      this.updateChaos(time, delta);
    },

    // --- Team 2 Coder B: Chaos events ---

    setupChaos: function () {
      this.chaosSystem = new AP.ChaosEventSystem(this);
    },

    updateChaos: function (time, delta) {
      if (this.chaosSystem) {
        this.chaosSystem.update(time, delta);
      }
    },

    // --- Team 2 Coder A: Platform collapse ---

    /**
     * Build the collapse queue sorted by priority (outer first, central last).
     * Within the same priority tier, order is randomised for variety.
     */
    _buildCollapseQueue: function () {
      var sprites = this._platformSprites.slice();

      // Shuffle first so same-tier order is random
      for (var i = sprites.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = sprites[i];
        sprites[i] = sprites[j];
        sprites[j] = tmp;
      }

      // Stable-sort by priority tier (lower tier = earlier collapse)
      sprites.sort(function (a, b) {
        return a._collapsePriority - b._collapsePriority;
      });

      return sprites;
    },

    /**
     * updatePlatforms(delta) — called every frame from update().
     * Manages staggered collapse timers and warning flash animations.
     */
    updatePlatforms: function (delta) {
      this._matchTime += delta;

      // --- Trigger next collapse in queue ---
      if (this._nextCollapseIndex < this._collapseQueue.length &&
          this._matchTime >= this._nextCollapseTime) {

        var target = this._collapseQueue[this._nextCollapseIndex];
        // Only start collapse if the platform is still stable (might already be
        // collapsing from a Meteor Strike chaos event).
        if (target._collapseState === 'stable') {
          AP.PlatformCollapse.startCollapse(this, target);
        }
        this._nextCollapseIndex++;
        this._nextCollapseTime += AP.PlatformCollapse.COLLAPSE_STAGGER_INTERVAL;
      }

      // --- Update warning flash and collapse for all platforms ---
      var children = this._platformSprites;
      for (var i = 0; i < children.length; i++) {
        var p = children[i];
        if (p._collapseState === 'warning') {
          p._collapseTimer += delta;
          p._flashTimer += delta;

          // Toggle visibility to create blinking effect
          if (p._flashTimer >= AP.PlatformCollapse.COLLAPSE_FLASH_INTERVAL) {
            p._flashTimer -= 150;
            p.setAlpha(p.alpha < 1 ? 1 : 0.2);
          }

          // Warning phase over — collapse the platform
          if (p._collapseTimer >= AP.PlatformCollapse.COLLAPSE_WARNING_DURATION) {
            AP.PlatformCollapse.collapse(p);
          }
        }
      }
    }
  });
})();
