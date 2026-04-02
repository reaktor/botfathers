(function () {
  'use strict';

  var BOUNDARY_THICKNESS = 16;

  AP.GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
      Phaser.Scene.call(this, { key: 'GameScene' });
    },

    create: function () {
      // Kill ALL orphaned AP sprite overlays from menu/previous scene
      var orphans = document.querySelectorAll('.ap-sprite-overlay');
      for (var oi = 0; oi < orphans.length; oi++) {
        orphans[oi].parentNode.removeChild(orphans[oi]);
      }
      AP._menuHeroImg = null;

      var size = AP.gameSize;

      // Reset state from previous round
      this._gameOver = false;
      this._countdownActive = false;

      // Reset keyboard so keys don't stay "stuck" from the previous scene
      this.input.keyboard.resetKeys();

      this.controls = AP.InputManager.create(this);

      // --- Parallax starfield (behind everything, depth -10) ---
      this._setupStarfield(size);

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

      // --- Bullets + combat (Team 1 Coder A) ---
      this.setupBullets();

      // --- Powerup system (Team 1 Coder B) ---
      this.setupPowerups();

      // --- Chaos event system (Team 2 Coder B) ---
      this.setupChaos();

      // --- Player health HUD ---
      this.setupHUD();

      // --- Countdown before gameplay begins (Team 2 Agent B — Phase 2.5) ---
      this._startCountdown();
    },

    _buildBackground: function (size) {
      this.add.image(size / 2, size / 2, 'bg-panels');
    },

    /**
     * _setupStarfield() — creates a slow-drifting parallax star layer
     * behind everything (depth -10). Stars are tiny circles of varying
     * size (0.5-2px) that drift slowly upward/diagonal at 5-15 px/s.
     * Smaller stars drift slower to give a depth/parallax feel.
     */
    _setupStarfield: function (size) {
      var STAR_COUNT = 40 + Math.floor(Math.random() * 21); // 40-60
      var starColors = [0xffffff, 0xccddff, 0xaabbff, 0xddeeff, 0x99aaff];
      this._stars = [];

      for (var i = 0; i < STAR_COUNT; i++) {
        var radius = 0.5 + Math.random() * 1.5; // 0.5 - 2px
        var alpha = 0.2 + Math.random() * 0.6;  // 0.2 - 0.8
        var color = starColors[Math.floor(Math.random() * starColors.length)];

        // Speed proportional to size — smaller = slower = further away
        // Range: ~5 px/s for 0.5px stars, ~15 px/s for 2px stars
        var speed = 5 + (radius - 0.5) * (10 / 1.5);

        // Slight horizontal drift — each star drifts at a slightly different angle
        var driftAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // mostly upward, slight diagonal

        var g = this.add.graphics();
        g.fillStyle(color, alpha);
        g.fillCircle(0, 0, radius);
        g.setPosition(Math.random() * size, Math.random() * size);
        g.setDepth(-10);

        this._stars.push({
          graphic: g,
          speed: speed,
          dx: Math.cos(driftAngle) * speed,
          dy: Math.sin(driftAngle) * speed
        });
      }
    },

    /**
     * _updateStarfield() — move stars by their drift vector, wrap around
     * screen edges so the starfield is seamless and infinite.
     */
    _updateStarfield: function (delta) {
      if (!this._stars) return;
      var dt = delta / 1000;
      var size = AP.gameSize;

      for (var i = 0; i < this._stars.length; i++) {
        var star = this._stars[i];
        var g = star.graphic;

        g.x += star.dx * dt;
        g.y += star.dy * dt;

        // Wrap around screen edges
        if (g.y < -4) g.y = size + 2;
        if (g.y > size + 4) g.y = -2;
        if (g.x < -4) g.x = size + 2;
        if (g.x > size + 4) g.x = -2;
      }
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

      // Hide all sprite overlays during countdown
      var overlays = document.querySelectorAll('.ap-sprite-overlay');
      for (var hi = 0; hi < overlays.length; hi++) overlays[hi].style.display = 'none';

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
            // Show sprite overlays now that gameplay starts
            var ols = document.querySelectorAll('.ap-sprite-overlay');
            for (var si = 0; si < ols.length; si++) ols[si].style.display = '';
          }
        });
      });
    },

    _onPlayerCollision: function (playerA, playerB) {
      if (!playerA.active || !playerB.active) return;
      if (!playerA.alive || !playerB.alive) return;
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
      // Starfield drifts always — even during countdown and game over
      this._updateStarfield(delta);

      // Skip all gameplay logic while countdown is active (Phase 2.5)
      if (this._countdownActive) return;
      if (this._gameOver) return;

      // Handle input for all alive players + sync animated WebP overlays
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
        if (p.syncAnimImg) p.syncAnimImg();
      }

      // Gravity after input so pull accumulates when idle
      this.updateGravity(delta);

      // Bullets (Team 1 Coder A)
      this.updateBullets(delta);

      this.updatePowerups(delta);
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

      // Update health HUD
      this.updateHUD();

      // Win condition check
      this.checkWinCondition();
    },

    // --- Team 1 Coder A: Bullets + Combat ---

    setupBullets: function () {
      this.bulletGroup = AP.Bullet.createPool(this);

      // Bullet-platform collider: destroy bullet on platform hit
      this.physics.add.collider(this.bulletGroup, this.platforms, function (bullet) {
        bullet.recycle();
      });

      // Bullet-player hits are checked manually in updateBullets()
      // because Phaser overlap with pooled groups can miss detections.
    },

    updateBullets: function (delta) {
      if (!this.bulletGroup) return;

      var gameSize = AP.gameSize;
      var controls = this.controls;
      var bulletGroup = this.bulletGroup;

      // Handle shooting input for all players
      for (var i = 0; i < this.players.length; i++) {
        var p = this.players[i];
        if (p && p.alive && controls[i] && controls[i].shoot) {
          if (Phaser.Input.Keyboard.JustDown(controls[i].shoot)) {
            p.shoot(bulletGroup);
          }
        }
      }

      // Manual bullet-player hit detection
      var bullets = bulletGroup.getChildren();
      for (var j = bullets.length - 1; j >= 0; j--) {
        var b = bullets[j];
        if (!b.active) continue;

        // Check hit against each player
        for (var k = 0; k < this.players.length; k++) {
          var target = this.players[k];
          if (!target.alive || !target.active) continue;
          if (b.ownerIndex === target.playerIndex) continue;

          var dx = b.x - target.x;
          var dy = b.y - target.y;
          var hitDist = AP.PLAYER_RENDER_SIZE * 0.4;
          if (dx * dx + dy * dy < hitDist * hitDist) {
            target.takeDamage(b.damage);
            if (AP.AudioManager && AP.AudioManager.playHit) {
              AP.AudioManager.playHit();
            }
            b.recycle();
            break;
          }
        }

        if (!b.active) continue;

        // Black hole gravity pull on bullets
        var bh = AP.blackHoleInstance;
        if (bh) {
          var gdx = bh.x - b.x;
          var gdy = bh.y - b.y;
          var gDistSq = gdx * gdx + gdy * gdy;
          var gDist = Math.sqrt(gDistSq);
          if (gDist < 30) gDist = 30;
          gDistSq = gDist * gDist;

          var pullStr = bh.pullStrength;
          if (AP.ChaosEventSystem && AP.ChaosEventSystem.isActive && AP.ChaosEventSystem.isActive('gravitySurge')) {
            pullStr *= 2;
          }

          var gForce = pullStr / gDistSq;
          if (gForce > 2000) gForce = 2000;

          var dt = delta / 1000;
          var gnx = gdx / gDist;
          var gny = gdy / gDist;
          b.body.velocity.x += gnx * gForce * dt;
          b.body.velocity.y += gny * gForce * dt;

          // Feed black hole if bullet enters kill zone
          if (bh.isInKillZone(b.x, b.y)) {
            bh.feedBullet();
            b.recycle();
            continue;
          }
        }

        // Recycle if off-screen (any edge)
        if (b.x < -10 || b.x > gameSize + 10 || b.y < -50 || b.y > gameSize + 50) {
          b.recycle();
        }
      }
    },

    checkWinCondition: function () {
      if (this._gameOver) return;

      var alive = [];
      for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].alive) {
          alive.push(i);
        }
      }

      if (alive.length <= 1) {
        this._gameOver = true;
        var winner = alive.length === 1 ? alive[0] : 0;

        // Short delay before showing game over
        // Clean up all player DOM imgs before leaving
        var self = this;
        for (var ci = 0; ci < this.players.length; ci++) {
          if (this.players[ci].removeAnimImg) this.players[ci].removeAnimImg();
        }
        this.time.delayedCall(1000, function () {
          self.scene.start('GameOverScene', { winner: winner, playerCount: self.playerCount });
        });
      }
    },

    // --- Team 1 Coder B: Powerups ---

    setupPowerups: function () {
      // Create the powerup spawner
      this.powerupSpawner = new AP.PowerupSpawner(this, this.platforms);

      // Setup overlap detection between player(s) and spawned powerups.
      // We use a per-frame manual check since powerups are created dynamically
      // and aren't in a single Arcade group with fixed membership.
    },

    updatePowerups: function (delta) {
      if (!this.powerupSpawner) return;

      // Update spawner (handles spawn timers + per-powerup animation)
      this.powerupSpawner.update(delta);

      // Collect all players into an array (supports both single and multi-player)
      var players = this.players || (this.player ? [this.player] : []);

      // Check pickup overlaps
      var activePowerups = this.powerupSpawner.activePowerups;
      for (var i = activePowerups.length - 1; i >= 0; i--) {
        var powerup = activePowerups[i];
        if (!powerup || !powerup.active) continue;

        for (var j = 0; j < players.length; j++) {
          var player = players[j];
          if (!player || !player.active) continue;

          // Simple distance-based overlap check
          var dx = player.x - powerup.x;
          var dy = player.y - powerup.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var pickupRange = AP.Powerup.RADIUS + AP.PLAYER_HITBOX_W / 2;

          if (dist < pickupRange) {
            player.pickupPowerup(powerup.typeKey);
            powerup.consume();
            break;  // powerup consumed, move to next
          }
        }
      }

      // Update powerup duration timers for all players
      for (var k = 0; k < players.length; k++) {
        var p = players[k];
        if (!p || !p.active || !p._powerupType) continue;

        // Update glow position to follow player
        if (p._powerupGlow && p._powerupGlow.active) {
          p._powerupGlow.setPosition(p.x, p.y);
        }

        // Duration countdown (skip for -1 which means "until consumed/hit")
        if (p._powerupTimeLeft > 0) {
          p._powerupTimeLeft -= delta;
          if (p._powerupTimeLeft <= 0) {
            p.clearPowerup();
          }
        }
      }
    },

    // --- Team 2 Coder B: Chaos events ---

    // --- Health HUD ---

    setupHUD: function () {
      var size = AP.gameSize;
      var playerCount = this.playerCount;
      var colors = AP.PLAYER_COLORS;
      var maxHp = 3;

      this._hudHearts = [];

      // Layout: evenly space player groups across the top
      var groupWidth = size / playerCount;
      var heartSize = Math.max(8, Math.min(14, size * 0.018));
      var heartGap = heartSize * 1.6;
      var yPos = 28;

      for (var i = 0; i < playerCount; i++) {
        var hearts = [];
        var cx = groupWidth * i + groupWidth / 2;
        var startX = cx - ((maxHp - 1) * heartGap) / 2;

        // Player label
        var label = this.add.text(cx, yPos - heartSize - 4, 'P' + (i + 1), {
          fontFamily: 'Courier New, monospace',
          fontSize: Math.round(heartSize * 1.1) + 'px',
          color: '#' + ('000000' + colors[i].toString(16)).slice(-6),
          fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(900);
        label.setShadow(0, 0, '#000000', 3);

        for (var h = 0; h < maxHp; h++) {
          var hx = startX + h * heartGap;
          var gfx = this.add.graphics().setDepth(900);
          this._drawHeart(gfx, hx, yPos, heartSize, colors[i], 1);
          hearts.push({ gfx: gfx, x: hx, y: yPos, size: heartSize, color: colors[i] });
        }

        this._hudHearts.push({ hearts: hearts, label: label, lastHp: maxHp });
      }
    },

    _drawHeart: function (gfx, x, y, size, color, alpha) {
      gfx.clear();
      // Filled heart shape
      gfx.fillStyle(color, alpha);
      gfx.fillCircle(x - size * 0.3, y - size * 0.15, size * 0.45);
      gfx.fillCircle(x + size * 0.3, y - size * 0.15, size * 0.45);
      gfx.fillTriangle(
        x - size * 0.7, y + size * 0.05,
        x + size * 0.7, y + size * 0.05,
        x, y + size * 0.75
      );
    },

    updateHUD: function () {
      if (!this._hudHearts) return;

      for (var i = 0; i < this._hudHearts.length; i++) {
        var data = this._hudHearts[i];
        var player = this.players[i];
        var hp = player.alive ? player.hp : 0;

        if (hp !== data.lastHp) {
          data.lastHp = hp;
          var hearts = data.hearts;
          for (var h = 0; h < hearts.length; h++) {
            var heart = hearts[h];
            var alive = h < hp;
            this._drawHeart(heart.gfx, heart.x, heart.y, heart.size, heart.color, alive ? 1 : 0.15);
          }
        }
      }
    },

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
