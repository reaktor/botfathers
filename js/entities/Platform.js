(function () {
  'use strict';

  // ---- Platform Collapse System ----
  // Extends the existing static platform group members with collapse mechanics.
  // Does NOT modify how platforms are created in GameScene — only adds collapse
  // behaviour that is called from GameScene.updatePlatforms(delta).

  // Collapse timing constants
  var COLLAPSE_WARNING_DURATION = 2000;  // 2 seconds of warning flash before collapse
  var COLLAPSE_FLASH_INTERVAL = 150;     // flash toggle interval in ms during warning
  var FIRST_COLLAPSE_DELAY = 20000;      // ~20 seconds into match before first collapse
  var COLLAPSE_STAGGER_INTERVAL = 8000;  // seconds between successive collapses

  // Priority tiers — lower number = collapses sooner (outer/less important first)
  // Maps AP.PLATFORMS index to collapse priority tier.
  // Outer platforms (corners, edges) are tier 1, mid platforms tier 2, central tier 3.
  var COLLAPSE_PRIORITY = [
    1,  // 0: bottom-left        (outer)
    1,  // 1: bottom-right       (outer)
    2,  // 2: center-low         (mid)
    2,  // 3: mid-left           (mid)
    2,  // 4: mid-right          (mid)
    3,  // 5: center-mid         (central)
    1,  // 6: upper-left         (outer)
    1,  // 7: upper-right        (outer)
    3,  // 8: top-center         (central)
  ];

  /**
   * Initialise collapse state on a platform sprite.
   * Called once per platform after the static group is built in GameScene.
   * @param {Phaser.Physics.Arcade.Sprite} plat - The platform sprite
   * @param {number} index - Index into AP.PLATFORMS (used for priority lookup)
   */
  function initCollapseState(plat, index) {
    plat._collapseState = 'stable';        // stable | warning | collapsed
    plat._collapseTimer = 0;               // accumulator for warning phase
    plat._flashTimer = 0;                   // accumulator for flash toggle
    plat._collapseIndex = index;
    plat._collapsePriority = (index < COLLAPSE_PRIORITY.length)
      ? COLLAPSE_PRIORITY[index]
      : 2; // default mid-tier for any extra platforms
    plat._originalAlpha = plat.alpha;
  }

  /**
   * Begin the 2-second warning flash on a platform.
   * Safe to call multiple times — only triggers if the platform is still stable.
   * @param {Phaser.Scene} scene - The current Phaser scene (for tweens)
   * @param {Phaser.Physics.Arcade.Sprite} plat - The platform sprite
   */
  function startCollapse(scene, plat) {
    if (!plat || plat._collapseState !== 'stable') return;
    plat._collapseState = 'warning';
    plat._collapseTimer = 0;
    plat._flashTimer = 0;

    // Tint the platform red during warning
    plat.setTint(0xff4444);
  }

  /**
   * Instantly collapse a platform — disable physics body and hide sprite.
   * @param {Phaser.Physics.Arcade.Sprite} plat - The platform sprite
   */
  function collapse(plat) {
    if (!plat || plat._collapseState === 'collapsed') return;
    plat._collapseState = 'collapsed';
    plat.body.enable = false;
    plat.setVisible(false);
    plat.setActive(false);
    plat.clearTint();
  }

  /**
   * Returns an array of platform sprites that have NOT collapsed.
   * @param {Phaser.Physics.Arcade.StaticGroup} platformGroup
   * @returns {Phaser.Physics.Arcade.Sprite[]}
   */
  function getActivePlatforms(platformGroup) {
    var active = [];
    var children = platformGroup.getChildren();
    for (var i = 0; i < children.length; i++) {
      // Only include platforms that have collapse state initialised and are not collapsed.
      // Boundary segments do not have _collapseState, so they are excluded.
      if (children[i]._collapseState && children[i]._collapseState !== 'collapsed') {
        active.push(children[i]);
      }
    }
    return active;
  }

  // ---- Expose on AP namespace ----
  AP.PlatformCollapse = {
    COLLAPSE_WARNING_DURATION: COLLAPSE_WARNING_DURATION,
    COLLAPSE_FLASH_INTERVAL: COLLAPSE_FLASH_INTERVAL,
    FIRST_COLLAPSE_DELAY: FIRST_COLLAPSE_DELAY,
    COLLAPSE_STAGGER_INTERVAL: COLLAPSE_STAGGER_INTERVAL,
    initCollapseState: initCollapseState,
    startCollapse: startCollapse,
    collapse: collapse,
    getActivePlatforms: getActivePlatforms
  };

  // Also expose getActivePlatforms on ChaosEventSystem namespace so Coder B can call it
  AP.ChaosEventSystem = AP.ChaosEventSystem || {};
  AP.ChaosEventSystem.getActivePlatforms = null; // will be bound in GameScene after platforms are built

})();
