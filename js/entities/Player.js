(function () {
  'use strict';

  var TEXTURE_MAP = {
    idle: 'botfather-idle',
    run: 'botfather-run',
    jump: 'botfather-jump',
    attack: 'botfather-attack',
    hurt: 'botfather-hurt',
    death: 'botfather-death'
  };

  AP.Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y, playerIndex) {
      var startTexture = AP.botfatherLoaded ? 'botfather-idle' : 'player-fallback';
      Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, startTexture);
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.playerIndex = playerIndex || 0;
      this.facing = 1; // 1 = right, -1 = left
      this.currentState = 'idle';

      // Scale to PLAYER_RENDER_SIZE — source size depends on texture
      var texSize = AP.botfatherLoaded ? 214 : AP.PLAYER_RENDER_SIZE;
      var scale = AP.PLAYER_RENDER_SIZE / texSize;
      this.setScale(scale);

      // Physics hitbox — smaller than visual
      this.body.setSize(AP.PLAYER_HITBOX_W / scale, AP.PLAYER_HITBOX_H / scale);
      this.body.setOffset(
        (texSize - AP.PLAYER_HITBOX_W / scale) / 2,
        (texSize - AP.PLAYER_HITBOX_H / scale)
      );

      this.body.setCollideWorldBounds(false);

      // Apply player color tint
      var color = AP.PLAYER_COLORS[this.playerIndex] || AP.PLAYER_COLORS[0];
      this.setTint(color);

      // Combat state
      this.hp = 3;
      this.alive = true;
      this._lastFireTime = 0;
    },

    handleInput: function (keys, delta, holes, gameSize, boundaryThickness) {
      var moving = false;

      if (keys.left.isDown) {
        this.body.setVelocityX(-AP.PLAYER_SPEED);
        this.facing = -1;
        moving = true;
      } else if (keys.right.isDown) {
        this.body.setVelocityX(AP.PLAYER_SPEED);
        this.facing = 1;
        moving = true;
      } else {
        // Apply drag instead of hard reset so gravity pull accumulates when idle
        this.body.velocity.x *= 0.85;
      }

      if (keys.jump.isDown && this.body.blocked.down) {
        this.body.setVelocityY(AP.JUMP_VELOCITY);
        // Trigger jump SFX
        if (AP.AudioManager && AP.AudioManager.playJump) {
          AP.AudioManager.playJump();
        }
      }

      // Flip sprite based on facing direction (character faces right by default)
      this.setFlipX(this.facing === -1);

      // Update visual state
      this._updateState(moving);

      // Horizontal wrapping
      if (this.x < -this.displayWidth / 2) {
        this.x = gameSize + this.displayWidth / 2;
      } else if (this.x > gameSize + this.displayWidth / 2) {
        this.x = -this.displayWidth / 2;
      }

      this._checkVerticalWrap(holes, gameSize, boundaryThickness);
    },

    _updateState: function (moving) {
      var newState;

      if (!this.body.blocked.down) {
        newState = 'jump';
      } else if (moving) {
        newState = 'run';
      } else {
        newState = 'idle';
      }

      if (newState !== this.currentState) {
        this.currentState = newState;
        if (AP.botfatherLoaded && TEXTURE_MAP[newState]) {
          this.setTexture(TEXTURE_MAP[newState]);
        }
      }
    },

    _checkVerticalWrap: function (holes, gameSize, boundaryThickness) {
      var playerCenterX = this.x;
      var inHole = false;

      for (var i = 0; i < holes.length; i++) {
        var holeLeft = holes[i].x * gameSize;
        var holeRight = (holes[i].x + holes[i].width) * gameSize;
        if (playerCenterX >= holeLeft && playerCenterX <= holeRight) {
          inHole = true;
          break;
        }
      }

      if (!inHole) return;

      if (this.y > gameSize + this.displayHeight / 2) {
        this.y = boundaryThickness;
        this.body.setVelocityY(0);
      }
      else if (this.y < -this.displayHeight / 2) {
        this.y = gameSize - boundaryThickness;
        this.body.setVelocityY(0);
      }
    },

    /**
     * Fire a bullet from this player into the bullet pool.
     * Respects cooldown (0.5s). Bullet spawns offset in facing direction.
     * @param {Phaser.Physics.Arcade.Group} bulletGroup - the bullet pool
     */
    shoot: function (bulletGroup) {
      if (!this.alive || !this.active) return;

      var now = this.scene.time.now;
      if (now - this._lastFireTime < AP.Bullet.COOLDOWN) return;

      var bullet = bulletGroup.get();
      if (!bullet) return; // pool exhausted

      this._lastFireTime = now;

      // Spawn bullet slightly in front of the player
      var offsetX = this.facing * (AP.PLAYER_RENDER_SIZE * 0.6);
      bullet.fire(this.x + offsetX, this.y, this.facing, this.playerIndex);
    },

    /**
     * Deal damage to this player. Triggers eliminate() at 0 HP.
     * @param {number} amount - damage to deal
     */
    takeDamage: function (amount) {
      if (!this.alive) return;

      this.hp -= amount;

      // Brief flash to indicate hit
      this.setAlpha(0.3);
      var self = this;
      this.scene.time.delayedCall(150, function () {
        if (self.active) self.setAlpha(1);
      });

      if (this.hp <= 0) {
        this.hp = 0;
        this.eliminate();
      }
    },

    /**
     * Eliminate this player from the match (death).
     * Disables physics body, hides sprite, marks as not alive.
     */
    eliminate: function () {
      if (!this.alive) return;
      this.alive = false;

      // Visual death feedback — brief flash then hide
      this.setTint(0xff0000);
      var self = this;
      this.scene.time.delayedCall(200, function () {
        self.setActive(false);
        self.setVisible(false);
        if (self.body) {
          self.body.enable = false;
        }
      });
    }
  });
})();
