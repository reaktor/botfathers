(function () {
  'use strict';

  // --- Powerup type definitions ---
  var POWERUP_TYPES = {
    RAPID_FIRE:    { key: 'rapid_fire',    color: 0xff0000, duration: 8000, shape: 'star',     label: 'Rapid Fire' },
    SHIELD:        { key: 'shield',        color: 0x0088ff, duration: -1,   shape: 'hexagon',  label: 'Shield' },
    TRIPLE_SHOT:   { key: 'triple_shot',   color: 0xffff00, duration: 8000, shape: 'triangle', label: 'Triple Shot' },
    SPEED_BOOST:   { key: 'speed_boost',   color: 0x00ff00, duration: 6000, shape: 'diamond',  label: 'Speed Boost' },
    GRAVITY_BOOTS: { key: 'gravity_boots', color: 0xff8800, duration: 6000, shape: 'square',   label: 'Gravity Boots' },
    BIG_BULLET:    { key: 'big_bullet',    color: 0xaa00ff, duration: -1,   shape: 'circle',   label: 'Big Bullet' },
    INVISIBILITY:  { key: 'invisibility',  color: 0xffffff, duration: 5000, shape: 'ring',     label: 'Invisibility' }
  };

  // Collect type keys for random selection
  var POWERUP_KEYS = Object.keys(POWERUP_TYPES);

  // Visual constants
  var POWERUP_RADIUS = 12;
  var BOB_AMPLITUDE = 4;
  var BOB_SPEED = 0.003;  // radians per ms
  var GLOW_PULSE_SPEED = 0.004;
  var DROP_FLOAT_DURATION = 5000;  // ms before a dropped powerup disappears

  /**
   * Powerup entity — a physics-enabled sprite drawn procedurally.
   * Spawns on platforms, can be picked up by players, dropped on death.
   */
  AP.Powerup = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Powerup(scene, x, y, typeKey) {
      // Generate procedural texture if not cached
      var textureName = 'powerup-' + typeKey;
      if (!scene.textures.exists(textureName)) {
        Powerup._generateTexture(scene, typeKey, textureName);
      }

      Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, textureName);
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.typeKey = typeKey;
      this.typeData = Powerup.getTypeData(typeKey);

      // Physics: powerup sits on platforms but doesn't move much
      this.body.setAllowGravity(true);
      this.body.setBounce(0.2);
      this.body.setSize(POWERUP_RADIUS * 2, POWERUP_RADIUS * 2);

      // Visual state
      this._bobPhase = Math.random() * Math.PI * 2;
      this._baseY = y;
      this._spawnTime = 0;  // set externally after spawn

      // Drop state
      this._isDropped = false;
      this._dropTimer = 0;

      // Depth — above platforms, below UI
      this.setDepth(50);
    },

    /**
     * Per-frame update: bobbing animation + drop expiry.
     * @param {number} delta — ms since last frame
     */
    updatePowerup: function (delta) {
      if (!this.active) return;

      // Bobbing when resting on platform
      if (this.body.blocked.down) {
        this._bobPhase += BOB_SPEED * delta;
        this._baseY = this.body.y;
        this.y = this._baseY + Math.sin(this._bobPhase) * BOB_AMPLITUDE;
      }

      // Glow pulse via alpha
      var pulse = 0.7 + 0.3 * Math.sin(this._bobPhase * 1.5);
      this.setAlpha(pulse);

      // If dropped, expire after duration
      if (this._isDropped) {
        this._dropTimer += delta;
        if (this._dropTimer >= DROP_FLOAT_DURATION) {
          this.destroy();
        }
      }
    },

    /**
     * Mark this powerup as dropped (from a dying player).
     */
    setDropped: function () {
      this._isDropped = true;
      this._dropTimer = 0;
      // Small upward impulse so it floats briefly
      this.body.setVelocityY(-120);
    },

    /**
     * Consume this powerup (picked up by a player).
     */
    consume: function () {
      this.destroy();
    }
  });

  // --- Static helpers ---

  /**
   * Get the type data for a given type key string.
   */
  AP.Powerup.getTypeData = function (typeKey) {
    for (var i = 0; i < POWERUP_KEYS.length; i++) {
      if (POWERUP_TYPES[POWERUP_KEYS[i]].key === typeKey) {
        return POWERUP_TYPES[POWERUP_KEYS[i]];
      }
    }
    return null;
  };

  /**
   * Get a random powerup type key.
   */
  AP.Powerup.getRandomTypeKey = function () {
    var idx = Math.floor(Math.random() * POWERUP_KEYS.length);
    return POWERUP_TYPES[POWERUP_KEYS[idx]].key;
  };

  /**
   * All powerup type definitions (read-only reference).
   */
  AP.Powerup.TYPES = POWERUP_TYPES;
  AP.Powerup.RADIUS = POWERUP_RADIUS;
  AP.Powerup.DROP_FLOAT_DURATION = DROP_FLOAT_DURATION;

  // --- Procedural texture generation ---

  AP.Powerup._generateTexture = function (scene, typeKey, textureName) {
    var typeData = AP.Powerup.getTypeData(typeKey);
    if (!typeData) return;

    var size = POWERUP_RADIUS * 2 + 4;  // extra padding for glow
    var cx = size / 2;
    var cy = size / 2;
    var r = POWERUP_RADIUS;

    var gfx = scene.add.graphics();

    // Glow background
    gfx.fillStyle(typeData.color, 0.25);
    gfx.fillCircle(cx, cy, r + 2);

    // Main shape
    gfx.fillStyle(typeData.color, 0.9);
    gfx.lineStyle(2, 0xffffff, 0.8);

    switch (typeData.shape) {
      case 'star':
        _drawStar(gfx, cx, cy, r * 0.5, r, 5);
        break;

      case 'hexagon':
        _drawPolygon(gfx, cx, cy, r * 0.85, 6);
        break;

      case 'triangle':
        _drawPolygon(gfx, cx, cy, r * 0.9, 3);
        break;

      case 'diamond':
        _drawDiamond(gfx, cx, cy, r * 0.7, r);
        break;

      case 'square':
        gfx.fillRect(cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2);
        gfx.strokeRect(cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2);
        break;

      case 'circle':
        gfx.fillCircle(cx, cy, r * 0.8);
        gfx.strokeCircle(cx, cy, r * 0.8);
        break;

      case 'ring':
        gfx.lineStyle(3, typeData.color, 0.9);
        gfx.strokeCircle(cx, cy, r * 0.7);
        gfx.fillStyle(typeData.color, 0.3);
        gfx.fillCircle(cx, cy, r * 0.4);
        break;

      default:
        gfx.fillCircle(cx, cy, r * 0.8);
        break;
    }

    gfx.generateTexture(textureName, size, size);
    gfx.destroy();
  };

  // --- Shape drawing helpers ---

  function _drawStar(gfx, cx, cy, innerR, outerR, points) {
    var pts = [];
    for (var i = 0; i < points * 2; i++) {
      var angle = (i * Math.PI) / points - Math.PI / 2;
      var radius = (i % 2 === 0) ? outerR : innerR;
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) {
      gfx.lineTo(pts[j].x, pts[j].y);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

  function _drawPolygon(gfx, cx, cy, radius, sides) {
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) {
      gfx.lineTo(pts[j].x, pts[j].y);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

  function _drawDiamond(gfx, cx, cy, halfW, halfH) {
    gfx.beginPath();
    gfx.moveTo(cx, cy - halfH);
    gfx.lineTo(cx + halfW, cy);
    gfx.lineTo(cx, cy + halfH);
    gfx.lineTo(cx - halfW, cy);
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

})();
