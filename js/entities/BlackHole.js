(function () {
  'use strict';

  var BASE_RADIUS = 20;
  var GROWTH_PER_SECOND = 2;          // passive growth rate (pixels/sec)
  var FEED_GROWTH = 3;                // radius increase per bullet absorbed
  var DRIFT_SPEED = 0.3;             // how fast the sine/cosine drift cycles
  var DRIFT_RANGE = 0.15;            // fraction of gameSize for drift amplitude
  var MAX_RADIUS = 150;               // cap to prevent absurd sizes
  var BASE_PULL_STRENGTH = 5000000;  // pull strength at base radius
  var BASE_SPIN_SPEED = 1.5;         // radians per second at base size
  var MAX_SPIN_SPEED = 6;            // radians per second at max size

  AP.BlackHole = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,

    initialize: function BlackHole(scene, x, y) {
      Phaser.GameObjects.Container.call(this, scene, x, y);
      scene.add.existing(this);

      this.radius = BASE_RADIUS;
      this._baseRadius = BASE_RADIUS;   // tracks growth independently of chaos multipliers
      this.pullStrength = BASE_PULL_STRENGTH;
      this._elapsed = 0;
      this._rotation = 0;
      this._driftOffsetX = Math.random() * Math.PI * 2;
      this._driftOffsetY = Math.random() * Math.PI * 2;
      this._centerX = x;
      this._centerY = y;

      // Sprite-based visual
      this._sprite = scene.add.image(0, 0, 'blackhole-sprite');
      this._sprite.setOrigin(0.5);
      this.add(this._sprite);

      // Outer glow (single graphics layer behind the sprite)
      this._glow = scene.add.graphics();
      this.addAt(this._glow, 0); // behind sprite

      // --- Particle swirl system (Phase 3 Polish Agent B) ---
      this._particleGfx = scene.add.graphics();
      this.addAt(this._particleGfx, 0); // behind glow + sprite
      this._particles = this._createParticles();

      // --- Accretion disk graphics layer (behind particles) ---
      this._diskGfx = scene.add.graphics();
      this.addAt(this._diskGfx, 0); // behind everything

      this.setDepth(5);
      this._updateVisuals();
    },

    _updateVisuals: function () {
      var r = this.radius;

      // Scale sprite to match radius (sprite diameter = 2 * radius * 1.2 for some overshoot)
      var spriteSize = this._sprite.width || 64;
      var targetDiameter = r * 2.4;
      var scale = targetDiameter / spriteSize;
      this._sprite.setScale(scale);

      // Tint: shifts from purple to red as it grows (angrier)
      var growthRatio = Math.min((r - BASE_RADIUS) / (MAX_RADIUS - BASE_RADIUS), 1);
      // Interpolate from purple (0xaa00ff) toward angry red (0xff0000)
      var rr = Math.floor(0xaa + (0xff - 0xaa) * growthRatio);
      var gg = 0x00;
      var bb = Math.floor(0xff * (1 - growthRatio));
      var tint = (rr << 16) | (gg << 8) | bb;
      this._sprite.setTint(tint);

      // Outer glow — gets redder and larger as it grows
      this._glow.clear();
      this._glow.fillStyle(tint, 0.15 + growthRatio * 0.1);
      this._glow.fillCircle(0, 0, r * 0.4);
      this._glow.fillStyle(tint, 0.08);
      this._glow.fillCircle(0, 0, r * 0.56);
    },

    /**
     * _createParticles() — generate swirl particle data.
     * Returns an array of particle objects with orbital properties.
     * Mix of purple/magenta orbit particles and blue/white hot particles.
     */
    _createParticles: function () {
      var PARTICLE_COUNT = 28;
      var particles = [];
      var purpleColors = [0xaa00ff, 0x8800cc, 0xcc44ff, 0x9933ee, 0x7722bb];
      var hotColors = [0x4488ff, 0x66aaff, 0xffffff, 0xaaccff, 0x88ddff];

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var isHot = Math.random() < 0.3; // 30% chance of blue/white hot particle
        var colors = isHot ? hotColors : purpleColors;
        var color = colors[Math.floor(Math.random() * colors.length)];

        // Orbit radius: starts at a random distance from center
        var orbitRadius = 0.6 + Math.random() * 1.2; // multiplier of black hole radius
        var angle = Math.random() * Math.PI * 2;
        var angularSpeed = 1.5 + Math.random() * 2.5; // radians per second
        // Clockwise or counter-clockwise with slight bias toward clockwise
        if (Math.random() < 0.3) angularSpeed = -angularSpeed;

        var size = 1 + Math.random() * 3; // 1-4px
        var alpha = 0.3 + Math.random() * 0.5;

        // Some particles spiral inward (decreasing orbit radius over time)
        var spiralRate = 0; // no spiral by default
        if (Math.random() < 0.45) {
          // Spiraling particle: slowly decreases orbit radius
          spiralRate = 0.03 + Math.random() * 0.06; // fraction of radius lost per second
        }

        particles.push({
          angle: angle,
          angularSpeed: angularSpeed,
          orbitRadius: orbitRadius,
          baseOrbitRadius: orbitRadius,
          spiralRate: spiralRate,
          size: size,
          color: color,
          alpha: alpha,
          isHot: isHot
        });
      }
      return particles;
    },

    /**
     * _updateParticles() — animate swirl particles orbiting the black hole.
     * Spiraling particles decrease their orbit radius over time and reset
     * when they reach the core.
     */
    _updateParticles: function (dt) {
      var gfx = this._particleGfx;
      var r = this.radius;
      gfx.clear();

      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i];

        // Advance orbital angle
        p.angle += p.angularSpeed * dt;

        // Spiral inward if this particle spirals
        if (p.spiralRate > 0) {
          p.orbitRadius -= p.spiralRate * dt;
          // Reset when it reaches the core
          if (p.orbitRadius < 0.15) {
            p.orbitRadius = p.baseOrbitRadius;
            p.angle = Math.random() * Math.PI * 2;
          }
        }

        // Calculate position relative to black hole center (0,0 in container space)
        var dist = p.orbitRadius * r;
        var px = Math.cos(p.angle) * dist;
        var py = Math.sin(p.angle) * dist;

        // Fade out as particle gets closer to center (selling the "swallowed" effect)
        var fadeAlpha = p.alpha;
        if (p.spiralRate > 0) {
          var radRatio = p.orbitRadius / p.baseOrbitRadius;
          fadeAlpha = p.alpha * (0.3 + 0.7 * radRatio);
        }

        gfx.fillStyle(p.color, fadeAlpha);
        gfx.fillCircle(px, py, p.size);
      }
    },

    /**
     * _drawAccretionDisk() — render a faint glowing ring/ellipse
     * around the black hole to simulate an accretion disk.
     */
    _drawAccretionDisk: function () {
      var gfx = this._diskGfx;
      var r = this.radius;
      gfx.clear();

      // Outer faint disk — ellipse wider than tall
      var diskRadius = r * 1.6;
      var diskHeight = r * 0.5;

      // Multiple passes for a soft glow buildup
      // Outermost: very faint, wide
      gfx.lineStyle(3, 0x6622aa, 0.05);
      gfx.strokeEllipse(0, 0, diskRadius * 2.2, diskHeight * 2.2);

      gfx.lineStyle(2, 0x7733bb, 0.07);
      gfx.strokeEllipse(0, 0, diskRadius * 1.8, diskHeight * 1.8);

      // Mid ring — slightly brighter
      gfx.lineStyle(2, 0x8844cc, 0.08);
      gfx.strokeEllipse(0, 0, diskRadius * 1.4, diskHeight * 1.4);

      // Inner ring — brightest but still subtle
      gfx.lineStyle(1.5, 0xaa55ee, 0.10);
      gfx.strokeEllipse(0, 0, diskRadius * 1.0, diskHeight * 1.0);

      // Hot inner edge — faint blue-white highlight
      gfx.lineStyle(1, 0x88bbff, 0.06);
      gfx.strokeEllipse(0, 0, diskRadius * 0.7, diskHeight * 0.7);
    },

    update: function (time, delta) {
      var dt = delta / 1000;
      this._elapsed += dt;

      // Passive growth (capped) — applied to base radius
      this._baseRadius = Math.min(this._baseRadius + GROWTH_PER_SECOND * dt, MAX_RADIUS);

      // Event Horizon Flash: temporarily double radius and kill zone while active
      var chaosMultiplier = 1;
      if (this.scene.chaosSystem && this.scene.chaosSystem.isActive('eventHorizonFlash')) {
        chaosMultiplier = 2;
      }
      this.radius = this._baseRadius * chaosMultiplier;

      // Update pull strength — scales with current (possibly boosted) radius
      this.pullStrength = BASE_PULL_STRENGTH * (this.radius / BASE_RADIUS);

      // Spin — faster as it grows (angrier)
      var growthRatio = Math.min((this.radius - BASE_RADIUS) / (MAX_RADIUS - BASE_RADIUS), 1);
      var spinSpeed = BASE_SPIN_SPEED + (MAX_SPIN_SPEED - BASE_SPIN_SPEED) * growthRatio;
      this._rotation += spinSpeed * dt;
      this._sprite.setRotation(this._rotation);

      // Drift around center using sine/cosine
      var size = AP.gameSize;
      var driftAmp = size * DRIFT_RANGE;
      this.x = this._centerX + Math.sin(this._elapsed * DRIFT_SPEED + this._driftOffsetX) * driftAmp;
      this.y = this._centerY + Math.cos(this._elapsed * DRIFT_SPEED * 0.7 + this._driftOffsetY) * driftAmp;

      // Update swirl particles and accretion disk (Phase 3 Polish)
      this._updateParticles(dt);
      this._drawAccretionDisk();

      // Update visuals (scale, tint, glow)
      this._updateVisuals();
    },

    feedBullet: function () {
      this._baseRadius = Math.min(this._baseRadius + FEED_GROWTH, MAX_RADIUS);
    },

    isInKillZone: function (px, py) {
      var dx = px - this.x;
      var dy = py - this.y;
      return Math.sqrt(dx * dx + dy * dy) < this.radius * 0.9;
    },

    destroy: function () {
      if (this._particleGfx) this._particleGfx.destroy();
      if (this._diskGfx) this._diskGfx.destroy();
      if (this._glow) this._glow.destroy();
      if (this._sprite) this._sprite.destroy();
      Phaser.GameObjects.Container.prototype.destroy.call(this);
    }
  });
})();
