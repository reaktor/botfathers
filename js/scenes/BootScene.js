(function () {
  'use strict';

  var BOTFATHER_ASSETS = [
    { key: 'botfather-idle',   src: 'assets/botfather/character_idle.webp' },
    { key: 'botfather-run',    src: 'assets/botfather/character_front_run_run.webp' },
    { key: 'botfather-jump',   src: 'assets/botfather/character_jump.webp' },
    { key: 'botfather-attack', src: 'assets/botfather/character_attack.webp' },
    { key: 'botfather-hurt',   src: 'assets/botfather/character_hurt.webp' },
    { key: 'botfather-death',  src: 'assets/botfather/character_death.webp' }
  ];

  /**
   * Load images via DOM <img> elements (works with file:// protocol)
   * then add them to Phaser's texture manager.
   */
  function loadImagesViaDom(scene, assets, callback) {
    var loaded = 0;
    var total = assets.length;
    var success = false;

    function onLoad(asset, img) {
      // Draw to canvas to strip cross-origin taint (required for WebGL on file://)
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      scene.textures.addCanvas(asset.key, canvas);
      loaded++;
      if (loaded === total) {
        success = true;
        callback(true);
      }
    }

    function onError() {
      loaded++;
      if (loaded === total) {
        callback(success);
      }
    }

    for (var i = 0; i < assets.length; i++) {
      var img = new Image();
      img.onload = (function (asset, imgRef) {
        return function () { onLoad(asset, imgRef); };
      })(assets[i], img);
      img.onerror = onError;
      img.src = assets[i].src;
    }
  }

  AP.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    create: function () {
      var scene = this;

      loadImagesViaDom(scene, BOTFATHER_ASSETS, function (allLoaded) {
        AP.botfatherLoaded = allLoaded;

        // Generate procedural textures (arena, fallback player)
        AP.SpriteFactory.createTextures(scene);

        scene.scene.start('GameScene');
      });
    }
  });
})();
