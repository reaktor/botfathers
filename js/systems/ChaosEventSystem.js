(function () {
  'use strict';

  // -----------------------------------------------------------
  // ChaosEventSystem — fires a random chaos event every ~20s
  // -----------------------------------------------------------
  // Events set flags / overlays so other systems (GravitySystem,
  // BlackHole) can read them in Phase 3 without tight coupling.
  // -----------------------------------------------------------

  var EVENT_INTERVAL = 20000;          // ms between events (~20s)
  var EVENT_INTERVAL_VARIANCE = 4000;  // +/- jitter so timing isn't predictable

  // Per-event durations (ms)
  var GRAVITY_SURGE_DURATION   = 4000;
  var BLACKOUT_DURATION        = 800;
  var EVENT_HORIZON_DURATION   = 2000;
  var VACUUM_VENT_DURATION     = 3000;

  var VACUUM_FORCE = 180; // px/s directional push

  // Announcement display time (ms)
  var ANNOUNCE_DURATION = 2000;

  // All event names — order matters only for the random picker
  var EVENT_NAMES = [
    'gravitySurge',
    'blackout',
    'meteorStrike',
    'eventHorizonFlash',
    'vacuumVent'
  ];

  // Human-readable labels shown on screen
  var EVENT_LABELS = {
    gravitySurge:      'GRAVITY SURGE',
    blackout:          'BLACKOUT',
    meteorStrike:      'METEOR STRIKE',
    eventHorizonFlash: 'EVENT HORIZON FLASH',
    vacuumVent:        'VACUUM VENT'
  };

  // -------------------------------------------------------
  // Constructor
  // -------------------------------------------------------
  function ChaosEventSystem(scene) {
    this.scene = scene;

    // Active-event timers: { eventName: endTime (scene time in ms) }
    this._activeEvents = {};

    // Next event fires at this scene-time
    this._nextEventTime = EVENT_INTERVAL + this._jitter();

    // Vacuum vent directional vector (unit-length cardinal)
    this._vacuumDir = { x: 0, y: 0 };

    // Blackout overlay (created lazily on first blackout)
    this._blackoutOverlay = null;

    // Announcement text object (reused)
    this._announceText = null;
    this._announceEndTime = 0;
  }

  // -------------------------------------------------------
  // Public API (instance methods)
  // -------------------------------------------------------

  /** Returns true while the named event is in effect. */
  ChaosEventSystem.prototype.isActive = function (eventName) {
    return !!this._activeEvents[eventName];
  };

  /** Returns the current vacuum vent direction vector (or {x:0,y:0}). */
  ChaosEventSystem.prototype.getVacuumDir = function () {
    if (this.isActive('vacuumVent')) {
      return { x: this._vacuumDir.x, y: this._vacuumDir.y };
    }
    return { x: 0, y: 0 };
  };

  /** Returns the vacuum force magnitude (px/s). */
  ChaosEventSystem.prototype.getVacuumForce = function () {
    return VACUUM_FORCE;
  };

  // -------------------------------------------------------
  // Per-frame update — called from GameScene.updateChaos()
  // -------------------------------------------------------
  ChaosEventSystem.prototype.update = function (time, delta) {
    this._delta = delta || 16;
    // --- Expire finished events ---
    var names = Object.keys(this._activeEvents);
    for (var i = 0; i < names.length; i++) {
      if (time >= this._activeEvents[names[i]]) {
        this._endEvent(names[i]);
      }
    }

    // --- Fire next event if it's time ---
    if (time >= this._nextEventTime) {
      this._fireRandomEvent(time);
      this._nextEventTime = time + EVENT_INTERVAL + this._jitter();
    }

    // --- Update ongoing effects ---
    this._updateVacuumVent();
    this._updateAnnouncement(time);
  };

  // -------------------------------------------------------
  // Random event picker
  // -------------------------------------------------------
  ChaosEventSystem.prototype._fireRandomEvent = function (time) {
    var idx = Math.floor(Math.random() * EVENT_NAMES.length);
    var name = EVENT_NAMES[idx];
    this._startEvent(name, time);
  };

  // -------------------------------------------------------
  // Start / end dispatchers
  // -------------------------------------------------------
  ChaosEventSystem.prototype._startEvent = function (name, time) {
    switch (name) {
      case 'gravitySurge':
        this._activeEvents[name] = time + GRAVITY_SURGE_DURATION;
        break;

      case 'blackout':
        this._activeEvents[name] = time + BLACKOUT_DURATION;
        this._showBlackout();
        break;

      case 'meteorStrike':
        this._doMeteorStrike();
        // Meteor Strike is instantaneous — no duration tracking needed
        break;

      case 'eventHorizonFlash':
        this._activeEvents[name] = time + EVENT_HORIZON_DURATION;
        break;

      case 'vacuumVent':
        this._activeEvents[name] = time + VACUUM_VENT_DURATION;
        this._startVacuumVent();
        break;
    }

    this._showAnnouncement(name, time);
  };

  ChaosEventSystem.prototype._endEvent = function (name) {
    delete this._activeEvents[name];

    switch (name) {
      case 'blackout':
        this._hideBlackout();
        break;
      case 'vacuumVent':
        this._stopVacuumVent();
        break;
      // gravitySurge and eventHorizonFlash just clear their flags —
      // other systems check isActive() each frame.
    }
  };

  // -------------------------------------------------------
  // Event implementations
  // -------------------------------------------------------

  // -- Blackout --
  ChaosEventSystem.prototype._showBlackout = function () {
    var scene = this.scene;
    var size = AP.gameSize;
    if (!this._blackoutOverlay) {
      this._blackoutOverlay = scene.add.rectangle(
        size / 2, size / 2,
        size, size,
        0x000000, 0.92
      );
      this._blackoutOverlay.setDepth(900); // above most things, below announcements
    }
    this._blackoutOverlay.setVisible(true);
  };

  ChaosEventSystem.prototype._hideBlackout = function () {
    if (this._blackoutOverlay) {
      this._blackoutOverlay.setVisible(false);
    }
  };

  // -- Meteor Strike --
  ChaosEventSystem.prototype._doMeteorStrike = function () {
    var scene = this.scene;

    // Use Coder A's getActivePlatforms helper if available,
    // otherwise fall back to scanning the platform group directly.
    var active;
    if (AP.PlatformCollapse && typeof AP.PlatformCollapse.getActivePlatforms === 'function') {
      active = AP.PlatformCollapse.getActivePlatforms(scene.platforms);
    } else {
      // Fallback: scan the group ourselves
      var children = scene.platforms.getChildren();
      active = [];
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c.active && c.visible && c.texture && c.texture.key === 'platform') {
          if (c._collapseState === 'stable') {
            active.push(c);
          }
        }
      }
    }

    if (active.length === 0) return; // nothing left to destroy

    var idx = Math.floor(Math.random() * active.length);
    var target = active[idx];

    // Use Coder A's PlatformCollapse.startCollapse(scene, plat) interface
    if (AP.PlatformCollapse && typeof AP.PlatformCollapse.startCollapse === 'function') {
      AP.PlatformCollapse.startCollapse(scene, target);
    }
  };

  // -- Vacuum Vent --
  ChaosEventSystem.prototype._startVacuumVent = function () {
    // Pick a random cardinal direction
    var dirs = [
      { x: 1,  y: 0 },   // right
      { x: -1, y: 0 },   // left
      { x: 0,  y: -1 },  // up
      { x: 0,  y: 1 }    // down
    ];
    var pick = dirs[Math.floor(Math.random() * dirs.length)];
    this._vacuumDir.x = pick.x;
    this._vacuumDir.y = pick.y;
  };

  ChaosEventSystem.prototype._stopVacuumVent = function () {
    this._vacuumDir.x = 0;
    this._vacuumDir.y = 0;
  };

  ChaosEventSystem.prototype._updateVacuumVent = function () {
    if (!this.isActive('vacuumVent')) return;

    var playerList = this._getPlayerList();
    for (var i = 0; i < playerList.length; i++) {
      var p = playerList[i];
      if (p && p.active && p.body) {
        // Apply as a per-frame velocity nudge (accumulates, feels like wind)
        var dt = this._delta / 1000;
        p.body.velocity.x += this._vacuumDir.x * VACUUM_FORCE * dt;
        p.body.velocity.y += this._vacuumDir.y * VACUUM_FORCE * dt;
      }
    }
  };

  /**
   * Returns an array of player sprites from the scene.
   * Handles the current single-player setup (this.player)
   * as well as the future multi-player array/group (this.players).
   */
  ChaosEventSystem.prototype._getPlayerList = function () {
    var scene = this.scene;

    // Multi-player group or array (Phase 2+)
    if (scene.players) {
      return scene.players.getChildren
        ? scene.players.getChildren()
        : scene.players;
    }

    // Single player fallback (Phase 1 scaffold)
    if (scene.player && scene.player.active) {
      return [scene.player];
    }

    return [];
  };

  // -------------------------------------------------------
  // Announcement text
  // -------------------------------------------------------
  ChaosEventSystem.prototype._showAnnouncement = function (eventName, time) {
    var scene = this.scene;
    var label = EVENT_LABELS[eventName] || eventName;
    var size = AP.gameSize;

    if (!this._announceText) {
      this._announceText = scene.add.text(
        size / 2,
        size * 0.3,
        '',
        {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#ff00ff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      );
      this._announceText.setOrigin(0.5);
      this._announceText.setDepth(1000); // above everything including blackout
    }

    this._announceText.setText(label);
    this._announceText.setVisible(true);
    this._announceText.setAlpha(1);
    this._announceEndTime = time + ANNOUNCE_DURATION;
  };

  ChaosEventSystem.prototype._updateAnnouncement = function (time) {
    if (!this._announceText || !this._announceText.visible) return;

    if (time >= this._announceEndTime) {
      this._announceText.setVisible(false);
      return;
    }

    // Fade out over the last 500ms
    var remaining = this._announceEndTime - time;
    if (remaining < 500) {
      this._announceText.setAlpha(remaining / 500);
    }
  };

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  ChaosEventSystem.prototype._jitter = function () {
    return (Math.random() - 0.5) * EVENT_INTERVAL_VARIANCE;
  };

  // -------------------------------------------------------
  // Expose on AP namespace
  // -------------------------------------------------------
  // Preserve any static helpers already placed on AP.ChaosEventSystem
  // by other files (e.g. Coder A's getActivePlatforms).
  var existing = AP.ChaosEventSystem || {};
  AP.ChaosEventSystem = ChaosEventSystem;

  // Copy static properties from the previous object onto the constructor
  var keys = Object.keys(existing);
  for (var k = 0; k < keys.length; k++) {
    if (!ChaosEventSystem[keys[k]]) {
      ChaosEventSystem[keys[k]] = existing[keys[k]];
    }
  }

})();
