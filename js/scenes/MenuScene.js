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

      // --- Animated character sprite (raw DOM img over canvas) ---
      var spriteDisplaySize = AP.PLAYER_RENDER_SIZE * 5;
      var spriteY = titleY + titleLine1.height + titleLine2.height + tagline.height + spriteDisplaySize / 2 + 20;

      var canvas = this.game.canvas;
      var canvasRect = canvas.getBoundingClientRect();
      var scaleX = canvasRect.width / w;
      var scaleY = canvasRect.height / h;

      var img = document.createElement('img');
      img.src = (AP.BOTFATHER_DATA && AP.BOTFATHER_DATA.idle) || 'assets/botfather/character_idle.webp';
      var imgW = spriteDisplaySize * scaleX;
      var imgH = spriteDisplaySize * scaleY;
      img.className = 'ap-sprite-overlay';
      img.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;'
        + 'width:' + imgW + 'px;height:' + imgH + 'px;'
        + 'left:' + (canvasRect.left + (centerX - spriteDisplaySize / 2) * scaleX) + 'px;'
        + 'top:' + (canvasRect.top + (spriteY - spriteDisplaySize / 2) * scaleY) + 'px;';
      document.body.appendChild(img);
      // Store reference for cleanup AND keep closure ref
      this._heroImg = img;
      AP._menuHeroImg = img;

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
        { label: 'P1', keys: 'A/D/W + F', color: playerColors[0] },
        { label: 'P2', keys: 'Arrows + Space', color: playerColors[1] },
        { label: 'P3', keys: 'J/L/I + H', color: playerColors[2] },
        { label: 'P4', keys: 'Numpad 4/6/8 + 0', color: playerColors[3] }
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

      // --- HOW TO PLAY button ---
      var howBtn = this.add.text(centerX, h * 0.93, '[ H ] HOW TO PLAY', {
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(10, Math.floor(w / 48)) + 'px',
        color: DIM_CYAN,
        align: 'center'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      howBtn.on('pointerdown', this._showRulesModal, this);

      // --- Rules modal (hidden by default) ---
      this._rulesModal = null;

      // --- Input handling ---
      this._enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this._leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this._rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this._hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
      this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this._canInput = true;
    },

    _showRulesModal: function () {
      if (this._rulesModal) return;
      this._canInput = false;

      // Hide DOM hero overlay so it doesn't render on top of the modal
      var heroImg = AP._menuHeroImg || this._heroImg;
      if (heroImg) heroImg.style.display = 'none';

      var w = this.cameras.main.width;
      var h = this.cameras.main.height;
      var cx = w / 2;
      var cy = h / 2;
      var self = this;

      var container = this.add.container(0, 0).setDepth(200);
      this._rulesModal = container;

      // Dark overlay
      var overlay = this.add.rectangle(cx, cy, w, h, 0x000000, 0.85).setInteractive();
      overlay.on('pointerdown', function () { self._hideRulesModal(); });
      container.add(overlay);

      // Modal box
      var boxW = w * 0.75;
      var boxH = h * 0.7;
      var box = this.add.rectangle(cx, cy, boxW, boxH, 0x0a0a1a, 0.95);
      container.add(box);

      // Neon border
      var border = this.add.graphics();
      border.lineStyle(2, 0xff00ff, 0.8);
      border.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
      border.lineStyle(1, 0x00ffff, 0.4);
      border.strokeRect(cx - boxW / 2 + 3, cy - boxH / 2 + 3, boxW - 6, boxH - 6);
      container.add(border);

      var fs = Math.max(10, Math.floor(w / 46));
      var headerFs = Math.max(14, Math.floor(w / 34));
      var ty = cy - boxH / 2 + 30;

      var title = this.add.text(cx, ty, 'HOW TO PLAY', {
        fontFamily: FONT_FAMILY, fontSize: headerFs + 'px',
        color: NEON_MAGENTA, fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5);
      container.add(title);

      ty += headerFs + 20;

      var rules = [
        { head: 'OBJECTIVE', body: 'Last player standing wins. Survive the void.' },
        { head: 'BLACK HOLE', body: 'Center of the arena. Pulls everything in.\nContact = instant death. It grows over time.' },
        { head: 'PLATFORMS', body: 'They collapse! Outer ones go first (~20s in).\nThe black hole eats platforms it touches.' },
        { head: 'CHAOS EVENTS', body: 'Every ~20s a random event hits:\n- Gravity Surge: double pull for 4s\n- Blackout: lights out for 3s\n- Meteor Strike: destroys a platform\n- Event Horizon Flash: black hole doubles size\n- Vacuum Vent: wind pushes everyone' },
        { head: 'CONTROLS', body: 'P1: A/D/W + F     |  P2: Arrows + Space\nP3: J/L/I + H     |  P4: Numpad 4/6/8 + 0' }
      ];

      for (var ri = 0; ri < rules.length; ri++) {
        var r = rules[ri];
        var headText = this.add.text(cx - boxW / 2 + 24, ty, r.head, {
          fontFamily: FONT_FAMILY, fontSize: fs + 'px',
          color: NEON_CYAN, fontStyle: 'bold'
        });
        container.add(headText);
        ty += fs + 6;

        var bodyText = this.add.text(cx - boxW / 2 + 24, ty, r.body, {
          fontFamily: FONT_FAMILY, fontSize: (fs - 1) + 'px',
          color: '#aaaacc', lineSpacing: 4,
          wordWrap: { width: boxW - 48 }
        });
        container.add(bodyText);
        ty += bodyText.height + 14;
      }

      // Close hint
      var closeHint = this.add.text(cx, cy + boxH / 2 - 20, 'Press ESC or click outside to close', {
        fontFamily: FONT_FAMILY, fontSize: (fs - 2) + 'px',
        color: DIM_MAGENTA, align: 'center'
      }).setOrigin(0.5);
      container.add(closeHint);
    },

    _hideRulesModal: function () {
      if (!this._rulesModal) return;
      this._rulesModal.destroy();
      this._rulesModal = null;
      this._canInput = true;

      // Restore DOM hero overlay
      var heroImg = AP._menuHeroImg || this._heroImg;
      if (heroImg) heroImg.style.display = '';
    },

    update: function () {
      // Rules modal toggle
      if (Phaser.Input.Keyboard.JustDown(this._hKey) && !this._rulesModal) {
        this._showRulesModal();
        return;
      }
      if (Phaser.Input.Keyboard.JustDown(this._escKey) && this._rulesModal) {
        this._hideRulesModal();
        return;
      }
      if (this._rulesModal) return; // block input while modal open

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
        // Remove hero sprite immediately via global ref
        var heroImg = AP._menuHeroImg || this._heroImg;
        if (heroImg) {
          heroImg.style.display = 'none';
          if (heroImg.parentNode) heroImg.parentNode.removeChild(heroImg);
          AP._menuHeroImg = null;
        }
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
