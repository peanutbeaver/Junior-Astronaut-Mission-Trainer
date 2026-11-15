// ============================================================
// intro.js - the start screen and the training with Pip the robot.
//
// What the player sees first:
//   1. The start screen: the title, a call sign and one big Launch button.
//   2. The airlock: the crew goes into the base. Click it to skip.
//   3. The training: four real turns of the game. Pip points at one thing
//      at a time and waits until the player has done it. There are no rules
//      to read: the player learns by playing.
//   4. "Training complete", then the real mission starts.
//
// This file does not change the rules. It only uses startNewMission() from
// index.js and gives the first four turns of the training fixed events.
// The styles are in css/intro.css.
// ============================================================

// ---------- Texts and numbers ----------

// Two words make a call sign, for example "Cosmic Otter".
const CALLSIGN_FIRST = ['Cosmic', 'Turbo', 'Mighty', 'Sneaky', 'Rocket', 'Lucky', 'Dizzy', 'Brave', 'Fuzzy', 'Zippy', 'Mega', 'Captain'];
const CALLSIGN_SECOND = ['Otter', 'Comet', 'Panda', 'Falcon', 'Noodle', 'Gecko', 'Meteor', 'Penguin', 'Tiger', 'Pickle', 'Yeti', 'Badger'];

// What Pip says on the start screen. {name} is the call sign.
const PIP_LINES = [
    'Psst, {name}! The crew is waiting for you!',
    'I polished all the solar panels. Well, most of them.',
    'The Sun looks grumpy today. Just saying.',
    'Press the big yellow button. I dare you!',
    'I counted the rocks. There are a LOT of rocks.',
    'Do you like lettuce? We have so much lettuce.',
    'Mars pulls less than half as hard as Earth. Easy hovering!'
];

// What Pip says when the player pokes it and it starts to spin.
const POKE_LINES = [
    'Wheeee! Rockets, hold me up!',
    'Whoa! Mars keeps pulling me down. My rockets push me back up!',
    'Hey! Now the rocket that points down has to do the work!',
    'Spinning... spinning... okay, got it!'
];

// What Pip says when the landing module touches the ground.
const TOUCHDOWN_LINE = 'Touchdown! Look at all that dust. Nice parking!';

// The events of the four training turns. After them the training is over.
const TRAINING_EVENTS = [
    { id: 'calm' },
    { id: 'spoiledFood' },
    { id: 'flareWarning', label: 'Training drill', date: '', lines: [] },
    { id: 'solarStorm', label: 'Training drill', date: '', multiple: 4.5, dose: 21, lines: [] }
];

// One step of the training:
//   target - the thing Pip points at ('' = nothing, the whole page is bright)
//   allow  - what the player may click in this step ('' = only Pip's Next button)
//   text   - what Pip says. Keep it to one or two short sentences.
//   done   - Pip waits until this is true. Without it, the step has a Next button.
const TRAINING_STEPS = [
    { target: '#scene', allow: '',
      text: 'Touchdown! Welcome to Mars, Commander {name}! I\'m Pip. This is our base, and you are the boss now.' },
    { target: '.stats', allow: '',
      text: 'Your whole job: keep [health] Health and [power] Power UP, and keep [radiation] Radiation DOWN.' },

    // Turn 1: research
    { target: '#research', allow: '#research',
      text: 'Let\'s discover something! Tap the Research card.',
      done: function () { return countInPlan('research') > 0; } },
    { target: '#endTurnButton', allow: '#endTurnButton',
      text: 'Good pick! It costs [power] 15 power. Now press the yellow button to make it happen.',
      done: function () { return turnIsOver(1); } },
    { target: '#scienceStat', allow: '',
      text: 'Boom! [science] +10 science. Fill this bar and you win an upgrade for the base.' },
    { target: '#powerStat', allow: '',
      text: 'And look: the Sun filled your [power] power back up. It does that every turn, but not at night.' },

    // Turn 2: food
    { target: '#eventBox', allow: '',
      text: 'Every turn, Mars has a surprise for you. Yuck! The food went bad and the crew lost [health] health.' },
    { target: '#greenhouse', allow: '#greenhouse',
      text: 'Fresh veggies will fix that. Tap Greenhouse!',
      done: function () { return countInPlan('greenhouse') > 0; } },
    { target: '#endTurnButton', allow: '#endTurnButton',
      text: 'Dinner time. Press the yellow button!',
      done: function () { return turnIsOver(2); } },

    // Turn 3: the warning
    { target: '#eventBox', allow: '',
      text: 'RED ALERT! The Sun just fired a solar flare. A radiation storm hits us NEXT turn!' },
    { target: '#shelter', allow: '#shelter',
      text: 'Hide! Tap Take shelter before the storm gets here.',
      done: function () { return countInPlan('shelter') > 0; } },
    { target: '#endTurnButton', allow: '#endTurnButton',
      text: 'Go, go, go! Press the button!',
      done: function () { return turnIsOver(3); } },

    // Turn 4: the storm, and the player chooses alone
    { target: '#scene', allow: '',
      text: 'Here comes the storm... but we are snug in the shelter. Phew!' },
    { target: '', allow: '.right-panel, .side-panel, #earthPopup',
      text: 'Your turn, Commander! Pick ANY cards you like, then end the turn. You can even pick the same card twice.',
      done: function () { return turnIsOver(4); } },
    { target: '#doseStat', allow: '',
      text: 'See [radiation] Radiation? The shelter blocked most of the storm. Without it, that bar would have shot up!' }
];

