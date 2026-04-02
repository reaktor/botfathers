(function () {
  'use strict';

  // Neon colors per player index (0-based): cyan, magenta, green, orange
  var PLAYER_COLORS = ['#00ffff', '#ff00ff', '#00ff66', '#ff8800'];
  var PLAYER_COLOR_INTS = [0x00ffff, 0xff00ff, 0x00ff66, 0xff8800];

  AP.GameOverScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameOverScene() {
      Phaser.Scene.call(this, { key: 'GameOverScene' });
    },

    init: function (data) {
      this.winner = (data && typeof data.winner === 'number') ? data.winner : 0;
      this.playerCount = (data && data.playerCount) || 4;
    },

    create: function () {
      var size = AP.gameSize;
      var cx = size / 2;
      var cy = size / 2;
      var winnerIndex = this.winner;
      var neonColor = PLAYER_COLORS[winnerIndex] || PLAYER_COLORS[0];
      var neonInt = PLAYER_COLOR_INTS[winnerIndex] || PLAYER_COLOR_INTS[0];

      // --- Dark cyberpunk background ---
      this.cameras.main.setBackgroundColor('#0a0a1a');

      // Subtle scanline overlay
      var gfx = this.add.graphics();
      gfx.setDepth(0);
      for (var i = 0; i < size; i += 4) {
        gfx.fillStyle(0x000000, 0.15);
        gfx.fillRect(0, i, size, 2);
      }

      // --- Neon glow line at top ---
      var topLine = this.add.graphics();
      topLine.fillStyle(neonInt, 0.8);
      topLine.fillRect(size * 0.1, size * 0.15, size * 0.8, 3);
      topLine.setDepth(1);

      // --- "PLAYER N WINS" text ---
      var playerNum = winnerIndex + 1;
      var winText = this.add.text(cx, cy - size * 0.12, 'PLAYER ' + playerNum + ' WINS', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: Math.floor(size * 0.07) + 'px',
        color: neonColor,
        fontStyle: 'bold',
        align: 'center'
      });
      winText.setOrigin(0.5);
      winText.setDepth(10);

      // Fade in winner text then gentle pulse
      winText.setAlpha(0);
      this.tweens.add({
        targets: winText,
        alpha: 0.5,
        duration: 1500,
        ease: 'Sine.easeOut',
        onComplete: function () {
          winText.scene.tweens.add({
            targets: winText,
            alpha: { from: 0.5, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });

      // --- Neon glow line below winner text ---
      var midLine = this.add.graphics();
      midLine.fillStyle(neonInt, 0.5);
      midLine.fillRect(size * 0.2, cy - size * 0.04, size * 0.6, 2);
      midLine.setDepth(1);

      // --- "PRESS ENTER TO RESTART" prompt ---
      var restartText = this.add.text(cx, cy + size * 0.12, 'PRESS ENTER TO RESTART', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: Math.floor(size * 0.035) + 'px',
        color: '#888899',
        align: 'center'
      });
      restartText.setOrigin(0.5);
      restartText.setDepth(10);

      // Gentle blinking prompt
      this.tweens.add({
        targets: restartText,
        alpha: { from: 1, to: 0.25 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // --- Neon glow line at bottom ---
      var botLine = this.add.graphics();
      botLine.fillStyle(neonInt, 0.8);
      botLine.fillRect(size * 0.1, size * 0.85, size * 0.8, 3);
      botLine.setDepth(1);

      // --- Input: ENTER to restart ---
      var enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      var self = this;
      enterKey.once('down', function () {
        self.scene.start('GameScene', { playerCount: self.playerCount });
      });
    }
  });
})();
