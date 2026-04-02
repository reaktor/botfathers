(function () {
  'use strict';

  var NEON_CYAN = '#00ffff';
  var NEON_MAGENTA = '#ff00ff';
  var DARK_BG = '#0a0a1a';
  var DIM_CYAN = '#007777';
  var DIM_MAGENTA = '#770077';
  var FONT_FAMILY = 'Courier New, Courier, monospace';

  AP.MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function MenuScene() {
      Phaser.Scene.call(this, { key: 'MenuScene' });
    },

    create: function () {
      var w = this.cameras.main.width;
      var h = this.cameras.main.height;
      var centerX = w / 2;

      // Dark background
      this.cameras.main.setBackgroundColor(DARK_BG);

      // --- Scanline overlay for cyberpunk effect ---
      var scanlineGfx = this.add.graphics();
      scanlineGfx.setDepth(100);
      scanlineGfx.setAlpha(0.04);
      for (var sy = 0; sy < h; sy += 4) {
        scanlineGfx.fillStyle(0x000000, 1);
        scanlineGfx.fillRect(0, sy, w, 2);
      }

      // --- Title (rebranded Phase 2.75 Agent B) ---
      var titleY = h * 0.06;

      // Random holy-space taglines
      var taglines = [
        'In space, no one can hear you confess',
        'Forgive me Father, for I have grav-sinned',
        'Holy orders from the mothership',
        'Bless this mess... of a space station',
        'Thou shalt not covet thy neighbor\'s platform',
        'The sermon will be brief. The void will not.',
        'Ashes to ashes, dust to stardust',
        'Our Father, who art in zero-G',
        'First rule of Space Church: float or be floated',
        'Delivering divine judgement at terminal velocity'
      ];
      var chosenTagline = 'In space, no one can hear you confess';

      var titleLine1 = this.add.text(centerX, titleY, 'THE BOTFATHERS', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(24, Math.floor(w / 12)) + 'px',
        color: NEON_MAGENTA,
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      var titleLine2 = this.add.text(centerX, titleY + titleLine1.height + 6, 'GRAVITY WELL', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(12, Math.floor(w / 30)) + 'px',
        color: NEON_CYAN,
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      var tagline = this.add.text(centerX, titleY + titleLine1.height + titleLine2.height + 14, '"' + chosenTagline + '"', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(10, Math.floor(w / 44)) + 'px',
        color: '#888899',
        fontStyle: 'italic',
        align: 'center'
      }).setOrigin(0.5);

      // Title glow pulse
      this.tweens.add({
        targets: titleLine1,
        alpha: { from: 1, to: 0.6 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: titleLine2,
        alpha: { from: 1, to: 0.6 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Subtle tagline pulse
      this.tweens.add({
        targets: tagline,
        alpha: { from: 0.7, to: 0.4 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // --- Single centered character sprite (original colors, no tint) ---
      var spriteTexture = AP.botfatherLoaded ? 'botfather-idle' : 'player-fallback';
      var spriteDisplaySize = AP.PLAYER_RENDER_SIZE * 3.5;
      var spriteScale = spriteDisplaySize / (AP.botfatherLoaded ? 214 : AP.PLAYER_RENDER_SIZE);
      var spriteY = titleY + titleLine1.height + titleLine2.height + tagline.height + spriteDisplaySize / 2 + 20;

      var heroSprite = this.add.image(centerX, spriteY, spriteTexture);
      heroSprite.setScale(spriteScale);
      heroSprite.setOrigin(0.5);
      // No tint — original sprite colors

      // Gentle floating bob
      this.tweens.add({
        targets: heroSprite,
        y: spriteY - 8,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // --- Decorative separator line ---
      var separatorY = spriteY + spriteDisplaySize / 2 + 12;
      var sepGfx = this.add.graphics();
      sepGfx.lineStyle(1, 0xff00ff, 0.5);
      sepGfx.lineBetween(w * 0.15, separatorY, w * 0.85, separatorY);

      // --- Controls display ---
      var controlsY = separatorY + 20;
      var controlsHeaderSize = Math.max(12, Math.floor(w / 36));
      var controlsTextSize = Math.max(10, Math.floor(w / 42));
      var lineHeight = controlsTextSize + 10;

      this.add.text(centerX, controlsY, '[ CONTROLS ]', {
        fontFamily: FONT_FAMILY,
        fontSize: controlsHeaderSize + 'px',
        color: NEON_CYAN,
        align: 'center'
      }).setOrigin(0.5);

      controlsY += controlsHeaderSize + 16;

      var playerColors = [NEON_CYAN, NEON_MAGENTA, '#00ff66', '#ff8800'];
      var controlSchemes = [
        { label: 'P1', keys: 'WASD + Space', color: playerColors[0] },
        { label: 'P2', keys: 'Arrows + Enter', color: playerColors[1] },
        { label: 'P3', keys: 'IJKL + H', color: playerColors[2] },
        { label: 'P4', keys: 'Numpad 8456 + 0', color: playerColors[3] }
      ];

      for (var i = 0; i < controlSchemes.length; i++) {
        var scheme = controlSchemes[i];

        // Player label
        this.add.text(centerX - w * 0.22, controlsY + i * lineHeight, scheme.label + ':', {
          fontFamily: FONT_FAMILY,
          fontSize: controlsTextSize + 'px',
          color: scheme.color,
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // Keys description
        this.add.text(centerX - w * 0.12, controlsY + i * lineHeight, scheme.keys + ' (shoot)', {
          fontFamily: FONT_FAMILY,
          fontSize: controlsTextSize + 'px',
          color: '#aaaacc'
        }).setOrigin(0, 0.5);
      }

      // --- Second separator ---
      var sep2Y = controlsY + controlSchemes.length * lineHeight + 16;
      var sep2Gfx = this.add.graphics();
      sep2Gfx.lineStyle(1, 0x00ffff, 0.3);
      sep2Gfx.lineBetween(w * 0.2, sep2Y, w * 0.8, sep2Y);

      // --- Player count selector ---
      var selectorY = sep2Y + 30;
      this.playerCount = 2;

      this.add.text(centerX, selectorY, '[ PLAYERS ]', {
        fontFamily: FONT_FAMILY,
        fontSize: controlsHeaderSize + 'px',
        color: NEON_MAGENTA,
        align: 'center'
      }).setOrigin(0.5);

      selectorY += controlsHeaderSize + 16;

      var arrowSize = Math.max(16, Math.floor(w / 24));

      this._leftArrow = this.add.text(centerX - w * 0.12, selectorY, '<', {
        fontFamily: FONT_FAMILY,
        fontSize: arrowSize + 'px',
        color: NEON_CYAN
      }).setOrigin(0.5);

      this._playerCountText = this.add.text(centerX, selectorY, '2', {
        fontFamily: FONT_FAMILY,
        fontSize: arrowSize + 'px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this._rightArrow = this.add.text(centerX + w * 0.12, selectorY, '>', {
        fontFamily: FONT_FAMILY,
        fontSize: arrowSize + 'px',
        color: NEON_CYAN
      }).setOrigin(0.5);

      // Hint text
      this.add.text(centerX, selectorY + arrowSize + 8, 'LEFT / RIGHT to change', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(9, Math.floor(w / 52)) + 'px',
        color: DIM_CYAN,
        align: 'center'
      }).setOrigin(0.5);

      // --- Start prompt ---
      var startY = h * 0.88;

      this._startPrompt = this.add.text(centerX, startY, 'PRESS ENTER TO START', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(14, Math.floor(w / 28)) + 'px',
        color: NEON_MAGENTA,
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      // Pulsing / blinking start prompt
      this.tweens.add({
        targets: this._startPrompt,
        alpha: { from: 1, to: 0.15 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // --- Bottom credit line ---
      this.add.text(centerX, h * 0.96, 'BOTFATHERS // HACKATHON 2026', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(8, Math.floor(w / 60)) + 'px',
        color: DIM_MAGENTA,
        align: 'center'
      }).setOrigin(0.5);

      // --- Input handling ---
      this._enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this._leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this._rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

      this._canInput = true;
    },

    update: function () {
      // Player count selection with left/right arrows
      if (Phaser.Input.Keyboard.JustDown(this._leftKey)) {
        this.playerCount = Math.max(2, this.playerCount - 1);
        this._playerCountText.setText('' + this.playerCount);
        this._flashArrow(this._leftArrow);
      }

      if (Phaser.Input.Keyboard.JustDown(this._rightKey)) {
        this.playerCount = Math.min(4, this.playerCount + 1);
        this._playerCountText.setText('' + this.playerCount);
        this._flashArrow(this._rightArrow);
      }

      // Start game on Enter
      if (Phaser.Input.Keyboard.JustDown(this._enterKey) && this._canInput) {
        this._canInput = false;
        this.scene.start('GameScene', { playerCount: this.playerCount });
      }
    },

    _flashArrow: function (arrow) {
      this.tweens.add({
        targets: arrow,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  });
})();
