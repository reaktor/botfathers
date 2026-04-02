(function () {
  'use strict';

  // Gravity constants
  var DEFAULT_PULL_STRENGTH = 800000; // base pull strength for inverse-square calc
  var MIN_DISTANCE = 30;              // clamp min distance to avoid physics explosions
  var MAX_FORCE = 2000;               // cap force magnitude per frame

  /**
   * GravitySystem — applies inverse-square gravitational pull toward the black hole
   * on all registered physics bodies each frame.
   *
   * Interface:
   *   AP.GravitySystem.addBody(physicsBody)
   *   AP.GravitySystem.removeBody(physicsBody)
   *   AP.GravitySystem.getBlackHole() -> { x, y, radius, pullStrength }
   */

  var bodies = [];

  var GravitySystem = {
    /**
     * Register a physics body (Arcade.Sprite or similar) for gravity pull.
     */
    addBody: function (physicsBody) {
      if (bodies.indexOf(physicsBody) === -1) {
        bodies.push(physicsBody);
      }
    },

    /**
     * Unregister a physics body so it no longer receives gravity pull.
     */
    removeBody: function (physicsBody) {
      var idx = bodies.indexOf(physicsBody);
      if (idx !== -1) {
        bodies.splice(idx, 1);
      }
    },

    /**
     * Returns current black hole state for external queries.
     * Returns null if no black hole instance exists yet.
     */
    getBlackHole: function () {
      var bh = AP.blackHoleInstance;
      if (!bh) return null;
      return {
        x: bh.x,
        y: bh.y,
        radius: bh.radius,
        pullStrength: bh.pullStrength
      };
    },

    /**
     * Apply gravitational pull toward the black hole on all registered bodies.
     * @param {number} delta - frame delta in ms (from Phaser update)
     */
    update: function (delta) {
      var bh = AP.blackHoleInstance;
      if (!bh) return;

      var bhX = bh.x;
      var bhY = bh.y;
      var pullStrength = bh.pullStrength;

      // Check for chaos event gravity surge (doubles pull)
      if (AP.ChaosEventSystem && AP.ChaosEventSystem.isActive && AP.ChaosEventSystem.isActive('gravitySurge')) {
        pullStrength *= 2;
      }

      var dt = delta / 1000; // convert ms to seconds

      for (var i = bodies.length - 1; i >= 0; i--) {
        var body = bodies[i];

        // Skip inactive or destroyed bodies
        if (!body || !body.body || !body.active) {
          bodies.splice(i, 1);
          continue;
        }

        var dx = bhX - body.x;
        var dy = bhY - body.y;
        var distSq = dx * dx + dy * dy;
        var dist = Math.sqrt(distSq);

        // Clamp minimum distance to prevent extreme forces
        if (dist < MIN_DISTANCE) {
          dist = MIN_DISTANCE;
          distSq = dist * dist;
        }

        // Inverse-square gravity: force = pullStrength / distance^2
        var force = pullStrength / distSq;

        // Cap force to prevent insane velocities
        if (force > MAX_FORCE) {
          force = MAX_FORCE;
        }

        // Normalize direction and apply as velocity delta
        var nx = dx / dist;
        var ny = dy / dist;

        body.body.velocity.x += nx * force * dt;
        body.body.velocity.y += ny * force * dt;
      }
    },

    /**
     * Clear all registered bodies (useful for scene restart).
     */
    reset: function () {
      bodies = [];
    }
  };

  AP.GravitySystem = GravitySystem;
})();
