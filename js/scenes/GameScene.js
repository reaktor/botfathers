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

      // Reset state from previous round
      this._gameOver = false;
      this._countdownActive = false;

      // Reset keyboard so keys don't stay "stuck" from the previous scene
      this.input.keyboard.resetKeys();

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
        // Mark moving platforms (Phase 2.75)
        if (p.moving) {
          plat._moving = true;
          plat._moveOriginX = px;
          plat._moveSpeed = p.moveSpeed * size;
          plat._moveRange = p.moveRange * size;
          plat._moveTime = Math.random() * Math.PI * 2; // random phase offset
        }
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

      // --- Players ---
      var playerCount = (this.scene.settings.data && this.scene.settings.data.playerCount) || 4;
      this.players = [];
      this.playerCount = playerCount;

      // Spawn positions — 4 corners
      var margin = size * 0.12;
      var spawnPoints = [
        { x: margin,        y: size * 0.8 },          // top-left area
        { x: size - margin, y: size * 0.8 },          // top-right area
        { x: margin,        y: size * 0.15 },         // bottom-left area
        { x: size - margin, y: size * 0.15 }          // bottom-right area
      ];

      for (var pi = 0; pi < playerCount; pi++) {
        var sp = spawnPoints[pi];
        var p = new AP.Player(this, sp.x, sp.y, pi);
        this.physics.add.collider(p, this.platforms);
        this.players.push(p);
      }

      // Player-player overlap for stomp + knockback
      for (var a = 0; a < this.players.length; a++) {
        for (var b = a + 1; b < this.players.length; b++) {
          this.physics.add.overlap(this.players[a], this.players[b], this._onPlayerCollision, null, this);
        }
      }

      // Keep backwards compat — this.player points to P1
      this.player = this.players[0];

      // Store for update
      this.boundaryThickness = BOUNDARY_THICKNESS;

      // --- Audio: start on first interaction ---
      this._audioStarted = false;
      this.input.once('pointerdown', this._startAudio, this);
      this.input.keyboard.once('keydown', this._startAudio, this);

      // --- Black Hole ---
      this.setupBlackHole();

      // --- Gravity system (must come after black hole) ---
      this.setupGravity();

      // --- Chaos event system (Team 2 Coder B) ---
      this.setupChaos();

      // --- Countdown before gameplay begins (Team 2 Agent B — Phase 2.5) ---
      this._startCountdown();
    },

    _buildBackground: function (size) {
      this.add.image(size / 2, size / 2, 'bg-panels');
    },

    /**
     * _startCountdown() — 3-2-1-GO! countdown at match start.
     * Pauses physics during countdown, resumes after "GO!" fades.
     * Uses Phaser time events (this.time.delayedCall).
     */
    _startCountdown: function () {
      var self = this;
      var size = AP.gameSize;
      var cx = size / 2;
      var cy = size / 2;

      // Pause physics so players are visible but frozen
      this.physics.pause();

      // Track whether countdown is active (other systems can check this)
      this._countdownActive = true;

      // Create countdown text — large, centered, monospace, neon cyan
      var countdownText = this.add.text(cx, cy, '3', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: Math.floor(size * 0.2) + 'px',
        color: '#00ffff',
        fontStyle: 'bold',
        align: 'center'
      });
      countdownText.setOrigin(0.5);
      countdownText.setDepth(1000);

      // "3" shows for 0.4s, then "2"
      this.time.delayedCall(400, function () {
        countdownText.setText('2');
        countdownText.setColor('#ff00ff');
      });

      // "2" shows for 0.4s, then "1"
      this.time.delayedCall(800, function () {
        countdownText.setText('1');
        countdownText.setColor('#ff8800');
      });

      // "1" shows for 0.4s, then "GO!"
      this.time.delayedCall(1200, function () {
        countdownText.setText('GO!');
        countdownText.setColor('#00ff66');
        countdownText.setFontSize(Math.floor(size * 0.18) + 'px');

        // "GO!" fades out over 0.5s, then resume gameplay
        self.tweens.add({
          targets: countdownText,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: function () {
            countdownText.destroy();
            self._countdownActive = false;
            self.physics.resume();
          }
        });
      });
    },

    _onPlayerCollision: function (playerA, playerB) {
      if (!playerA.active || !playerB.active) return;
      if (playerA.isKnockbackActive() || playerB.isKnockbackActive()) return;

      var STOMP_ZONE = 0.25; // top 25% of sprite = stomp zone
      var KNOCKBACK_FORCE = 2100;

      // Check head stomp: is one player falling onto the other?
      var aBottom = playerA.y + playerA.displayHeight / 2;
      var bTop = playerB.y - playerB.displayHeight / 2;
      var bBottom = playerB.y + playerB.displayHeight / 2;
      var aTop = playerA.y - playerA.displayHeight / 2;

      var stompThreshold = playerB.displayHeight * STOMP_ZONE;

      // A stomps B (A is falling, A's feet near B's head)
      if (playerA.body.velocity.y > 0 && aBottom >= bTop && aBottom <= bTop + stompThreshold) {
        playerA.stompBounce();
        if (AP.AudioManager && AP.AudioManager.playDeath) {
          AP.AudioManager.playDeath();
        }
        if (typeof playerB.eliminate === 'function') {
          playerB.eliminate();
        } else {
          playerB.setActive(false).setVisible(false);
        }
        return;
      }

      // B stomps A
      if (playerB.body.velocity.y > 0 && bBottom >= aTop && bBottom <= aTop + stompThreshold) {
        playerB.stompBounce();
        if (AP.AudioManager && AP.AudioManager.playDeath) {
          AP.AudioManager.playDeath();
        }
        if (typeof playerA.eliminate === 'function') {
          playerA.eliminate();
        } else {
          playerA.setActive(false).setVisible(false);
        }
        return;
      }

      // Side bump — determine push direction
      var dirA = (playerA.x < playerB.x) ? -1 : 1;
      var dirB = -dirA;

      var aMoving = Math.abs(playerA.body.velocity.x) > 20;
      var bMoving = Math.abs(playerB.body.velocity.x) > 20;

      if (aMoving && bMoving) {
        // Both moving — both bounce apart
        playerA.applyKnockback(dirA, KNOCKBACK_FORCE);
        playerB.applyKnockback(dirB, KNOCKBACK_FORCE);
      } else if (aMoving) {
        // A moving, B still — B gets pushed
        playerB.applyKnockback(dirB, KNOCKBACK_FORCE);
      } else if (bMoving) {
        // B moving, A still — A gets pushed
        playerA.applyKnockback(dirA, KNOCKBACK_FORCE);
      } else {
        // Both still — gentle push apart
        playerA.applyKnockback(dirA, KNOCKBACK_FORCE * 0.5);
        playerB.applyKnockback(dirB, KNOCKBACK_FORCE * 0.5);
      }
    },

    setupBlackHole: function () {
      var size = AP.gameSize;
      this.blackHole = new AP.BlackHole(this, size * 0.5, size * 0.5);
      AP.blackHoleInstance = this.blackHole;
    },

    setupGravity: function () {
      AP.GravitySystem.reset();

      for (var i = 0; i < this.players.length; i++) {
        AP.GravitySystem.addBody(this.players[i]);
      }
    },

    updateGravity: function (delta) {
      AP.GravitySystem.update(delta);
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
      // Skip all gameplay logic while countdown is active (Phase 2.5)
      if (this._countdownActive) return;
      if (this._gameOver) return;

      // Handle input for all alive players
      for (var i = 0; i < this.players.length; i++) {
        var p = this.players[i];
        if (p.active) {
          p.handleInput(
            this.controls[i],
            delta,
            AP.HOLES,
            AP.gameSize,
            this.boundaryThickness
          );
        }
      }

      // Gravity after input so pull accumulates when idle
      this.updateGravity(delta);

      this.updatePlatforms(delta);
      this.updateChaos(time, delta);

      // Update black hole (drift, grow, redraw)
      if (this.blackHole) {
        this.blackHole.update(time, delta);

        // Black hole eats platforms it overlaps (Team 2 Phase 2.75 Agent A)
        var bh = this.blackHole;
        for (var pi2 = 0; pi2 < this._platformSprites.length; pi2++) {
          var plat = this._platformSprites[pi2];
          if (plat._collapseState === 'stable') {
            var dx = bh.x - plat.x;
            var dy = bh.y - plat.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var platHalfWidth = plat.displayWidth / 2;
            if (dist < bh.radius + platHalfWidth) {
              AP.PlatformCollapse.startCollapse(this, plat);
            }
          }
        }

        // Kill zone check — instant death on contact for all players
        for (var k = 0; k < this.players.length; k++) {
          var pl = this.players[k];
          if (pl.active && this.blackHole.isInKillZone(pl.x, pl.y)) {
            if (typeof pl.eliminate === 'function') {
              pl.eliminate();
            } else {
              pl.setActive(false).setVisible(false);
            }
          }
        }
      }

      this.checkWinCondition();
    },

    checkWinCondition: function () {
      var alive = [];
      for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].active) {
          alive.push(i);
        }
      }

      if (alive.length <= 1) {
        this._gameOver = true;
        var winner = alive.length === 1 ? alive[0] : 0;

        // Short delay before showing game over
        var self = this;
        this.time.delayedCall(1000, function () {
          self.scene.start('GameOverScene', { winner: winner });
        });
      }
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

    _buildCollapseQueue: function () {
      var sprites = this._platformSprites.slice();

      for (var i = sprites.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = sprites[i];
        sprites[i] = sprites[j];
        sprites[j] = tmp;
      }

      sprites.sort(function (a, b) {
        return a._collapsePriority - b._collapsePriority;
      });

      return sprites;
    },

    updatePlatforms: function (delta) {
      this._matchTime += delta;

      if (this._nextCollapseIndex < this._collapseQueue.length &&
          this._matchTime >= this._nextCollapseTime) {

        var target = this._collapseQueue[this._nextCollapseIndex];
        if (target._collapseState === 'stable') {
          AP.PlatformCollapse.startCollapse(this, target);
        }
        this._nextCollapseIndex++;
        this._nextCollapseTime += AP.PlatformCollapse.COLLAPSE_STAGGER_INTERVAL;
      }

      var children = this._platformSprites;
      for (var i = 0; i < children.length; i++) {
        var p = children[i];

        // --- Moving platforms (Phase 2.75) ---
        if (p._moving && p._collapseState === 'stable') {
          p._moveTime += delta * 0.001;
          var newX = p._moveOriginX + Math.sin(p._moveTime * p._moveSpeed * 10) * p._moveRange;
          p.x = newX;
          p.body.position.x = newX - p.body.width / 2;
        }

        if (p._collapseState === 'warning') {
          p._collapseTimer += delta;
          p._flashTimer += delta;

          if (p._flashTimer >= AP.PlatformCollapse.COLLAPSE_FLASH_INTERVAL) {
            p._flashTimer -= 150;
            p.setAlpha(p.alpha < 1 ? 1 : 0.2);
          }

          if (p._collapseTimer >= AP.PlatformCollapse.COLLAPSE_WARNING_DURATION) {
            AP.PlatformCollapse.collapse(p);
          }
        }
      }
    }
  });
})();
