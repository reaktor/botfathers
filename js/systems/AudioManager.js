(function () {
  'use strict';

  var started = false;
  var muted = false;
  var masterVol = null;
  var jumpSynth = null;

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

        AP.AudioManager._initBackground(masterVol);
        AP.AudioManager._initAmbient(masterVol);
        AP.AudioManager._initJumpSFX(masterVol);
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
      }).connect(new Tone.Volume(-12).connect(output));

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
      }).connect(new Tone.Volume(-18).connect(output));

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
      var vol = new Tone.Volume(-24);
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

    /** Play jump sound effect. Called from Player.js on jump. */
    playJump: function () {
      if (!started || !jumpSynth) return;
      jumpSynth.triggerAttackRelease('C5', '32n');
    }
  };
})();
