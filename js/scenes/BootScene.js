(function () {
  'use strict';

  AP.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    create: function () {
      AP.SpriteFactory.createTextures(this);
      this.scene.start('MenuScene');
    }
  });
})();
