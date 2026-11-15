// ============================================================
// test-game.js - plays many missions without the page.
// It checks that the rules never break and shows how each play style does.
// Run from the SolbySol folder:   node tools/test-game.js 1000
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the game files the same way the browser does (as plain scripts).
const files = ['data.js', 'radiationData.js', 'game.js'];
for (let i = 0; i < files.length; i++) {
    const file = path.join(__dirname, '..', 'js', files[i]);
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

// ---------- Play styles ----------
// A play style is a function that plays the cards of one turn.
// The test ends the turn afterwards.

const RESERVE = 20;     // power a careful player keeps for life support and shelter

function tryPlay(cardId) {
    return whyCannotPlay(cardId) === '' && playCard(cardId);
}

function totalPower() {
    return game.power + game.backup;
}

function stormIsNear() {
    return game.event.id === 'flareWarning' || game.event.id === 'solarStorm';
}

// A storm turn that is strong enough to be worth the shelter.
function needsShelter() {
    return game.event.id === 'solarStorm' && game.event.dose >= 4;
}

// A careful player. "habit" changes one thing to test what happens.
function careful(habit) {
    return function () {
        if (habit === 'crank every turn') {
            tryPlay('crank');
        }
        if (habit !== 'never shelter' && needsShelter() && game.effects.shelterTurns === 0) {
            tryPlay('shelter');
        }
        if (habit !== 'never eat') {
            while (game.health < 65 && tryPlay('greenhouse')) {
                // keep eating until the crew is fine or the power runs out
            }
        }
        // Emergency: life support is about to fail.
        if (totalPower() < CONFIG.lifeSupportCost) {
            tryPlay('crank');
        }
        if (habit === 'explore every turn' && !stormIsNear() && totalPower() >= CARDS.explore.cost + RESERVE) {
            tryPlay('explore');
        }
        if (habit !== 'never research') {
            while (totalPower() >= CARDS.research.cost + RESERVE && tryPlay('research')) {
                // keep researching while there is spare power
            }
        }
        if (habit !== 'never charge' && game.power >= game.stats.batteryMax - 10) {
            tryPlay('chargeBackup');
        }
    };
}

const STYLES = {
    'careful': careful(''),
    'never charge': careful('never charge'),
    'never shelter': careful('never shelter'),
    'never eat': careful('never eat'),
    'never research': careful('never research'),
    'explore every turn': careful('explore every turn'),
    'crank every turn': careful('crank every turn'),
    'research only': function () {
        while (tryPlay('research')) {
            // spend everything on research
        }
    },
    'random': function () {
        const ids = Object.keys(CARDS);
        const plays = Math.floor(Math.random() * 4);
        for (let i = 0; i < plays; i++) {
            tryPlay(ids[Math.floor(Math.random() * ids.length)]);
        }
    }
};

// ---------- Checks ----------

let problems = 0;

function check(condition, message) {
    if (!condition) {
        problems++;
        if (problems <= 10) {
            console.log('PROBLEM: ' + message + ' (seed ' + game.seed + ', sol ' + game.sol + ', turn ' + game.turn + ')');
        }
    }
}

function checkState() {
    const numbers = [game.power, game.backup, game.health, game.dose, game.science];
    for (let i = 0; i < numbers.length; i++) {
        check(typeof numbers[i] === 'number' && !isNaN(numbers[i]), 'a meter is not a number');
    }
    check(game.power >= 0 && game.power <= game.stats.batteryMax, 'power out of range: ' + game.power);
    check(game.backup >= 0 && game.backup <= CONFIG.backupMax, 'backup out of range: ' + game.backup);
    check(game.health <= game.stats.healthMax, 'health above the maximum: ' + game.health);
    check(game.dose >= 0, 'dose below zero');
    check(game.science >= 0, 'science below zero');
    check(game.sol >= 1 && game.sol <= CONFIG.sols, 'sol out of range');
}

// Plays one whole mission and returns the finished game.
function playMission(seed, style, callEarthToo) {
    startMission(seed);
    check(game.schedule.length === CONFIG.sols * CONFIG.turnsPerSol, 'the schedule does not have 50 events');
    let steps = 0;

    while (game.phase !== 'ended') {
        steps++;
        if (steps > 500) {
            check(false, 'the mission never ends');
            break;
        }
        if (game.phase === 'choose') {
            if (callEarthToo && whyCannotCallEarth() === '' && totalPower() >= 40) {
                callEarth(EARTH_TOPICS[steps % EARTH_TOPICS.length].id);
            }
            style();
            // A card played once must be refused the second time in the same turn.
            if (game.phase === 'choose' && game.usedThisTurn.crank === true) {
                check(playCard('crank') === false, 'the hand crank worked twice in one turn');
            }
            if (game.phase === 'choose') {
                check(endTurn(), 'the turn could not be ended');
            }
        } else if (game.phase === 'solReport') {
            check(closeSolReport(), 'the sol report could not be closed');
        } else if (game.phase === 'upgrade') {
            check(game.upgradeOffer.length === 3, 'the upgrade offer does not have 3 items');
            check(pickUpgrade(steps % 3), 'the upgrade could not be picked');
        }
        checkState();
    }

    check(game.result !== null, 'the mission ended without a result');
    check(getDebrief().length <= 3, 'the debrief has more than 3 lines');
    return game;
}

// ---------- Run ----------

const missions = Number(process.argv[2]) || 500;
const table = [];

for (const name in STYLES) {
    let success = 0;
    let survived = 0;
    let evacuated = 0;
    let discoveries = 0;
    let dose = 0;
    let lastSol = 0;

    for (let seed = 1; seed <= missions; seed++) {
        const finished = playMission(seed, STYLES[name], seed % 2 === 0);
        if (finished.result === 'success') {
            success++;
        } else if (finished.result === 'survived') {
            survived++;
        } else {
            evacuated++;
        }
        discoveries += finished.discoveries;
        dose += finished.dose;
        lastSol += finished.sol;
    }

    table.push({
        'play style': name,
        'success %': Math.round((100 * success) / missions),
        'safe, no goal %': Math.round((100 * survived) / missions),
        'home early %': Math.round((100 * evacuated) / missions),
        'discoveries': (discoveries / missions).toFixed(1),
        'final dose': Math.round(dose / missions),
        'last sol': (lastSol / missions).toFixed(1)
    });
}

// The same seed must always give the same mission.
startMission(777);
const firstSchedule = JSON.stringify(game.schedule);
startMission(777);
check(firstSchedule === JSON.stringify(game.schedule), 'the same seed gave a different mission');

console.table(table);
if (problems === 0) {
    console.log('All rule checks passed (' + missions + ' missions per play style).');
} else {
    console.log(problems + ' problems found.');
    process.exitCode = 1;
}
