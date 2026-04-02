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
     * eliminate() — kill this player with a death particle burst.
     * Spawns 20 small rectangles in the player's color that fly outward
     * and fade over ~0.6s, then cleans them up.
     * Also triggers camera shake via the scene.
     */
    eliminate: function () {
      if (!this.active) return;

      var px = this.x;
      var py = this.y;
      var color = AP.PLAYER_COLORS[this.playerIndex] || AP.PLAYER_COLORS[0];
      var scene = this.scene;

      // Deactivate the player
      this.setActive(false).setVisible(false);
      if (this.body) {
        this.body.setVelocity(0, 0);
        this.body.enable = false;
      }

      // Camera shake — brief 150ms, low intensity
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.shake(150, 0.008);
      }

      // Death SFX
      if (AP.AudioManager && AP.AudioManager.playDeath) {
        AP.AudioManager.playDeath();
      }

      // Spawn death particles — 20 small rectangles flying outward
      var particleCount = 20;
      var particles = [];

      for (var i = 0; i < particleCount; i++) {
        var size = 2 + Math.random() * 4;
        var gfx = scene.add.graphics();
        gfx.fillStyle(color, 1);
        gfx.fillRect(-size / 2, -size / 2, size, size);
        gfx.setPosition(px, py);
        gfx.setDepth(500);
        particles.push(gfx);

        // Random outward direction
        var angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.6;
        var speed = 80 + Math.random() * 120;
        var targetX = px + Math.cos(angle) * speed;
        var targetY = py + Math.sin(angle) * speed;
        var duration = 500 + Math.random() * 200;

        scene.tweens.add({
          targets: gfx,
          x: targetX,
          y: targetY,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: duration,
          ease: 'Power2',
          onComplete: function (tween, targets) {
            targets[0].destroy();
          }
        });
      }
    }
  });
})();