// Where the launch stands and where the training stands.
const intro = {
    callsign: '',
    pipLine: 0,
    launching: false,
    launchTimer: null,
    afterLaunch: null,
    opened: false,          // true once the game screen is behind the airlock doors
    venting: false,         // true while air rushes into the airlock
    countStart: 0,          // when the air started to come in
    fogAt: 0,               // when fog was last added
    moving: [],             // the running animations of the airlock
    training: false,        // true while Pip is guiding the player
    step: 0
};

// ---------- Remembering things between visits ----------
// Some browsers do not allow this for a page opened from a folder. Then nothing is remembered.

function remember(key, value) {
    try {
        localStorage.setItem('oneMoreSol.' + key, value);
    } catch (error) {
        // not allowed: the game still works
    }
}

function recall(key) {
    try {
        return localStorage.getItem('oneMoreSol.' + key);
    } catch (error) {
        return null;
    }
}

// drawSquares() is in js/icons.js. It draws Pip, the landing module and every icon.

// Pip the robot.
const PIP_ROWS = [
    '.......YY.......',
    '.......dd.......',
    '...dddddddddd...',
    '..dWWWWWWWWWWd..',
    '..dWkkkkkkkkSd..',
    '..dWkBBkkBBkSd..',
    '..dWkBBkkBBkSd..',
    '..dWkkkkkkkkSd..',
    '..dWSSSSSSSSSd..',
    '...dddddddddd...',
    '....dGGOOGGd....',
    '.dd.dGGGGGGd.dd.',
    '.dGddGGGGGGddGd.',
    '.dd.dddddddd.dd.',
    '...dkkd..dkkd...',
    '...dddd..dddd...'
];
const PIP_COLORS = { Y: '#f0cf4f', d: '#334155', W: '#f8fafc', S: '#cbd5e1', k: '#0b0b1e', B: '#38bdf8', G: '#94a3b8', O: '#f97316' };
const PIP_CLASSES = { B: 'pip-eye', Y: 'pip-light' };

function drawPip(elementId) {
    byId(elementId).innerHTML = drawSquares(PIP_ROWS, PIP_COLORS, PIP_CLASSES);
}

// The letters of the title, 5 squares wide and 7 squares tall.
const LOGO_LETTERS = {
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####']
};

// Draws one word of the title. "size" is how big one square is.
function drawLogoWord(word, left, top, size, color) {
    let svg = '';
    let x = left;
    for (let i = 0; i < word.length; i++) {
        if (word[i] === ' ') {
            x += 3 * size;
            continue;
        }
        const rows = LOGO_LETTERS[word[i]];
        for (let row = 0; row < rows.length; row++) {
            for (let column = 0; column < rows[row].length; column++) {
                if (rows[row][column] === '#') {
                    svg += '<rect x="' + (x + column * size) + '" y="' + (top + row * size)
                        + '" width="' + size + '" height="' + size + '" fill="' + color + '"/>';
                }
            }
        }
        x += 6 * size;
    }
    return svg;
}

// The title: "ONE MORE" on top, a big "SOL" below. The O of SOL is Mars.
function drawLogo() {
    let svg = '<svg viewBox="0 0 45 25" shape-rendering="crispEdges" aria-hidden="true">';
    // Each word is drawn twice: first its shadow, then the word itself.
    svg += drawLogoWord('ONE MORE', 1.5, 0.5, 1, '#9a3412');
    svg += drawLogoWord('ONE MORE', 1, 0, 1, '#fff7e0');
    svg += drawLogoWord('S', 6, 10, 2, '#9a3412');
    svg += drawLogoWord('L', 30, 10, 2, '#9a3412');
    svg += drawLogoWord('S', 5, 9, 2, '#f0cf4f');
    svg += drawLogoWord('L', 29, 9, 2, '#f0cf4f');
    svg += '<image href="assets/iconOfMars.png" x="15.5" y="9" width="14" height="14"/>';
    svg += '</svg>';
    byId('logo').innerHTML = svg;
}

// The ground of Mars at the bottom of the start screen: two rows of hills.
function drawGround() {
    const width = 320;
    const height = 20;
    let svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" aria-hidden="true">';
    for (let x = 0; x < width; x += 2) {
        // Far hills
        const far = Math.round(15 + 2.5 * Math.sin(x / 19) + 1.5 * Math.sin(x / 7 + 2));
        svg += '<rect x="' + x + '" y="' + (height - far) + '" width="2" height="' + far + '" fill="#7c2d12"/>';
    }
    for (let x = 0; x < width; x += 2) {
        // Near hills, with a bright top edge
        const near = Math.round(9 + 2 * Math.sin(x / 23 + 1) + Math.sin(x / 9));
        svg += '<rect x="' + x + '" y="' + (height - near) + '" width="2" height="' + near + '" fill="#c2410c"/>';
        svg += '<rect x="' + x + '" y="' + (height - near) + '" width="2" height="1" fill="#ea580c"/>';
        // A rock now and then
        if (x % 22 === 6) {
            svg += '<rect x="' + x + '" y="' + (height - near + 4) + '" width="2" height="1" fill="#7c2d12"/>';
        }
        if (x % 34 === 12) {
            svg += '<rect x="' + (x + 1) + '" y="' + (height - near + 6) + '" width="3" height="1" fill="#9a3412"/>';
        }
    }
    byId('landingGround').innerHTML = svg + '</svg>';
}

// Small stars that twinkle in the sky of the start screen.
function addStars() {
    for (let i = 0; i < 28; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.round(Math.random() * 100) + '%';
        star.style.top = Math.round(Math.random() * 70) + '%';
        star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
        startscreen.insertBefore(star, startscreen.firstChild);
    }
}

// ---------- The start screen ----------

function isTrained() {
    return recall('trained') === 'yes';
}

