(function () {
  'use strict';

  // Spawn timing constants
  var SPAWN_MIN_INTERVAL = 10000;  // 10 seconds minimum between spawns
  var SPAWN_MAX_INTERVAL = 15000;  // 15 seconds maximum between spawns
  var MAX_WORLD_POWERUPS = 5;       // max uncollected powerups on field at once

  /**
   * PowerupSpawner — manages timed spawning of powerups on active platforms.
   *
   * @param {Phaser.Scene} scene — the GameScene instance
   * @param {Phaser.Physics.Arcade.StaticGroup} platformGroup — the platforms group
   */
  function PowerupSpawner(scene, platformGroup) {
    this.scene = scene;
    this.platformGroup = platformGroup;

    /** @type {AP.Powerup[]} All active (uncollected) powerups in the world */
    this.activePowerups = [];

    // Time until next spawn
    this._spawnTimer = 0;
    this._nextSpawnDelay = _randomSpawnDelay();
  }

  /**
   * Update the spawner each frame.
   * @param {number} delta — ms since last frame
   */
  PowerupSpawner.prototype.update = function (delta) {
    this._spawnTimer += delta;

    // Spawn a new powerup when timer expires
    if (this._spawnTimer >= this._nextSpawnDelay) {
      this._spawnTimer = 0;
      this._nextSpawnDelay = _randomSpawnDelay();
      this._trySpawn();
    }

    // Update all active powerups (bobbing, drop expiry)
    for (var i = this.activePowerups.length - 1; i >= 0; i--) {
      var p = this.activePowerups[i];
      if (!p.active) {
        // Powerup was destroyed (picked up or expired) — remove from tracking
        this.activePowerups.splice(i, 1);
      } else {
        p.updatePowerup(delta);
      }
    }
  };

  /**
   * Try to spawn a powerup on a random active platform.
   */
  PowerupSpawner.prototype._trySpawn = function () {
    // Cap world powerups
    if (this.activePowerups.length >= MAX_WORLD_POWERUPS) return;

    var platforms = AP.PlatformCollapse.getActivePlatforms(this.platformGroup);
    if (platforms.length === 0) return;

    // Pick a random platform
    var plat = platforms[Math.floor(Math.random() * platforms.length)];

    // Spawn above the platform center
    var spawnX = plat.x;
    var spawnY = plat.y - plat.displayHeight / 2 - AP.Powerup.RADIUS - 2;

    var typeKey = AP.Powerup.getRandomTypeKey();
    var powerup = new AP.Powerup(this.scene, spawnX, spawnY, typeKey);

    // Collide with platforms so the powerup lands
    this.scene.physics.add.collider(powerup, this.platformGroup);

    this.activePowerups.push(powerup);
  };

  /**
   * Add an externally-created powerup to the tracking list (e.g., dropped by player).
   * @param {AP.Powerup} powerup
   */
  PowerupSpawner.prototype.trackPowerup = function (powerup) {
    if (powerup && powerup.active) {
      // Collide with platforms
      this.scene.physics.add.collider(powerup, this.platformGroup);
      this.activePowerups.push(powerup);
    }
  };

  /**
   * Destroy all active powerups (cleanup on scene shutdown).
   */
  PowerupSpawner.prototype.destroyAll = function () {
    for (var i = 0; i < this.activePowerups.length; i++) {
      if (this.activePowerups[i].active) {
        this.activePowerups[i].destroy();
      }
    }
    this.activePowerups.length = 0;
  };

  // --- Helpers ---

  function _randomSpawnDelay() {
    return SPAWN_MIN_INTERVAL + Math.random() * (SPAWN_MAX_INTERVAL - SPAWN_MIN_INTERVAL);
  }

  // --- Expose on AP namespace ---
  AP.PowerupSpawner = PowerupSpawner;

})();
