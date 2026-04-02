(function () {
  'use strict';

  AP.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
      // Botfather character sprites
      this.load.image('botfather-idle', 'assets/botfather/character_idle.webp');
      this.load.image('botfather-run', 'assets/botfather/character_front_run_run.webp');
      this.load.image('botfather-jump', 'assets/botfather/character_jump.webp');
      this.load.image('botfather-attack', 'assets/botfather/character_attack.webp');
      this.load.image('botfather-hurt', 'assets/botfather/character_hurt.webp');
      this.load.image('botfather-death', 'assets/botfather/character_death.webp');
    },

    create: function () {
      // Check if botfather assets loaded successfully
      AP.botfatherLoaded = this.textures.exists('botfather-idle');

      // Generate procedural textures (arena, fallback player)
      AP.SpriteFactory.createTextures(this);

      this.scene.start('GameScene');
    }
  });
})();
