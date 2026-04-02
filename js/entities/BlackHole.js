(function () {
  'use strict';

  var BASE_RADIUS = 20;
  var GROWTH_PER_SECOND = 0.4;       // passive growth rate (pixels/sec)
  var FEED_GROWTH = 3;                // radius increase per bullet absorbed
  var DRIFT_SPEED = 0.3;             // how fast the sine/cosine drift cycles
  var DRIFT_RANGE = 0.15;            // fraction of gameSize for drift amplitude
  var MAX_RADIUS = 150;               // cap to prevent absurd sizes
  var BASE_PULL_STRENGTH = 8000;     // pull strength at base radius
  var PULSE_MIN = 0.85;
  var PULSE_MAX = 1.15;
  var PULSE_SPEED = 1500;            // ms per pulse cycle
  var NUM_LAYERS = 5;
  var PARTICLE_COUNT = 12;

  AP.BlackHole = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,

    initialize: function BlackHole(scene, x, y) {
      Phaser.GameObjects.Container.call(this, scene, x, y);
      scene.add.existing(this);

      this.radius = BASE_RADIUS;
      this.pullStrength = BASE_PULL_STRENGTH;
      this._elapsed = 0;
      this._driftOffsetX = Math.random() * Math.PI * 2;
      this._driftOffsetY = Math.random() * Math.PI * 2;
      this._centerX = x;
      this._centerY = y;

      // Visual layers — drawn via graphics objects, added to container for pulse tween
      this._layers = [];
      for (var i = 0; i < NUM_LAYERS; i++) {
        var g = scene.add.graphics();
        this.add(g);
        this._layers.push(g);
      }

      // Swirl particles (small circles orbiting)
      this._particles = [];
      for (var j = 0; j < PARTICLE_COUNT; j++) {
        var pg = scene.add.graphics();
        this.add(pg);
        this._particles.push({
          graphics: pg,
          angle: (Math.PI * 2 / PARTICLE_COUNT) * j,
          dist: 0.8 + Math.random() * 0.6,  // distance multiplier relative to radius
          speed: 1.5 + Math.random() * 1.5,  // radians per second
          size: 1 + Math.random() * 2
        });
      }

      // Pulse tween on the container scale
      scene.tweens.add({
        targets: this,
        scaleX: PULSE_MAX,
        scaleY: PULSE_MAX,
        duration: PULSE_SPEED,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.setDepth(5);
      this._drawVisuals();
    },

    _drawVisuals: function () {
      var r = this.radius;

      // Layered glow circles from outer (dim, large) to inner (bright, small)
      var colors = [0x220033, 0x440066, 0x6600aa, 0x8800dd, 0xaa00ff];
      var alphas = [0.15, 0.2, 0.3, 0.5, 0.8];

      for (var i = 0; i < NUM_LAYERS; i++) {
        var g = this._layers[i];
        g.clear();
        var layerRadius = r * (1.8 - i * 0.2);
        g.fillStyle(colors[i], alphas[i]);
        g.fillCircle(0, 0, layerRadius);
      }

      // Core — solid dark center
      var core = this._layers[NUM_LAYERS - 1];
      core.fillStyle(0x000000, 0.9);
      core.fillCircle(0, 0, r * 0.4);
    },

    _updateParticles: function (delta) {
      var dt = delta / 1000;
      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i];
        p.angle += p.speed * dt;
        var dist = this.radius * p.dist;
        var px = Math.cos(p.angle) * dist;
        var py = Math.sin(p.angle) * dist;

        p.graphics.clear();
        p.graphics.fillStyle(0xcc66ff, 0.5);
        p.graphics.fillCircle(px, py, p.size);
      }
    },

    update: function (time, delta) {
      var dt = delta / 1000;
      this._elapsed += dt;

      // Passive growth (capped)
      this.radius = Math.min(this.radius + GROWTH_PER_SECOND * dt, MAX_RADIUS);

      // Update pull strength — scales with radius
      this.pullStrength = BASE_PULL_STRENGTH * (this.radius / BASE_RADIUS);

      // Drift around center using sine/cosine
      var size = AP.gameSize;
      var driftAmp = size * DRIFT_RANGE;
      this.x = this._centerX + Math.sin(this._elapsed * DRIFT_SPEED + this._driftOffsetX) * driftAmp;
      this.y = this._centerY + Math.cos(this._elapsed * DRIFT_SPEED * 0.7 + this._driftOffsetY) * driftAmp;

      // Redraw visuals at new position/size
      this._drawVisuals();
      this._updateParticles(delta);
    },

    feedBullet: function () {
      this.radius = Math.min(this.radius + FEED_GROWTH, MAX_RADIUS);
    },

    /**
     * Check if a point (or body center) is inside the kill zone.
     * Returns true if the distance from (px,py) to the black hole center
     * is less than the current radius.
     */
    isInKillZone: function (px, py) {
      var dx = px - this.x;
      var dy = py - this.y;
      return Math.sqrt(dx * dx + dy * dy) < this.radius * 0.9;
    },

    destroy: function () {
      var i;
      for (i = 0; i < this._layers.length; i++) {
        this._layers[i].destroy();
      }
      for (i = 0; i < this._particles.length; i++) {
        this._particles[i].graphics.destroy();
      }
      Phaser.GameObjects.Container.prototype.destroy.call(this);
    }
  });
})();
