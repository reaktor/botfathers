(function () {
  'use strict';

  var started = false;
  var muted = false;
  var masterVol = null;
  var jumpSynth = null;
  var moveSynth = null;
  var knockbackSynth = null;
  var deathSynth = null;
  var deathNoise = null;
  var deathOutput = null;
  var hitSynth = null;
  var _moveLastTime = 0;

  AP.AudioManager = {

    /**
     * Called on first user interaction. Starts Tone.js context,
     * background music, and ambient layer.
     */
    start: function () {
      if (started) return;
      if (typeof Tone === 'undefined') return; // CDN failed, run silently
      started = true;

      Tone.start().then(function () {
        // Master volume
        masterVol = new Tone.Volume(-8).toDestination();

        // Music bus — all background layers go through here so we can
        // lower music independently of SFX
        var musicBus = new Tone.Volume(-12).connect(masterVol);

        AP.AudioManager._initBackground(musicBus);
        AP.AudioManager._initAmbient(musicBus);
        AP.AudioManager._initJumpSFX(masterVol);
        AP.AudioManager._initMoveSFX(masterVol);
        AP.AudioManager._initKnockbackSFX(masterVol);
        AP.AudioManager._initDeathSFX(masterVol);
        AP.AudioManager._initHitSFX(masterVol);
        AP.AudioManager._initMuteKey();

        Tone.Transport.bpm.value = 90;
        Tone.Transport.start();
      });
    },

    /** Background synthwave loop — bass drone + arpeggio. */
    _initBackground: function (output) {
      // Dark bass drone
      var bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', frequency: 200, Q: 2 },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.5 }
      }).connect(new Tone.Volume(-20).connect(output));

      var bassNotes = ['C1', 'C1', 'Eb1', 'Eb1', 'Ab1', 'Ab1', 'Bb1', 'Bb1'];
      var bassIndex = 0;
      new Tone.Loop(function (time) {
        bassSynth.triggerAttackRelease(bassNotes[bassIndex % bassNotes.length], '2n', time);
        bassIndex++;
      }, '2n').start(0);

      // Arpeggiated synth melody
      var arpSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.3 }
      }).connect(new Tone.Volume(-26).connect(output));

      var arpNotes = ['C4', 'Eb4', 'G4', 'Bb4', 'C5', 'Bb4', 'G4', 'Eb4'];
      var arpIndex = 0;
      new Tone.Loop(function (time) {
        arpSynth.triggerAttackRelease(arpNotes[arpIndex % arpNotes.length], '16n', time);
        arpIndex++;
      }, '8n').start(0);
    },

    /** Low electrical hum via filtered noise. */
    _initAmbient: function (output) {
      var ambientNoise = new Tone.Noise('brown');
      var filter = new Tone.Filter(80, 'lowpass');
      var vol = new Tone.Volume(-30);
      ambientNoise.connect(filter);
      filter.connect(vol);
      vol.connect(output);
      ambientNoise.start();
    },

    /** Short synth blip for jump. */
    _initJumpSFX: function (output) {
      jumpSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
      }).connect(new Tone.Volume(-10).connect(output));
    },

    /** M key toggles mute. */
    _initMuteKey: function () {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'm' || e.key === 'M') {
          muted = !muted;
          if (masterVol) {
            masterVol.mute = muted;
          }
        }
      });
    },

    /** Soft footstep tick — rate-limited to every 150ms. */
    _initMoveSFX: function (output) {
      moveSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.01 }
      }).connect(new Tone.Volume(-22).connect(output));
    },

    /** Punchy thud for knockback hits. */
    _initKnockbackSFX: function (output) {
      knockbackSynth = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }
      }).connect(new Tone.Volume(6).connect(output));
    },

    /** Play jump sound effect. Called from Player.js on jump. */
    playJump: function () {
      if (!started || !jumpSynth) return;
      jumpSynth.triggerAttackRelease('C5', '32n');
    },

    /** Play footstep tick. Rate-limited so it doesn't spam. */
    playMove: function () {
      if (!started || !moveSynth) return;
      var now = Tone.now();
      if (now - _moveLastTime < 0.15) return;
      _moveLastTime = now;
      moveSynth.triggerAttackRelease('32n');
    },

    /** Horrific death screech — descending distorted tone + noise burst. */
    _initDeathSFX: function (output) {
      deathOutput = new Tone.Volume(4).connect(output);

      // Screaming descending tone with distortion
      var distortion = new Tone.Distortion(0.8).connect(deathOutput);
      deathSynth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.4 }
      }).connect(distortion);

      // Noise burst layered on top
      deathNoise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.05, release: 0.2 }
      }).connect(new Tone.Volume(-2).connect(deathOutput));
    },

    /** Play knockback hit sound. */
    playKnockback: function () {
      if (!started || !knockbackSynth) return;
      knockbackSynth.triggerAttackRelease('C1', '16n');
    },

    /** Sharp zap for bullet hit. */
    _initHitSFX: function (output) {
      hitSynth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.003, decay: 0.1, sustain: 0, release: 0.05 }
      }).connect(new Tone.Volume(0).connect(output));
    },

    /** Play hit sound when bullet connects. */
    playHit: function () {
      if (!started || !hitSynth) return;
      hitSynth.triggerAttackRelease('G4', '32n');
    },

    /** Play horrific death sound on head stomp. */
    playDeath: function () {
      if (!started || !deathSynth) return;
      // Descending screech from high to low
      var now = Tone.now();
      deathSynth.triggerAttackRelease('C5', '4n', now);
      deathSynth.frequency.setValueAtTime(Tone.Frequency('C5').toFrequency(), now);
      deathSynth.frequency.exponentialRampToValueAtTime(
        Tone.Frequency('C2').toFrequency(), now + 0.5
      );
      // Noise burst
      if (deathNoise) {
        deathNoise.triggerAttackRelease('8n', now);
      }
    }
  };
})();
