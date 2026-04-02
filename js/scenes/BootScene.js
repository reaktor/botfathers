(function () {
  'use strict';

  var BOTFATHER_KEYS = ['idle', 'run', 'jump', 'attack', 'hurt', 'death'];

  /**
   * Load images from base64 data URIs (works with file:// and http://).
   * Data lives in AP.BOTFATHER_DATA, set by js/data/botfather-sprites.js.
   */
  function loadSpritesFromData(scene, callback) {
    var data = AP.BOTFATHER_DATA;
    if (!data) { callback(false); return; }

    var loaded = 0;
    var total = BOTFATHER_KEYS.length;

    for (var i = 0; i < total; i++) {
      var key = BOTFATHER_KEYS[i];
      var src = data[key];
      if (!src) { loaded++; continue; }

      var img = new Image();
      img.onload = (function (k, imgRef) {
        return function () {
          scene.textures.addImage('botfather-' + k, imgRef);
          loaded++;
          if (loaded === total) callback(true);
        };
      })(key, img);
      img.onerror = function () {
        loaded++;
        if (loaded === total) callback(false);
      };
      img.src = src;
    }
  }

  AP.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
      this.load.image('blackhole-sprite', 'assets/blackhole.png');
      // Load botfather character sprites from webp files
      this.load.image('char-idle', 'assets/botfather/character_idle.webp');
      this.load.image('char-run', 'assets/botfather/character_front_run_run.webp');
      this.load.image('char-jump', 'assets/botfather/character_jump.webp');
      this.load.image('char-attack', 'assets/botfather/character_attack.webp');
      this.load.image('char-hurt', 'assets/botfather/character_hurt.webp');
      this.load.image('char-death', 'assets/botfather/character_death.webp');
    },

    create: function () {
      var scene = this;

      loadSpritesFromData(scene, function (allLoaded) {
        AP.botfatherLoaded = allLoaded;

        // Generate procedural textures (arena, fallback player)
        AP.SpriteFactory.createTextures(scene);

        scene.scene.start('MenuScene');
      });
    }
  });
})();
