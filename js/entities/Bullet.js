(function () {
  'use strict';

  // Bullet constants
  var BULLET_SPEED = 500;
  var BULLET_COOLDOWN = 500; // 0.5s in ms
  var BULLET_POOL_MAX = 50;
  var BULLET_WIDTH = 10;
  var BULLET_HEIGHT = 4;
  var BULLET_DAMAGE = 1;
  var BULLET_COLOR = 0xffff00; // neon yellow

  /**
   * Creates a bullet texture procedurally (neon laser bolt).
   */
  function createBulletTexture(scene) {
    if (scene.textures.exists('bullet')) return;

    var gfx = scene.add.graphics();
    // Glow halo
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillRoundedRect(0, 0, BULLET_WIDTH + 4, BULLET_HEIGHT + 4, 3);
    // Core
    gfx.fillStyle(BULLET_COLOR, 1);
    gfx.fillRoundedRect(2, 2, BULLET_WIDTH, BULLET_HEIGHT, 2);
    // Bright center
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillRoundedRect(3, 3, BULLET_WIDTH - 2, BULLET_HEIGHT - 2, 1);

    gfx.generateTexture('bullet', BULLET_WIDTH + 4, BULLET_HEIGHT + 4);
    gfx.destroy();
  }

  /**
   * Bullet class — extends Arcade.Sprite, used within an Arcade.Group pool.
   */
  AP.Bullet = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Bullet(scene, x, y) {
      Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'bullet');
      this.ownerIndex = -1;
      this.damage = BULLET_DAMAGE;
    },

    /**
     * Fire the bullet from (x, y) in the given direction.
     * @param {number} x - spawn x
     * @param {number} y - spawn y
     * @param {number} direction - 1 (right) or -1 (left)
     * @param {number} ownerIndex - playerIndex of the shooter (for self-hit prevention)
     */
    fire: function (x, y, direction, ownerIndex) {
      this.setActive(true);
      this.setVisible(true);
      this.body.enable = true;

      this.setPosition(x, y);
      this.ownerIndex = ownerIndex;
      this.damage = BULLET_DAMAGE;

      // Bullets are not affected by world gravity
      this.body.setAllowGravity(false);
      this.body.setVelocity(BULLET_SPEED * direction, 0);

      // Flip sprite to match direction
      this.setFlipX(direction === -1);
    },

    /**
     * Deactivate and return to pool.
     */
    recycle: function () {
      this.setActive(false);
      this.setVisible(false);
      this.body.enable = false;
      this.body.setVelocity(0, 0);
    }
  });

  /**
   * Creates and returns the bullet Arcade.Group pool for the scene.
   * Call this in GameScene.setupBullets().
   */
  AP.Bullet.createPool = function (scene) {
    createBulletTexture(scene);

    var pool = scene.physics.add.group({
      classType: AP.Bullet,
      maxSize: BULLET_POOL_MAX,
      runChildUpdate: false
    });

    return pool;
  };

  // Expose constants for external use
  AP.Bullet.SPEED = BULLET_SPEED;
  AP.Bullet.COOLDOWN = BULLET_COOLDOWN;
  AP.Bullet.POOL_MAX = BULLET_POOL_MAX;
  AP.Bullet.DAMAGE = BULLET_DAMAGE;
})();
