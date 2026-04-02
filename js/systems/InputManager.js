(function () {
  'use strict';

  AP.InputManager = {
    create: function (scene) {
      var K = Phaser.Input.Keyboard.KeyCodes;
      var controls = {};

      // P1: A / D / W / F
      controls[0] = {
        left:  scene.input.keyboard.addKey(K.A),
        right: scene.input.keyboard.addKey(K.D),
        jump:  scene.input.keyboard.addKey(K.W),
        shoot: scene.input.keyboard.addKey(K.F)
      };

      // P2: Arrows / Space
      controls[1] = {
        left:  scene.input.keyboard.addKey(K.LEFT),
        right: scene.input.keyboard.addKey(K.RIGHT),
        jump:  scene.input.keyboard.addKey(K.UP),
        shoot: scene.input.keyboard.addKey(K.SPACE)
      };

      // P3: J / L / I / H
      controls[2] = {
        left:  scene.input.keyboard.addKey(K.J),
        right: scene.input.keyboard.addKey(K.L),
        jump:  scene.input.keyboard.addKey(K.I),
        shoot: scene.input.keyboard.addKey(K.H)
      };

      // P4: Numpad 4 / 6 / 8 / 0
      controls[3] = {
        left:  scene.input.keyboard.addKey(K.NUMPAD_FOUR),
        right: scene.input.keyboard.addKey(K.NUMPAD_SIX),
        jump:  scene.input.keyboard.addKey(K.NUMPAD_EIGHT),
        shoot: scene.input.keyboard.addKey(K.NUMPAD_ZERO)
      };

      // P2: Arrows / Space (shoot)
      controls[1] = {
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        jump:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        shoot: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      };

      // P3: I / J / K / L / H (shoot)
      controls[2] = {
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
        jump:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
        shoot: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H)
      };

      // P4: Numpad 4 / 6 / 8 / 0 (shoot)
      controls[3] = {
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX),
        jump:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT),
        shoot: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO)
      };

      return controls;
    }
  };
})();