function rollCallsign() {
    let name = intro.callsign;
    while (name === intro.callsign) {
        name = CALLSIGN_FIRST[Math.floor(Math.random() * CALLSIGN_FIRST.length)] + ' '
            + CALLSIGN_SECOND[Math.floor(Math.random() * CALLSIGN_SECOND.length)];
    }
    intro.callsign = name;
    remember('callsign', name);
    byId('callsignName').textContent = name;
    playAnimation(byId('callsignName'), 'rolled');
    showPipLine();
}

function showPipLine() {
    byId('pipBubble').textContent = PIP_LINES[intro.pipLine].replace('{name}', intro.callsign);
}

function nextPipLine() {
    intro.pipLine = (intro.pipLine + 1) % PIP_LINES.length;
    showPipLine();
    playAnimation(byId('pipBubble'), 'appear');
}

// ---------- The scene on the start screen: Pip hovers and the landing module lands ----------
//
// Both follow the same two rules of real physics:
//
//   1. Mars pulls everything down, all the time (MARS_GRAVITY).
//      Nothing falls at a steady speed: it falls faster and faster.
//   2. Only a rocket can push back. A rocket pushes away from its own flame.
//
// Pip hovers: it sinks, its rockets fire and lift it, they stop, it sinks again.
// The landing module comes down fast, brakes with its engine and touches down
// slowly. Near the ground the engine blows dust into the air.
//
// Click Pip to make it spin. Click the landing module to make it hop.

const MARS_GRAVITY = 45;    // how much faster a fall gets: pixels per second, every second.
                            // Real Mars pulls less than half as hard as Earth.

const HOVER = {
    rocketPower: 120,       // how hard Pip's rockets push. It must be more than gravity, or Pip could not hover.
    sinkLimit: 3,           // Pip fires its rockets when it has sunk this far below its place (pixels)
    riseSpeed: 26,          // ...and stops them when it climbs this fast (pixels per second)
    fallLimit: 60,          // Pip never lets itself fall faster than this

    // Sideways, in pixels
    moveLimit: 10,          // how far Pip may drift before a rocket fires
    moveCruise: 4,          // the slow speed at which it drifts back, pixels per second
    moveMax: 60,            // the fastest it flies back after a big push

    // Turning, in degrees
    turnLimit: 7,
    turnCruise: 3.5,
    turnMax: 160,
    turnPower: 110,

    pull: 0.9,              // the further away, the faster Pip comes back
    flameTime: 180,         // a flame stays lit at least this long (milliseconds), so it can be seen
    bumpEvery: 3500         // now and then something tiny nudges Pip (milliseconds)
};

const LANDER = {
    entrySpeed: 240,        // how fast the module comes down from the sky, pixels per second
    touchSpeed: 14,         // how slowly it wants to touch the ground
    slowDown: 0.8,          // the lower it is, the slower it wants to fall
    enginePower: 260,       // the strongest push of its engine
    hopSpeed: 150,          // how fast it jumps up when it is clicked
    dustHeight: 260,        // the engine blows dust when the module is lower than this (pixels)
    dustRate: 110,          // puffs of dust per second, right above the ground at full power
    dustColors: ['#c2410c', '#ea580c', '#b45309', '#d6a06a', '#9a3412'],
    smokeColors: ['#e2e8f0', '#cbd5e1', '#94a3b8']
};

const JET_NAMES = ['foot-left', 'foot-right', 'head-left', 'head-right', 'hand-left', 'hand-right'];

const scene = {
    lastTime: 0,
    wasShowing: false       // was the start screen showing in the last frame?
};

const pip = {
    x: 0, y: 0, angle: 0,           // where Pip is, counted from its place on the page
    speedX: 3, speedY: 0, spin: 3,  // how fast it moves and turns (per second)
    burning: false,                 // are the rockets holding Pip up right now?
    nextBump: 0,
    jets: {},                       // the six flame elements
    litUntil: {}                    // when each flame goes out
};

const lander = {
    height: 0,              // pixels above the ground. 0 = standing on Mars.
    speed: 0,               // how fast it falls. Below zero = it is going up.
    flying: false,
    throttle: 0,            // how hard the engine pushes: 0 = off, 1 = full power
    dustDue: 0,             // dust that still has to be added
    smokeUntil: 0           // the hot engine smokes until this time
};

// The landing module, drawn from little squares like Pip.
const LANDER_ROWS = [
    '...........RR...........',
    '...........dd...........',
    '........dddddddd........',
    '......ddWWWWWWWWdd......',
    '.....dWWWWWWWWWWSSd.....',
    '.....dWWkkkkkkkkWSd.....',
    '.....dWWkBBBBBBkWSd.....',
    '.....dWWkBBBBBBkWSd.....',
    '.....dWWkkkkkkkkWSd.....',
    '....dddddddddddddddd....',
    '....dYYYYYYYYYYYYOOd....',
    '....dYOYYYYOYYYYYOOd....',
    '....dddddddddddddddd....',
    '....dd..dGGGGGGd..dd....',
    '...dd...dGGGGGGd...dd...',
    '..dd....dddddddd....dd..',
    '.dd..................dd.',
    'dddd................dddd'
];
const LANDER_COLORS = { R: '#f97316', d: '#334155', W: '#f8fafc', S: '#cbd5e1', k: '#0b0b1e', B: '#38bdf8', Y: '#f0cf4f', O: '#b59418', G: '#94a3b8' };
const LANDER_CLASSES = { R: 'pip-light' };

// ----- Pip -----

