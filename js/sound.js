// Sound
//
// Call playSound('name') from anywhere. Most sounds are made by the browser itself
// (Web Audio): they are in SOUNDS below, each one a list of notes.
// Two airlock sounds are real recordings in assets/sounds (RECORDINGS below).
// The game still works offline: the files sit next to index.html.
//
//   wave    the shape of the sound: 'square' is a beepy game sound, 'sine' is soft,
//           'noise' is a rush of air (rockets, smoke)
//   from    the pitch at the start (Hz), "to" the pitch at the end
//   start   when the note starts, in seconds after the sound starts
//   length  how long the note lasts, in seconds
//   volume  0 to 1
//   rise    seconds until the note is loudest (leave it out for a sharp start)
//
// The sound button (a satellite dish) switches all sounds on and off. The browser remembers it.

const SOUNDS = {
    click:   [{ wave: 'square', from: 660, to: 660, start: 0, length: 0.04, volume: 0.08 }],
    pick:    [{ wave: 'square', from: 520, to: 880, start: 0, length: 0.09, volume: 0.15 }],
    unpick:  [{ wave: 'square', from: 700, to: 380, start: 0, length: 0.09, volume: 0.12 }],
    nope:    [{ wave: 'square', from: 180, to: 140, start: 0, length: 0.08, volume: 0.15 },
              { wave: 'square', from: 180, to: 140, start: 0.11, length: 0.08, volume: 0.15 }],
    play:    [{ wave: 'square', from: 440, to: 440, start: 0, length: 0.06, volume: 0.12 },
              { wave: 'square', from: 660, to: 660, start: 0.07, length: 0.08, volume: 0.12 }],
    science: [{ wave: 'sine', from: 1320, to: 1320, start: 0, length: 0.12, volume: 0.2 },
              { wave: 'sine', from: 1760, to: 1760, start: 0.08, length: 0.2, volume: 0.2 }],
    hurt:    [{ wave: 'square', from: 300, to: 90, start: 0, length: 0.25, volume: 0.15 }],
    turn:    [{ wave: 'sine', from: 392, to: 392, start: 0, length: 0.12, volume: 0.15 },
              { wave: 'sine', from: 523, to: 523, start: 0.1, length: 0.18, volume: 0.15 }],
    fanfare: [{ wave: 'square', from: 523, to: 523, start: 0, length: 0.12, volume: 0.12 },
              { wave: 'square', from: 659, to: 659, start: 0.13, length: 0.12, volume: 0.12 },
              { wave: 'square', from: 784, to: 784, start: 0.26, length: 0.12, volume: 0.12 },
              { wave: 'square', from: 1047, to: 1047, start: 0.39, length: 0.35, volume: 0.12 }],
    sad:     [{ wave: 'sine', from: 392, to: 392, start: 0, length: 0.25, volume: 0.18 },
              { wave: 'sine', from: 330, to: 330, start: 0.25, length: 0.25, volume: 0.18 },
              { wave: 'sine', from: 262, to: 250, start: 0.5, length: 0.5, volume: 0.18 }],
    beep:    [{ wave: 'square', from: 880, to: 880, start: 0, length: 0.15, volume: 0.15 }],
    clunk:   [{ wave: 'square', from: 140, to: 50, start: 0, length: 0.22, volume: 0.3 },
              { wave: 'noise', from: 900, to: 200, start: 0, length: 0.18, volume: 0.4 }],
    lock:    [{ wave: 'square', from: 110, to: 60, start: 0.45, length: 0.14, volume: 0.3 },
              { wave: 'noise', from: 1800, to: 300, start: 0.45, length: 0.12, volume: 0.35 },
              { wave: 'noise', from: 600, to: 900, start: 0, length: 0.45, volume: 0.12 }],
    // "air" and "open" also play a recording (RECORDINGS). These notes go with it.
    air:     [{ wave: 'noise', from: 400, to: 120, start: 0, length: 0.25, volume: 0.45 },             // the valve thumps open
              { wave: 'sine', from: 50, to: 80, start: 0, length: 0.85, volume: 0.3, rise: 0.3 }],      // the low rumble
    airBackup: [{ wave: 'noise', from: 800, to: 6000, start: 0, length: 0.85, volume: 0.55, rise: 0.35 }],  // the air rushes in
    unlock:  [{ wave: 'square', from: 220, to: 120, start: 0, length: 0.1, volume: 0.25 },
              { wave: 'noise', from: 2000, to: 600, start: 0.05, length: 0.2, volume: 0.3 },
              { wave: 'sine', from: 880, to: 880, start: 0.2, length: 0.15, volume: 0.15 }],
    open:    [{ wave: 'sine', from: 784, to: 784, start: 0, length: 0.15, volume: 0.2 },
              { wave: 'sine', from: 1175, to: 1175, start: 0.12, length: 0.3, volume: 0.2 }],
    openBackup: [{ wave: 'noise', from: 500, to: 3000, start: 0.2, length: 0.9, volume: 0.3 }],
    boing:   [{ wave: 'sine', from: 300, to: 900, start: 0, length: 0.25, volume: 0.25 }],
    thrust:  [{ wave: 'noise', from: 1200, to: 400, start: 0, length: 0.5, volume: 0.35 }]
};

