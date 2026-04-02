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

  // Animated WebP data URI map (state → base64 src)
  var ANIM_DATA = AP.BOTFATHER_DATA || {};
  var ANIM_MAP = {
    idle: ANIM_DATA.idle,
    run: ANIM_DATA.run,
    jump: ANIM_DATA.jump,
    attack: ANIM_DATA.attack,
    hurt: ANIM_DATA.hurt,
    death: ANIM_DATA.death
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

      // --- Animated WebP overlay (DOM img synced to sprite position) ---
      this._animImg = null;
      this._animState = '';
      if (ANIM_MAP.idle) {
        // Convert hex color to CSS filter hue-rotate + saturate
        var hexColor = AP.PLAYER_COLORS[this.playerIndex] || AP.PLAYER_COLORS[0];
        var r = (hexColor >> 16) & 0xff;
        var g = (hexColor >> 8) & 0xff;
        var b = hexColor & 0xff;
        // Build a CSS tint overlay using a wrapper div
        var wrapper = document.createElement('div');
        wrapper.className = 'ap-sprite-overlay';
        wrapper.style.cssText = 'position:absolute;pointer-events:none;';
        var img = document.createElement('img');
        img.src = ANIM_MAP.idle;
        img.style.cssText = 'width:100%;height:100%;image-rendering:pixelated;display:block;';
        // Color overlay canvas for tinting
        var tintCanvas = document.createElement('canvas');
        tintCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:multiply;';
        wrapper.appendChild(img);
        wrapper.appendChild(tintCanvas);
        document.body.appendChild(wrapper);
        this._animImg = img;
        this._animWrapper = wrapper;
        this._animTintCanvas = tintCanvas;
        this._animTintColor = 'rgb(' + r + ',' + g + ',' + b + ')';
        this._animState = 'idle';
        this.setAlpha(0);
      }
    },

    /** Sync DOM img position/size/flip to match the Phaser sprite each frame. */
    syncAnimImg: function () {
      var wrap = this._animWrapper;
      if (!wrap) return;

      if (!this.active || !this.visible) {
        wrap.style.display = 'none';
        return;
      }
      wrap.style.display = '';

      var canvas = this.scene.game.canvas;
      var rect = canvas.getBoundingClientRect();
      var gameW = this.scene.cameras.main.width;
      var gameH = this.scene.cameras.main.height;
      var sx = rect.width / gameW;
      var sy = rect.height / gameH;

      var dispW = this.displayWidth * sx;
      var dispH = this.displayHeight * sy;
      var screenX = rect.left + (this.x - this.displayWidth / 2) * sx;
      var screenY = rect.top + (this.y - this.displayHeight / 2) * sy;

      wrap.style.width = dispW + 'px';
      wrap.style.height = dispH + 'px';
      wrap.style.left = screenX + 'px';
      wrap.style.top = screenY + 'px';
      wrap.style.transform = this.facing === -1 ? 'scaleX(-1)' : '';

      // Draw tint overlay on the canvas
      var tc = this._animTintCanvas;
      if (tc && (tc.width !== Math.round(dispW) || tc.height !== Math.round(dispH))) {
        tc.width = Math.round(dispW);
        tc.height = Math.round(dispH);
        var ctx = tc.getContext('2d');
        ctx.fillStyle = this._animTintColor;
        ctx.fillRect(0, 0, tc.width, tc.height);
      }

      // Switch animated WebP source on state change
      var src = ANIM_MAP[this.currentState];
      if (src && this._animState !== this.currentState) {
        this._animState = this.currentState;
        this._animImg.src = src;
      }
    },

    /** Remove DOM elements on destroy. */
    removeAnimImg: function () {
      if (this._animWrapper && this._animWrapper.parentNode) {
        this._animWrapper.parentNode.removeChild(this._animWrapper);
      }
      this._animWrapper = null;
      this._animImg = null;
      this._animTintCanvas = null;
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
      this.removeAnimImg();
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
