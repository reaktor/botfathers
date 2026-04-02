(function () {
  'use strict';

  AP.SpriteFactory = {
    createTextures: function (scene) {
      var pg = scene.add.graphics();
      pg.fillStyle(0x00ffcc, 1);
      pg.fillRect(0, 0, AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      pg.generateTexture('player', AP.PLAYER_SIZE, AP.PLAYER_SIZE);
      pg.destroy();

      var plat = scene.add.graphics();
      plat.fillStyle(0x666688, 1);
      plat.fillRect(0, 0, 1, 1);
      plat.generateTexture('platform', 1, 1);
      plat.destroy();

      var seg = scene.add.graphics();
      seg.fillStyle(0x333355, 1);
      seg.fillRect(0, 0, 1, 1);
      seg.generateTexture('boundary', 1, 1);
      seg.destroy();
    }
  };
})();