// Decides what the rockets do for one direction of movement.
// "place" is how far Pip is from where it should be, "speed" is how fast that changes.
// Returns 1 (push forwards), -1 (push backwards) or 0 (rockets off, just drift).
function steer(place, speed, limit, cruise, max) {
    const side = place > 0 ? 1 : -1;
    if (Math.abs(place) > limit) {
        // Too far out: fly back, faster when further away.
        const wanted = -side * Math.min(max, Math.max(cruise, Math.abs(place) * HOVER.pull));
        if ((speed - wanted) * side > cruise * 0.25) {
            return -side;       // still moving away, or coming back too slowly
        }
        if ((wanted - speed) * side > cruise) {
            return side;        // coming back too fast: brake
        }
        return 0;
    }
    // Near its place: only brake when it is much too fast.
    if (Math.abs(speed) > cruise * 1.6) {
        return speed > 0 ? -1 : 1;
    }
    return 0;
}

function lightJets(names, now) {
    for (let i = 0; i < names.length; i++) {
        pip.litUntil[names[i]] = now + HOVER.flameTime;
    }
}

function hoverPip(seconds, now) {
    // Now and then something tiny nudges Pip, so it never moves the same way twice.
    if (now > pip.nextBump) {
        pip.nextBump = now + HOVER.bumpEvery * randomBetween(0.6, 1.4);
        pip.speedX += randomBetween(-2, 2);
        pip.spin += randomBetween(-2, 2);
    }

    // 1. Mars pulls Pip down.
    pip.speedY += MARS_GRAVITY * seconds;

    // 2. Pip decides what its rockets should do.
    // Up and down: fire when it has sunk too low, stop when it climbs fast enough.
    if ((pip.y > HOVER.sinkLimit && pip.speedY > 0) || pip.speedY > HOVER.fallLimit) {
        pip.burning = true;
    }
    if (pip.speedY <= -HOVER.riseSpeed) {
        pip.burning = false;
    }
    // Sideways and turning.
    const pushX = steer(pip.x, pip.speedX, HOVER.moveLimit, HOVER.moveCruise, HOVER.moveMax);
    const tilt = ((pip.angle % 360) + 540) % 360 - 180;     // -180 to 180, so Pip turns back the short way
    const turn = steer(tilt, pip.spin, HOVER.turnLimit, HOVER.turnCruise, HOVER.turnMax);

    // 3. The four groups of rockets. Each one pushes Pip away from its flame, so the
    // direction of the push depends on how Pip is turned. When Pip is upright, the
    // feet push it up. When Pip is upside down, the rockets on its head do that job.
    const radians = pip.angle * Math.PI / 180;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const groups = [
        { jets: ['foot-left', 'foot-right'], pushX: sin, pushY: -cos },     // pushes Pip towards its head
        { jets: ['head-left', 'head-right'], pushX: -sin, pushY: cos },     // pushes Pip towards its feet
        { jets: ['hand-left'], pushX: cos, pushY: sin },                    // pushes Pip to its right
        { jets: ['hand-right'], pushX: -cos, pushY: -sin }                  // pushes Pip to its left
    ];
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const holdsUp = pip.burning && -group.pushY > 0.5;
        const pushesSide = pushX !== 0 && group.pushX * pushX > 0.5;
        if (holdsUp || pushesSide) {
            pip.speedX += group.pushX * HOVER.rocketPower * seconds;
            pip.speedY += group.pushY * HOVER.rocketPower * seconds;
            lightJets(group.jets, now);
        }
    }
    // Two rockets on opposite corners turn Pip without pushing it away.
    pip.spin += turn * HOVER.turnPower * seconds;
    if (turn > 0) {             // turn clockwise: left side up, right side down
        lightJets(['foot-left', 'head-right'], now);
    } else if (turn < 0) {
        lightJets(['foot-right', 'head-left'], now);
    }

    // 4. Pip moves and turns with the speed it has now.
    pip.x += pip.speedX * seconds;
    pip.y += pip.speedY * seconds;
    pip.angle += pip.spin * seconds;

    for (let i = 0; i < JET_NAMES.length; i++) {
        pip.jets[JET_NAMES[i]].classList.toggle('on', now < pip.litUntil[JET_NAMES[i]]);
    }
    byId('landingPip').style.transform = 'translate(' + pip.x.toFixed(1) + 'px,' + pip.y.toFixed(1)
        + 'px) rotate(' + pip.angle.toFixed(1) + 'deg)';
}

// A click gives Pip a spin and a small push. Its rockets have to stop it again.
function pokePip() {
    pip.spin += (Math.random() < 0.5 ? -1 : 1) * randomBetween(140, 220);
    pip.speedX += randomBetween(-18, 18);      // only a small push: Pip should stay near its place
    byId('pipBubble').textContent = POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)];
    playAnimation(byId('pipBubble'), 'appear');
    playSound('boing');
}

// ----- The landing module -----

// Puts the module high above the screen and lets it come down.
function startLanding() {
    lander.height = startscreen.clientHeight;
    lander.speed = LANDER.entrySpeed;
    lander.flying = true;
    lander.dustDue = 0;
    lander.smokeUntil = 0;
}

// A click on the standing module: the engine kicks it up, then it lands again.
function hopLander() {
    if (lander.flying) {
        return;
    }
    lander.speed = -LANDER.hopSpeed;
    lander.height = 1;
    lander.flying = true;
    addDust(30, 1);
    playSound('thrust');
}

// Where the module stands: the middle of its feet, counted from the corner of the start screen.
function getLandingSpot() {
    const module = byId('lander');
    return { x: module.offsetLeft + module.offsetWidth / 2, y: module.offsetTop + module.offsetHeight };
}