// Real recordings, from OpenGameArt.org (they are also listed on the Sources page):
//   airlock-air.wav   "Steam release sounds" by bart, CC0. Cut to 0.85 seconds and made louder.
//   airlock-seal.wav  "Vacuum/Pressure Seal Opening" by dklon, CC-BY 3.0. Cut to the pop.
// "backup" is played instead when the browser cannot play the file.
const RECORDINGS = {
    air:  { file: 'assets/sounds/airlock-air.wav', volume: 0.9, backup: 'airBackup' },
    open: { file: 'assets/sounds/airlock-seal.wav', volume: 0.8, backup: 'openBackup' }
};

let audio = null;               // made at the first sound, because browsers only allow sound after a click
let soundOn = true;

function playSound(name) {
    if (!soundOn) {
        return;
    }
    if (RECORDINGS[name]) {
        playRecording(RECORDINGS[name]);
    }
    if (SOUNDS[name]) {
        playNotes(SOUNDS[name]);
    }
}

// Plays a sound file. A new copy each time, so the same sound can play twice at once.
function playRecording(recording) {
    if (!recording.player) {
        recording.player = new Audio(recording.file);
    }
    const copy = recording.player.cloneNode();
    copy.volume = recording.volume;
    const playing = copy.play();
    if (playing !== undefined) {
        playing.catch(function () {
            playNotes(SOUNDS[recording.backup]);   // the file did not play: use the made-up sound
        });
    }
}

function playNotes(notes) {
    if (audio === null) {
        const AudioMaker = window.AudioContext || window.webkitAudioContext;
        if (!AudioMaker) {
            return;             // a very old browser: just no sound
        }
        audio = new AudioMaker();
    }
    if (audio.state === 'suspended') {
        audio.resume();
    }
    const now = audio.currentTime;
    for (let i = 0; i < notes.length; i++) {
        playNote(notes[i], now + notes[i].start);
    }
}

function playNote(note, at) {
    // The volume rises (fast, or slowly with "rise") and fades out, so the note does not click.
    const rise = note.rise === undefined ? 0.01 : note.rise;
    const loudness = audio.createGain();
    loudness.gain.setValueAtTime(0.0001, at);
    loudness.gain.exponentialRampToValueAtTime(note.volume, at + rise);
    loudness.gain.exponentialRampToValueAtTime(0.0001, at + note.length);
    loudness.connect(audio.destination);

    let source;
    if (note.wave === 'noise') {
        // Random noise through a filter whose pitch slides: sounds like a rocket.
        const samples = Math.floor(audio.sampleRate * note.length);
        const buffer = audio.createBuffer(1, samples, audio.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < samples; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        source = audio.createBufferSource();
        source.buffer = buffer;
        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(note.from, at);
        filter.frequency.exponentialRampToValueAtTime(note.to, at + note.length);
        source.connect(filter);
        filter.connect(loudness);
    } else {
        source = audio.createOscillator();
        source.type = note.wave;
        source.frequency.setValueAtTime(note.from, at);
        source.frequency.exponentialRampToValueAtTime(note.to, at + note.length);
        source.connect(loudness);
    }
    source.start(at);
    source.stop(at + note.length + 0.05);
}

// The button shows a little satellite dish (dishOn / dishOff in js/icons.js).
// Sound on: the dish sends cyan radio waves. Sound off: no waves, a red cross instead.

function showSoundButtons() {
    const buttons = document.querySelectorAll('.sound-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].innerHTML = iconHtml(soundOn ? 'dishOn' : 'dishOff');
        buttons[i].classList.toggle('off', !soundOn);
        buttons[i].setAttribute('aria-label', soundOn ? 'Sound is on. Click to switch it off.' : 'Sound is off. Click to switch it on.');
    }
}

function toggleSound() {
    soundOn = !soundOn;
    try {
        localStorage.setItem('oneMoreSol.sound', soundOn ? 'on' : 'off');
    } catch (error) {
        // The browser does not let us remember it. That is fine.
    }
    showSoundButtons();
    playSound('click');
}

function setUpSound() {
    try {
        soundOn = localStorage.getItem('oneMoreSol.sound') !== 'off';
    } catch (error) {
        soundOn = true;
    }
    showSoundButtons();
    // Load the recordings now, so they are ready when the airlock needs them.
    for (const name in RECORDINGS) {
        RECORDINGS[name].player = new Audio(RECORDINGS[name].file);
        RECORDINGS[name].player.preload = 'auto';
    }
    const buttons = document.querySelectorAll('.sound-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', toggleSound);
    }
    // Every other button gives a small click.
    document.addEventListener('click', function (event) {
        if (event.target.closest('button') !== null && event.target.closest('.sound-button') === null) {
            playSound('click');
        }
    });
}
