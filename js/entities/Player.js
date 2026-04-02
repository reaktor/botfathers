(function () {
  'use strict';

  AP.Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y) {
      Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'player');
      scene.add.existing(this);
      scene.physics.add.existing(this);

      this.body.setCollideWorldBounds(false);
      this.body.setSize(AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      this.facing = 1; // 1 = right, -1 = left
    },

    handleInput: function (keys, delta, holes, gameSize, boundaryThickness) {
      if (keys.left.isDown) {
        this.body.setVelocityX(-AP.PLAYER_SPEED);
        this.facing = -1;
      } else if (keys.right.isDown) {
        this.body.setVelocityX(AP.PLAYER_SPEED);
        this.facing = 1;
      } else {
        this.body.setVelocityX(0);
      }

      if (keys.jump.isDown && this.body.blocked.down) {
        this.body.setVelocityY(AP.JUMP_VELOCITY);
      }

      if (this.x < -this.width / 2) {
        this.x = gameSize + this.width / 2;
      } else if (this.x > gameSize + this.width / 2) {
        this.x = -this.width / 2;
      }

      this._checkVerticalWrap(holes, gameSize, boundaryThickness);
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

      if (this.y > gameSize + this.height / 2) {
        this.y = -this.height / 2;
      }
      else if (this.y < -this.height / 2) {
        this.y = gameSize + this.height / 2;
      }
    }
  });
})();