// Dust that the engine blows off the ground. It rolls away to both sides and floats up into the air.
function addDust(count, strength) {
    const spot = getLandingSpot();
    const scale = byId('lander').offsetWidth / 132;     // on a phone the module is smaller, and so is its dust
    for (let i = 0; i < count; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        addPuff(
            'landingDust', LANDER.dustColors,
            spot.x + randomBetween(-34, 34) * scale, spot.y - randomBetween(0, 14) * scale,
            randomBetween(16, 44) * (0.6 + strength * 0.4) * scale,
            side * randomBetween(50, 260) * strength * scale, -randomBetween(20, 170) * scale,
            randomBetween(1600, 3800), null
        );
    }
}

function touchDown(now) {
    lander.height = 0;
    lander.speed = 0;
    lander.flying = false;
    lander.throttle = 0;
    lander.smokeUntil = now + 2500;
    addDust(40, 1);
    byId('pipBubble').textContent = TOUCHDOWN_LINE;
    playAnimation(byId('pipBubble'), 'appear');
}

function flyLander(seconds, now) {
    if (lander.flying) {
        // The computer on board: fall fast high up, slower and slower near the ground.
        const wanted = Math.min(LANDER.entrySpeed, LANDER.touchSpeed + lander.height * LANDER.slowDown);
        // The engine: just enough to hold the module against gravity, plus more when it is too fast.
        const power = MARS_GRAVITY / LANDER.enginePower + (lander.speed - wanted) * 0.05;
        lander.throttle = Math.max(0, Math.min(1, power));

        // Gravity pulls down, the engine pushes up.
        lander.speed += (MARS_GRAVITY - lander.throttle * LANDER.enginePower) * seconds;
        lander.height -= lander.speed * seconds;

        // Close to the ground the engine blows dust into the air. The closer, the more.
        if (lander.throttle > 0.05 && lander.height < LANDER.dustHeight) {
            const closeness = 1 - Math.max(0, lander.height) / LANDER.dustHeight;
            lander.dustDue += LANDER.dustRate * lander.throttle * closeness * seconds;
            const puffs = Math.floor(lander.dustDue);
            lander.dustDue -= puffs;
            addDust(puffs, 0.4 + closeness * 0.6);
        }
        if (lander.height <= 0 && lander.speed > 0) {
            touchDown(now);
        }
    } else if (now < lander.smokeUntil && Math.random() < 14 * seconds) {
        // After the landing the hot engine smokes for a moment. The smoke rises straight up.
        const spot = getLandingSpot();
        addPuff('landingDust', LANDER.smokeColors, spot.x + randomBetween(-12, 12), spot.y - 14,
            randomBetween(12, 24), randomBetween(-30, 30), -randomBetween(80, 190), randomBetween(1500, 2600), null);
    }

    byId('lander').style.transform = 'translateY(' + (-lander.height).toFixed(1) + 'px)';
    // The flame is as long as the engine is strong, and it flickers.
    const flame = lander.throttle * randomBetween(0.85, 1.15);
    byId('landerFlame').style.transform = 'scaleY(' + flame.toFixed(2) + ')';
}

// ----- Running the scene -----

// Runs for every frame the browser draws.
function animateScene(now) {
    requestAnimationFrame(animateScene);
    // The time since the last frame. Never more than 50 milliseconds, so nothing jumps
    // after the page was in the background.
    const seconds = Math.max(0, Math.min(now - scene.lastTime, 50)) / 1000;
    scene.lastTime = now;

    // Every time the start screen comes back, the module lands again.
    const showing = startscreen.classList.contains('active');
    if (showing && !scene.wasShowing) {
        startLanding();
    }
    scene.wasShowing = showing;
    if (!showing) {
        return;
    }
    hoverPip(seconds, now);
    flyLander(seconds, now);
}

// Draws the module, adds the six flames to Pip and starts the scene.
function startScene() {
    byId('lander').innerHTML = drawSquares(LANDER_ROWS, LANDER_COLORS, LANDER_CLASSES)
        + '<span class="lander-flame" id="landerFlame"></span>';
    for (let i = 0; i < JET_NAMES.length; i++) {
        const jet = document.createElement('span');
        jet.className = 'pip-jet ' + JET_NAMES[i];
        byId('landingPip').appendChild(jet);
        pip.jets[JET_NAMES[i]] = jet;
        pip.litUntil[JET_NAMES[i]] = 0;
    }
    byId('landingPip').addEventListener('click', pokePip);
    byId('lander').addEventListener('click', hopLander);

    // People who ask their computer for less motion get a Pip that stays still
    // and a module that already stands on the ground.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
        requestAnimationFrame(animateScene);
    }
}

// New players get the training. Players who finished it once go straight to Mars.
function renderLanding() {
    if (isTrained()) {
        byId('launchHint').textContent = 'Welcome back, Commander. Mars missed you!';
        byId('altStartButton').textContent = 'Train with Pip again';
    } else {
        byId('launchHint').textContent = 'Pip the robot shows you how. No rules to read!';
        byId('altStartButton').textContent = 'I have played before. Skip the training';
    }
}

function onLaunchClick() {
    launch(isTrained() ? startNewMission : startTraining);
}

function onAltStartClick() {
    launch(isTrained() ? startTraining : startNewMission);
}

// ---------- The launch: the airlock ----------
//
// Pressing Launch takes the crew into the base the way real astronauts get in:
// through an airlock. Outside is the thin air of Mars, so the airlock must be filled
// with air before the inner door may open.
//
//   1. The outer door slides shut. Clunk! The screen shakes.
//   2. Two big bolts slide across the gap and the wheel turns: LOCKED.
//   3. Air rushes in through the vents. Fast air cools down and makes fog, like your
//      breath on a cold day. In under a second the number on the wheel counts from
//      1.00 down to 0.00, the gauge fills and everything rumbles. Whoosh!
//   4. The bolts slide back, the light turns green, the wheel turns back.
//   5. The game screen is put behind the doors, they slide open and
//      "MISSION BEGINS" floats up.
//
// A click on the airlock skips it. With "reduce motion" switched on there is no airlock.

