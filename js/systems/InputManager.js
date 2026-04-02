(function () {
  'use strict';

  AP.InputManager = {
    create: function (scene) {
      var controls = {};

      // P1: A / D / W
      controls[0] = {
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        jump:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      };

      return controls;
    }
  };
})();
