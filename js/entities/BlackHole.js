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

    update: function (time, delta) {
      var dt = delta / 1000;
      this._elapsed += dt;

      // Passive growth (capped)
      this.radius = Math.min(this.radius + GROWTH_PER_SECOND * dt, MAX_RADIUS);

      // Update pull strength — scales with radius
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

      // Update visuals (scale, tint, glow)
      this._updateVisuals();
    },

    feedBullet: function () {
      this.radius = Math.min(this.radius + FEED_GROWTH, MAX_RADIUS);
    },

    isInKillZone: function (px, py) {
      var dx = px - this.x;
      var dy = py - this.y;
      return Math.sqrt(dx * dx + dy * dy) < this.radius * 0.9;
    },

    destroy: function () {
      if (this._glow) this._glow.destroy();
      if (this._sprite) this._sprite.destroy();
      Phaser.GameObjects.Container.prototype.destroy.call(this);
    }
  });
})();