const AIRLOCK = {
    closeTime: 500,         // milliseconds for the doors to slide shut
    lockTime: 700,          // milliseconds for the bolts to slide in (also in css/intro.css)
    countFrom: 1,           // the number on the wheel counts down from this...
    countTo: 0,             // ...to this, with two decimals: 1.00, 0.99, ... 0.00
    countTime: 900,         // milliseconds for the whole count, while the air comes in (also in css/intro.css)
    unlockTime: 600,        // milliseconds for the bolts to slide back
    openTime: 1100,         // milliseconds for the doors to slide open
    slamShake: 10,          // pixels: the doors slam shut
    boltShake: 5,           // pixels: the bolts hit home, and again when they come out
    rumbleShake: 3,         // pixels: the strongest rumble while the air rushes in
    fogPerSecond: 200,      // puffs of fog out of the vents while the air comes in
    fogColors: ['255, 255, 255', '226, 232, 240', '203, 213, 225']    // red, green, blue
};

// Where the four vents are: share of the screen width, share of the height,
// and which way they blow (1 = to the right, -1 = to the left).
const VENTS = [
    { x: 0, y: 0.2, blow: 1 },
    { x: 0, y: 0.8, blow: 1 },
    { x: 1, y: 0.2, blow: -1 },
    { x: 1, y: 0.8, blow: -1 }
];

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

// Remembers a running animation, so a click can stop it.
function track(animation) {
    intro.moving.push(animation);
    return animation;
}

// Shakes everything in the airlock.
function shakeAirlock(duration, fromStrength, toStrength) {
    track(shakeElement(byId('airlockBody'), duration, fromStrength, toStrength));
}

// Plays the airlock, then calls "after". A click skips it.
function launch(after) {
    if (intro.launching) {
        return;
    }
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof document.body.animate !== 'function') {
        after();
        return;
    }
    intro.launching = true;
    intro.opened = false;
    intro.venting = false;
    intro.afterLaunch = after;
    intro.moving = [];
    document.body.classList.add('launch-lock');

    byId('airlock').className = 'airlock active';
    byId('airlockSmoke').innerHTML = '';
    byId('airlockNumber').textContent = AIRLOCK.countFrom.toFixed(2);
    byId('airlockGauge').style.width = '0%';
    byId('airlockStatus').textContent = 'Closing the door';
    byId('airlockTitle').textContent = after === startTraining ? 'TRAINING BEGINS' : 'MISSION BEGINS';

    slideDoors(true, AIRLOCK.closeTime, 0);
    intro.launchTimer = setTimeout(doorsShut, AIRLOCK.closeTime);
}

// Slides both doors shut (closing = true) or open (closing = false).
function slideDoors(closing, duration, delay) {
    const doors = [byId('doorLeft'), byId('doorRight')];
    const outside = ['translateX(-100%)', 'translateX(100%)'];
    for (let i = 0; i < doors.length; i++) {
        const from = closing ? outside[i] : 'translateX(0)';
        const to = closing ? 'translateX(0)' : outside[i];
        track(doors[i].animate([{ transform: from }, { transform: to }], {
            duration: duration,
            delay: delay,
            easing: closing ? 'cubic-bezier(0.5, 0, 1, 1)' : 'cubic-bezier(0.45, 0, 0.2, 1)',
            fill: 'forwards'
        }));
    }
}

// 1. Clunk! The doors are shut.
function doorsShut() {
    playSound('clunk');
    shakeAirlock(350, AIRLOCK.slamShake, 0);
    byId('airlock').classList.add('shut');
    byId('airlockStatus').textContent = 'Locking';
    intro.launchTimer = setTimeout(lockDoors, 350);
}

// 2. The bolts slide across the gap and the wheel turns (a CSS transition on "locked").
function lockDoors() {
    playSound('lock');
    byId('airlock').classList.add('locked');
    intro.launchTimer = setTimeout(startAir, AIRLOCK.lockTime);
}

// 3. The bolts are home. Air rushes in.
function startAir() {
    // One shake: the thud of the bolts, then the rumble of the air.
    shakeAirlock(AIRLOCK.countTime, AIRLOCK.boltShake, AIRLOCK.rumbleShake);
    byId('airlockStatus').textContent = 'LOCKED · air coming in';
    byId('airlock').classList.add('filling');      // the fog slowly gets thicker
    playSound('air');
    intro.venting = true;
    intro.countStart = performance.now();
    intro.fogAt = intro.countStart;
    requestAnimationFrame(airTick);
    // A timer, not the animation, decides when the air is in. So it also ends in a hidden tab.
    intro.launchTimer = setTimeout(unlockDoors, AIRLOCK.countTime);
}

// Runs many times per second while the air comes in: the number, the gauge and the fog.
function airTick(now) {
    if (!intro.launching || !intro.venting) {
        return;
    }
    const part = Math.min(1, (now - intro.countStart) / AIRLOCK.countTime);
    showCount(part);
    makeFog(now);
    requestAnimationFrame(airTick);
}

// part = 0 at the start of the count, 1 at the end.
function showCount(part) {
    const number = AIRLOCK.countFrom + (AIRLOCK.countTo - AIRLOCK.countFrom) * part;
    byId('airlockNumber').textContent = number.toFixed(2);
    byId('airlockGauge').style.width = Math.round(part * 100) + '%';
}

// Puffs of fog out of the vents. Fast and slow screens get the same amount.
function makeFog(now) {
    const seconds = Math.min(now - intro.fogAt, 100) / 1000;
    intro.fogAt = now;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const puffs = Math.round(AIRLOCK.fogPerSecond * seconds + Math.random() - 0.5);
    for (let i = 0; i < puffs; i++) {
        const vent = VENTS[Math.floor(Math.random() * VENTS.length)];
        addFog(
            vent.x * width, vent.y * height + randomBetween(-14, 14),
            randomBetween(50, 110),
            vent.blow * randomBetween(120, width * 0.45), randomBetween(-110, 50),
            randomBetween(1600, 3000)
        );
    }
}

// One puff of fog. It has soft edges, grows, drifts away and fades.
function addFog(x, y, size, driftX, driftY, life) {
    const puff = document.createElement('div');
    const color = AIRLOCK.fogColors[Math.floor(Math.random() * AIRLOCK.fogColors.length)];
    puff.className = 'fog-puff';
    puff.style.left = (x - size / 2) + 'px';
    puff.style.top = (y - size / 2) + 'px';
    puff.style.width = size + 'px';
    puff.style.height = size + 'px';
    puff.style.background = 'radial-gradient(circle, rgba(' + color + ', 0.7) 0%, rgba(' + color + ', 0.3) 40%, rgba(' + color + ', 0) 70%)';
    byId('airlockSmoke').appendChild(puff);

    const grow = randomBetween(3, 6);
    const animation = puff.animate(
        [{ transform: 'translate(0px,0px) scale(0.4)', opacity: 0 },
         { opacity: 1, offset: 0.15 },
         { transform: 'translate(' + driftX + 'px,' + driftY + 'px) scale(' + grow.toFixed(2) + ')', opacity: 0 }],
        { duration: life, easing: 'cubic-bezier(0.1, 0.6, 0.3, 1)', fill: 'forwards' }
    );
    animation.onfinish = function () {
        puff.remove();
    };
}

// 4. The air is in. The bolts slide back and the light turns green.
function unlockDoors() {
    intro.venting = false;
    showCount(1);
    playSound('unlock');
    shakeAirlock(300, AIRLOCK.boltShake, 0);
    byId('airlock').classList.remove('locked');
    byId('airlock').classList.add('ready');
    byId('airlockStatus').textContent = 'Air is safe!';
    intro.launchTimer = setTimeout(openDoors, AIRLOCK.unlockTime);
}

// 5. The game screen goes behind the doors, then the doors slide open.
function openDoors() {
    intro.opened = true;
    intro.afterLaunch();
    byId('airlock').classList.add('opening');      // panel and fog fade, the title floats up
    playSound('open');
    slideDoors(false, AIRLOCK.openTime, 150);
    intro.launchTimer = setTimeout(finishLaunch, AIRLOCK.openTime + 550);
}

// Shakes one element. The shake goes from one strength to another.
// It jumps to a new random place about 25 times per second.
function shakeElement(element, duration, fromStrength, toStrength) {
    const steps = Math.max(1, Math.round(duration / 40));
    const frames = [];
    for (let i = 0; i <= steps; i++) {
        const strength = fromStrength + (toStrength - fromStrength) * (i / steps);
        frames.push({
            transform: 'translate(' + randomBetween(-strength, strength).toFixed(1) + 'px,'
                + randomBetween(-strength, strength).toFixed(1) + 'px)'
        });
    }
    frames.push({ transform: 'translate(0px,0px)' });
    return element.animate(frames, { duration: duration, easing: 'steps(' + (steps + 1) + ', end)' });
}

// Adds one puff of smoke or dust to a layer. It grows, drifts away and fades.
// "colors" is the list of colours to pick from. A puff with a "fire" colour
// starts as fire and turns into smoke.
// Adds one puff of smoke or dust to a layer. It grows, drifts away and fades.
// "colors" is the list of colours to pick from. A puff with a "fire" colour
// starts as fire and turns into smoke.
function addPuff(layerId, colors, x, y, size, driftX, driftY, life, fire) {
    const puff = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    puff.className = 'smoke-puff';
    puff.style.left = (x - size / 2) + 'px';
    puff.style.top = (y - size / 2) + 'px';
    puff.style.width = size + 'px';
    puff.style.height = size + 'px';
    puff.style.background = color;
    byId(layerId).appendChild(puff);

    const grow = randomBetween(2.5, 4.5);
    const animation = puff.animate(
        [{ transform: 'translate(0px,0px) scale(0.3)', opacity: 1, background: fire === null ? color : fire },
         { opacity: 0.95, background: color, offset: 0.3 },
         { transform: 'translate(' + driftX + 'px,' + driftY + 'px) scale(' + grow.toFixed(2) + ')', opacity: 0 }],
        { duration: life, easing: 'cubic-bezier(0.1, 0.6, 0.3, 1)', fill: 'forwards' }
    );
    animation.onfinish = function () {
        puff.remove();
    };
}

// Ends the airlock, also when it is skipped with a click.
function finishLaunch() {
    if (!intro.launching) {
        return;
    }
    clearTimeout(intro.launchTimer);
    intro.launching = false;
    intro.venting = false;

    // Stop everything that is still moving.
    for (let i = 0; i < intro.moving.length; i++) {
        intro.moving[i].cancel();
    }
    intro.moving = [];
    byId('airlock').className = 'airlock';
    byId('airlockSmoke').innerHTML = '';
    document.body.classList.remove('launch-lock');

    // Skipped before the doors opened: go to the game now.
    if (!intro.opened) {
        intro.opened = true;
        intro.afterLaunch();
        playAnimation(gamescreen, 'fade-in');
    }
}

// ---------- The training ----------

// True when the turn with this number has been played to the end.
function turnIsOver(turnNumber) {
    return !busy && getTurnNumber() >= turnNumber;
}

// Starts a normal mission, but the first four turns get the training events.
function startTraining() {
    const realBuildSchedule = buildSchedule;
    buildSchedule = function () {
        const schedule = realBuildSchedule();
        for (let i = 0; i < TRAINING_EVENTS.length; i++) {
            schedule[i] = TRAINING_EVENTS[i];
        }
        return schedule;
    };
    startNewMission();
    buildSchedule = realBuildSchedule;

    intro.training = true;
    byId('coach').classList.add('active');
    showStep(0);
    requestAnimationFrame(watchTraining);
}

function showStep(number) {
    intro.step = number;
    const step = TRAINING_STEPS[number];
    setIconText(byId('coachText'), step.text.replace('{name}', intro.callsign));
    byId('coachProgress').style.width = Math.round((number + 1) / TRAINING_STEPS.length * 100) + '%';
    playAnimation(byId('coachText'), 'appear');

    // A step either waits for the player or has a Next button.
    const waits = step.done !== undefined;
    byId('coachNext').style.display = waits ? 'none' : 'inline-block';
    byId('coachWait').style.display = waits ? 'inline' : 'none';

    // Bring the thing Pip points at into view.
    if (step.target !== '') {
        const box = document.querySelector(step.target).getBoundingClientRect();
        if (box.top < 0 || box.bottom > window.innerHeight) {
            document.querySelector(step.target).scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
    if (!waits) {
        byId('coachNext').focus({ preventScroll: true });
    }
}

function nextStep() {
    if (intro.step + 1 < TRAINING_STEPS.length) {
        showStep(intro.step + 1);
    } else {
        finishTraining();
    }
}

// Runs many times per second while the training is on. It keeps the frame on
// the thing Pip points at and checks if the player has done the step.
function watchTraining() {
    if (!intro.training) {
        return;
    }
    const step = TRAINING_STEPS[intro.step];
    placeCoach(step);
    if (step.done !== undefined && step.done()) {
        nextStep();
    }
    requestAnimationFrame(watchTraining);
}

function placeCoach(step) {
    const ring = byId('coachRing');
    const coach = byId('coach');
    let box = null;

    // While the cards are being played the whole page is bright, so the player sees what happens.
    if (step.target !== '' && !busy) {
        box = document.querySelector(step.target).getBoundingClientRect();
        ring.style.left = (box.left - 8) + 'px';
        ring.style.top = (box.top - 8) + 'px';
        ring.style.width = (box.width + 16) + 'px';
        ring.style.height = (box.height + 16) + 'px';
    }
    ring.classList.toggle('active', box !== null);

    if (window.innerWidth > 860) {
        // Wide screens: Pip sits in the left column, under the plan.
        const side = document.querySelector('.side-panel').getBoundingClientRect();
        coach.style.left = Math.max(10, side.left) + 'px';
        coach.style.width = Math.max(320, side.width) + 'px';
        coach.style.top = 'auto';
        coach.style.bottom = '20px';
    } else {
        // Small screens: Pip sits at the bottom, or at the top when the target is low.
        coach.style.left = '10px';
        coach.style.width = (window.innerWidth - 20) + 'px';
        const targetIsLow = box !== null && (box.top + box.bottom) / 2 > window.innerHeight * 0.5;
        coach.style.top = targetIsLow ? '10px' : 'auto';
        coach.style.bottom = targetIsLow ? 'auto' : '10px';
    }
}

function stopTraining() {
    intro.training = false;
    byId('coach').classList.remove('active');
    byId('coachRing').classList.remove('active');
    remember('trained', 'yes');
    renderLanding();
}

function finishTraining() {
    stopTraining();
    byId('gradName').textContent = intro.callsign;
    byId('gradPopup').classList.add('active');
    byId('gradStart').focus();
}

function skipTraining() {
    stopTraining();
    startNewMission();
}

// During the training the player can only click what the step allows.
// A click anywhere else is stopped here, and Pip shakes its head.
function guardClick(event) {
    if (!intro.training) {
        return;
    }
    if (event.target.closest('#coach') !== null) {
        return;
    }
    const allow = TRAINING_STEPS[intro.step].allow;
    if (allow !== '' && event.target.closest(allow) !== null) {
        return;
    }
    event.stopPropagation();
    event.preventDefault();
    playAnimation(byId('coach'), 'nudge');
    playSound('nope');
}

// ---------- Setting up (runs once) ----------

function setUpIntro() {
    setUpSound();
    drawLogo();
    drawGround();
    addStars();
    drawPip('landingPip');
    drawPip('coachPip');
    drawPip('gradPip');
    drawPip('factsPip');        // Pip also tells the facts on the game screen

    // The call sign from the last visit, or a new one.
    intro.callsign = recall('callsign');
    if (intro.callsign === null) {
        intro.callsign = '';
        rollCallsign();
    }
    byId('callsignName').textContent = intro.callsign;
    showPipLine();
    renderLanding();

    byId('callsignRoll').addEventListener('click', rollCallsign);
    byId('startbutton').addEventListener('click', onLaunchClick);
    byId('altStartButton').addEventListener('click', onAltStartClick);
    byId('airlock').addEventListener('click', finishLaunch);

    // Pip hovers and the landing module lands. Pip says a new line every few seconds.
    startScene();
    setInterval(nextPipLine, 5000);

    // The training
    document.addEventListener('click', guardClick, true);
    byId('coachNext').addEventListener('click', nextStep);
    byId('coachSkip').addEventListener('click', skipTraining);
    byId('gradStart').addEventListener('click', function () {
        byId('gradPopup').classList.remove('active');
        startNewMission();
    });
}

setUpIntro();
