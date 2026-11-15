// ============================================================
// game.js - the rules of the game.
// This file never touches the page. It only changes the "game" object.
// index.js reads "game" and draws it.
//
// Functions the page calls:
//   startMission(seed)   start a new mission
//   playCard(cardId)     play one card (many cards can be played in one turn)
//   endTurn()            finish the turn: solar power, life support, radiation
//   callEarth(topicId)   ask Earth a question (does not use the turn)
//   closeSolReport()     leave the sol report
//   pickUpgrade(index)   choose 1 of the 3 offered upgrades
// ============================================================

let game = null;

// ---------- Small helpers ----------

// A simple random number maker. The same seed always gives the same mission.
function createRandom(seed) {
    let value = seed % 4294967296;
    return function () {
        value = (value * 1664525 + 1013904223) % 4294967296;
        return value / 4294967296;
    };
}

// A whole number from 0 to max - 1.
function randomInt(max) {
    return Math.floor(game.random() * max);
}

// Picks one item from a list. Items with a bigger "weight" are picked more often.
function pickByWeight(list) {
    let total = 0;
    for (let i = 0; i < list.length; i++) {
        total += list[i].weight;
    }
    let roll = game.random() * total;
    for (let i = 0; i < list.length; i++) {
        roll -= list[i].weight;
        if (roll < 0) {
            return list[i];
        }
    }
    return list[list.length - 1];
}

// Turn number counted over the whole mission: 0 to 49.
function getTurnNumber() {
    return (game.sol - 1) * CONFIG.turnsPerSol + (game.turn - 1);
}

function isNight() {
    return game.turn === CONFIG.turnsPerSol;
}

function getDiscoveryCost() {
    return CONFIG.firstDiscoveryCost + CONFIG.discoveryCostStep * game.discoveries;
}

// Finds the name, icon and text of an event.
function getEventInfo(eventId) {
    for (let i = 0; i < EVENTS.length; i++) {
        if (EVENTS[i].id === eventId) {
            return EVENTS[i];
        }
    }
    for (let i = 0; i < STORM_EVENTS.length; i++) {
        if (STORM_EVENTS[i].id === eventId) {
            return STORM_EVENTS[i];
        }
    }
    return null;
}

// Writes "1 turn" or "3 turns".
function turnsText(count) {
    return count === 1 ? '1 turn' : count + ' turns';
}

function addLog(type, impact) {
    game.log.push({ sol: game.sol, turn: game.turn, type: type, impact: impact });
}

// ---------- Changing the meters ----------

// Pays power from the main battery first, then from the backup.
// Returns false (and empties both) when there is not enough.
function spendPower(amount) {
    if (game.power + game.backup < amount) {
        game.power = 0;
        game.backup = 0;
        return false;
    }
    if (game.power >= amount) {
        game.power -= amount;
    } else {
        game.backup -= amount - game.power;
        game.power = 0;
    }
    return true;
}

function addPower(amount) {
    game.power = Math.min(game.stats.batteryMax, game.power + amount);
}

function addBackup(amount) {
    game.backup = Math.min(CONFIG.backupMax, game.backup + amount);
}

function addHealth(amount) {
    game.health = Math.min(game.stats.healthMax, game.health + amount);
}

function addDose(amount) {
    game.dose = Math.round((game.dose + amount) * 100) / 100;
}

function addScience(amount) {
    game.science += amount;
    game.scienceThisSol += amount;
}

// ---------- The real storm data (STORM_DATA in radiationData.js) ----------

// 'ARCHIVED' for saved data. 'LIVE' only if the data says it was fetched live.
function getDataLabel() {
    if (STORM_DATA.meta !== undefined && STORM_DATA.meta.dataType === 'live') {
        return 'LIVE';
    }
    return 'ARCHIVED';
}

// "2017-09-10T17:00Z" becomes a number of hours, so times can be compared.
function toHours(time) {
    return Date.parse(time) / 3600000;
}

// The normal dose rate on Mars. 1 game radiation point per turn stands for this.
function getBaselineDoseRate() {
    if (STORM_DATA.baseline !== undefined && STORM_DATA.baseline.doseRate > 0) {
        return STORM_DATA.baseline.doseRate;
    }
    return 1;
}

// The highest dose rate of the storm, as a multiple of normal (for example 6.7).
function getPeakMultiple() {
    const timeline = Array.isArray(STORM_DATA.timeline) ? STORM_DATA.timeline : [];
    let peak = getBaselineDoseRate();
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].doseRate > peak) {
            peak = timeline[i].doseRate;
        }
    }
    return Math.round((peak / getBaselineDoseRate()) * 10) / 10;
}

// The average dose rate between two moments of the storm.
// Each step counts for as long as it lasted (until the next step).
function getAverageDoseRate(fromHour, toHour) {
    const timeline = STORM_DATA.timeline;
    let sum = 0;
    for (let i = 0; i < timeline.length - 1; i++) {
        const start = toHours(timeline[i].time);
        const end = toHours(timeline[i + 1].time);
        const overlap = Math.min(end, toHour) - Math.max(start, fromHour);
        if (overlap > 0) {
            sum += timeline[i].doseRate * overlap;
        }
    }
    return sum / (toHour - fromHour);
}

// Turns a list of event ids into lines like "Solar flare X8.2: A huge flare. ..."
function getEventLines(eventIds) {
    const lines = [];
    if (!Array.isArray(eventIds) || STORM_DATA.events === undefined) {
        return lines;
    }
    for (let i = 0; i < eventIds.length; i++) {
        const event = STORM_DATA.events[eventIds[i]];
        if (event !== undefined) {
            lines.push(event.title + ': ' + event.kidText);
        }
    }
    return lines;
}

// The real date of an event, for example "2017-09-06".
function getEventDate(eventId) {
    if (STORM_DATA.events !== undefined && STORM_DATA.events[eventId] !== undefined) {
        return String(STORM_DATA.events[eventId].time).slice(0, 10);
    }
    return '';
}

// Puts the real data into the schedule:
// - quiet days with events get one "News from the Sun" turn,
// - storm days get a warning turn and then the storm, spread over the turns that are left.
function addStormToSchedule(schedule) {
    const timeline = Array.isArray(STORM_DATA.timeline) ? STORM_DATA.timeline : [];
    const days = (STORM_DATA.game !== undefined && Array.isArray(STORM_DATA.game.days)) ? STORM_DATA.game.days : [];
    const facts = Array.isArray(STORM_DATA.facts) ? STORM_DATA.facts : [];
    const label = getDataLabel();
    const stormSlots = [];      // turn numbers (0 to 49) that belong to storm days

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!(day.day >= 1 && day.day <= CONFIG.sols)) {
            continue;
        }
        const first = (day.day - 1) * CONFIG.turnsPerSol;
        if (day.type === 'ragnarok') {
            for (let turn = 0; turn < CONFIG.turnsPerSol; turn++) {
                stormSlots.push(first + turn);
            }
        } else if (Array.isArray(day.events) && day.events.length > 0) {
            schedule[first + 1] = {
                id: 'solarNews',
                label: label,
                date: getEventDate(day.events[0]),
                lines: getEventLines(day.events)
            };
        }
    }

    // Without storm days or a timeline there is no storm. The game still works.
    if (timeline.length < 2 || stormSlots.length <= CONFIG.stormWarningTurn) {
        return;
    }
    stormSlots.sort(function (a, b) {
        return a - b;
    });

    // The warning turn shows the flare and the first particles.
    const preludeEvents = STORM_DATA.prelude !== undefined ? STORM_DATA.prelude.events : [];
    schedule[stormSlots[CONFIG.stormWarningTurn - 1]] = {
        id: 'flareWarning',
        label: label,
        date: String(timeline[0].time).slice(0, 10),
        lines: getEventLines(preludeEvents)
    };

    // Every storm turn stands for the same amount of real time.
    const stormTurns = stormSlots.slice(CONFIG.stormWarningTurn);
    const startHour = toHours(timeline[0].time);
    const endHour = toHours(timeline[timeline.length - 1].time);
    const hoursPerTurn = (endHour - startHour) / stormTurns.length;

    for (let i = 0; i < stormTurns.length; i++) {
        const from = startHour + i * hoursPerTurn;
        const to = from + hoursPerTurn;
        const isLast = i === stormTurns.length - 1;
        const multiple = getAverageDoseRate(from, to) / getBaselineDoseRate();

        // Events and facts of the steps that fall into this turn.
        let lines = [];
        for (let s = 0; s < timeline.length; s++) {
            const hour = toHours(timeline[s].time);
            if (hour >= from && (hour < to || isLast)) {
                lines = lines.concat(getEventLines(timeline[s].events));
                for (let f = 0; f < facts.length; f++) {
                    if (facts[f].atStep === timeline[s].id) {
                        lines.push(facts[f].text);
                    }
                }
            }
        }

        schedule[stormTurns[i]] = {
            id: 'solarStorm',
            label: label,
            date: new Date(from * 3600000).toISOString().slice(0, 10),
            multiple: Math.round(multiple * 10) / 10,
            // Game radiation for this turn: everything above the normal level, scaled up.
            dose: Math.round(Math.max(0, multiple - 1) * CONFIG.stormDoseScale * 10) / 10,
            lines: lines
        };
    }
}

// ---------- Building the mission ----------

// Chooses the event of all 50 turns before the mission starts.
function buildSchedule() {
    const schedule = [];

    // 1. A random event for every turn.
    for (let sol = 1; sol <= CONFIG.sols; sol++) {
        for (let turn = 1; turn <= CONFIG.turnsPerSol; turn++) {
            const night = turn === CONFIG.turnsPerSol;
            const allowed = [];
            for (let i = 0; i < EVENTS.length; i++) {
                if ((night && EVENTS[i].night) || (!night && EVENTS[i].day)) {
                    allowed.push(EVENTS[i]);
                }
            }
            schedule.push({ id: pickByWeight(allowed).id });
        }
    }

    // 2. The real storm and the real Sun news.
    addStormToSchedule(schedule);

    // 3. Extra trouble on the last sol, on top of whatever that turn already has.
    const last = (CONFIG.sols - 1) * CONFIG.turnsPerSol;
    for (let i = 0; i < LAST_SOL_EXTRAS.length; i++) {
        schedule[last + LAST_SOL_EXTRAS[i].turn - 1].extra = LAST_SOL_EXTRAS[i].eventId;
    }

    return schedule;
}

function startMission(seed) {
    game = {
        seed: seed,
        random: createRandom(seed),

        sol: 1,
        turn: 1,
        phase: 'choose',        // 'choose', 'solReport', 'upgrade' or 'ended'

        power: CONFIG.startPower,
        backup: 0,
        health: CONFIG.startHealth,
        dose: 0,
        science: 0,
        discoveries: 0,

        // Changed only by upgrades
        stats: {
            batteryMax: CONFIG.batteryMax,
            healthMax: CONFIG.startHealth,
            solarPerTurn: CONFIG.solarPerTurn,
            researchScience: CONFIG.researchScience,
            greenhouseHeal: CONFIG.greenhouseHeal,
            doseMultiplier: 1
        },

        // Timers count the turns left. 0 means off.
        effects: {
            shelterTurns: 0,
            dustTurns: 0,
            locked: {},             // for example { research: 2 }
            researchBoost: false,
            sparePart: false
        },

        schedule: [],
        event: null,                // the event of this turn
        nextExplore: '',            // rolled ahead so Earth can scan it

        earth: {
            pending: null,          // { topic, arrivesAt }
            forecast: null,         // { turn, eventId } from a weather report
            scanTurn: -1            // last turn on which the explore scan is valid
        },

        upgrades: [],               // upgrades the player has picked
        upgradeOffer: null,         // 3 upgrades while phase is 'upgrade'
        solReport: null,
        log: [],                    // used for the debrief
        result: null,               // 'success', 'survived' or 'evacuated'
        sawStorm: false,            // true once the real storm has started

        usedThisTurn: {},           // cards played this turn, for example { crank: true }
        eventNews: [],              // extra lines about this turn's event
        cardNews: [],               // lines about the cards played this turn
        lastCardNews: [],           // the same lines, kept for the whole next turn
        turnNews: [],               // lines about the end of the last turn

        // Counters for the sol report
        scienceThisSol: 0,
        mealsThisSol: 0,
        eventsThisSol: [],
        solStart: null
    };

    game.schedule = buildSchedule();
    game.nextExplore = pickByWeight(EXPLORE_RESULTS).id;
    rememberSolStart();
    startTurn();
}

function rememberSolStart() {
    game.solStart = { power: game.power + game.backup, health: game.health, dose: game.dose };
    game.scienceThisSol = 0;
    game.mealsThisSol = 0;
    game.eventsThisSol = [];
}

// ---------- Start of a turn ----------

function startTurn() {
    const now = getTurnNumber();
    game.eventNews = [];
    // Keep what the cards did last turn. The news box shows it for this whole turn.
    game.lastCardNews = game.cardNews;
    game.cardNews = [];
    game.usedThisTurn = {};

    // An old weather report is no longer needed.
    if (game.earth.forecast !== null && game.earth.forecast.turn <= now) {
        game.earth.forecast = null;
    }

    // 1. The answer from Earth arrives.
    if (game.earth.pending !== null && game.earth.pending.arrivesAt <= now) {
        deliverEarthReply(game.earth.pending.topic);
        game.earth.pending = null;
    }

    // 2. This turn's event.
    game.event = game.schedule[now];
    game.eventsThisSol.push(game.event.id);
    applyEvent(game.event);

    if (game.health <= 0) {
        endMission('evacuated');
        return;
    }

    // 3. Wait for the player.
    game.phase = 'choose';
}

function applyEvent(event) {
    applyEventEffect(event.id);

    // Lines from the real data (flare names, kid texts, facts).
    if (Array.isArray(event.lines)) {
        for (let i = 0; i < event.lines.length; i++) {
            game.eventNews.push(event.lines[i]);
        }
    }
    if (event.id === 'solarStorm') {
        game.sawStorm = true;
    }

    // A second event on the same turn (only on the last sol).
    if (event.extra !== undefined) {
        const info = getEventInfo(event.extra);
        game.eventNews.push('Also: ' + info.name + '! ' + info.text);
        applyEventEffect(event.extra);
    }
}

// What an event does right away.
// clearSky, flareWarning, solarStorm and solarNews do nothing here: see endTurn().
function applyEventEffect(eventId) {
    if (eventId === 'dustStorm') {
        game.effects.dustTurns = CONFIG.dustTurns;
    } else if (eventId === 'coldSnap') {
        spendPower(Math.min(CONFIG.coldSnapPower, game.power + game.backup));
    } else if (eventId === 'fault') {
        applyFault();
    } else if (eventId === 'spoiledFood') {
        game.health -= CONFIG.spoiledFoodDamage;
    } else if (eventId === 'suppliesFound') {
        const kind = randomInt(3);
        if (kind === 0) {
            addHealth(15);
            game.eventNews.push('Inside: medicine. +15 health.');
        } else if (kind === 1) {
            addPower(20);
            game.eventNews.push('Inside: a charged battery. +20 power.');
        } else {
            addScience(8);
            game.eventNews.push('Inside: old lab notes. +8 science.');
        }
    } else if (eventId === 'earthMessage') {
        addScience(CONFIG.earthMessageScience);
    }
}

// Breaks one random card for a few turns. The hand crank never breaks.
function applyFault() {
    if (game.effects.sparePart) {
        game.effects.sparePart = false;
        game.eventNews.push('Your spare part fixed it right away!');
        return;
    }
    const canBreak = ['research', 'chargeBackup', 'greenhouse', 'shelter', 'explore'];
    const cardId = canBreak[randomInt(canBreak.length)];
    game.effects.locked[cardId] = CONFIG.faultTurns;
    game.eventNews.push(CARDS[cardId].name + ' is broken for ' + turnsText(CONFIG.faultTurns) + '.');
}

// ---------- Call Earth ----------

// Returns '' when the player can call Earth, or the reason why not.
function whyCannotCallEarth() {
    if (game.phase !== 'choose') {
        return 'Wait for your turn.';
    }
    if (game.earth.pending !== null) {
        return 'Waiting for the answer from Earth...';
    }
    if (game.power + game.backup < CONFIG.callEarthCost) {
        return 'Not enough power.';
    }
    return '';
}

function callEarth(topicId) {
    if (whyCannotCallEarth() !== '') {
        return false;
    }
    spendPower(CONFIG.callEarthCost);
    const delay = 1 + randomInt(2);     // 1 or 2 turns
    game.earth.pending = { topic: topicId, arrivesAt: getTurnNumber() + delay };
    addLog('earthCall', CONFIG.callEarthCost);
    game.cardNews.push('[time] You called Earth. The answer comes in ' + turnsText(delay) + '.');
    return true;
}

function deliverEarthReply(topicId) {
    const now = getTurnNumber();

    if (topicId === 'weather') {
        const next = game.schedule[now + 1];
        if (next === undefined) {
            game.eventNews.push('Earth says: the mission is almost over. Good luck!');
        } else {
            game.earth.forecast = { turn: now + 1, eventId: next.id };
            game.eventNews.push('Earth says: next turn brings "' + getEventInfo(next.id).name + '".');
        }
    } else if (topicId === 'scan') {
        // The scan is valid this turn. At night nobody can explore, so it also lasts the next turn.
        game.earth.scanTurn = isNight() ? now + 1 : now;
        game.eventNews.push('Earth scanned the area. Look at the Explore card!');
    } else if (topicId === 'repair') {
        let fixed = false;
        for (const cardId in game.effects.locked) {
            if (game.effects.locked[cardId] > 0) {
                game.effects.locked[cardId] = 0;
                fixed = true;
            }
        }
        if (fixed) {
            game.eventNews.push('Earth sent repair steps. Everything works again!');
        } else {
            game.effects.sparePart = true;
            game.eventNews.push('Nothing is broken. Earth helped you build a spare part.');
        }
    } else if (topicId === 'scienceTip') {
        game.effects.researchBoost = true;
        game.eventNews.push('Earth sent a science tip. Your next Research is stronger.');
    }
}

function isScanValid() {
    return game.earth.scanTurn !== -1;
}

// ---------- Playing cards ----------
// The player can play as many cards as the power allows, then ends the turn.

// Returns '' when the card is allowed this turn, or the reason why not.
// It does not look at the power: see whyCannotPlay().
function whyCardBlocked(cardId) {
    const card = CARDS[cardId];
    if (game.phase !== 'choose') {
        return 'Wait for your turn.';
    }
    if (game.effects.locked[cardId] > 0) {
        return 'Broken for ' + turnsText(game.effects.locked[cardId]) + ' more.';
    }
    if (cardId === 'shelter' && game.effects.shelterTurns > 0) {
        return 'Already in the shelter for ' + turnsText(game.effects.shelterTurns) + '.';
    }
    if (card.oncePerTurn && game.usedThisTurn[cardId] === true) {
        return 'Only once per turn.';
    }
    if (card.outside && isNight()) {
        return 'Too dark and cold outside.';
    }
    return '';
}

// Returns '' when the card can be played right now, or the reason why not.
function whyCannotPlay(cardId) {
    const blocked = whyCardBlocked(cardId);
    if (blocked !== '') {
        return blocked;
    }
    if (game.power + game.backup < CARDS[cardId].cost) {
        return 'Not enough power.';
    }
    return '';
}

// Plays one card. The turn goes on until endTurn() is called.
function playCard(cardId) {
    if (CARDS[cardId] === undefined || whyCannotPlay(cardId) !== '') {
        return false;
    }
    spendPower(CARDS[cardId].cost);
    game.usedThisTurn[cardId] = true;

    if (cardId === 'research') {
        let gain = game.stats.researchScience;
        if (game.effects.researchBoost) {
            gain = Math.round(gain * CONFIG.scienceTipMultiplier);
            game.effects.researchBoost = false;
        }
        if (game.effects.shelterTurns > 0) {
            gain = Math.max(1, Math.round(gain * CONFIG.shelterResearchMultiplier));
            game.cardNews.push('Working inside the shelter is slow. +' + gain + ' science.');
        } else {
            game.cardNews.push('The experiment worked. +' + gain + ' science.');
        }
        addScience(gain);
    } else if (cardId === 'chargeBackup') {
        addBackup(CONFIG.chargeBackupGain);
        game.cardNews.push('The backup battery is charged. +' + CONFIG.chargeBackupGain + ' backup power.');
    } else if (cardId === 'greenhouse') {
        addHealth(game.stats.greenhouseHeal);
        game.mealsThisSol++;
        addLog('meal', game.stats.greenhouseHeal);
        game.cardNews.push('The crew ate fresh food. +' + game.stats.greenhouseHeal + ' health.');
    } else if (cardId === 'shelter') {
        game.effects.shelterTurns = CONFIG.shelterTurns;
        game.cardNews.push('The crew is in the shelter for ' + turnsText(CONFIG.shelterTurns) + '.');
    } else if (cardId === 'explore') {
        playExplore();
    } else if (cardId === 'crank') {
        addPower(CONFIG.crankPower);
        game.health -= CONFIG.crankHealthCost;
        addLog('crank', CONFIG.crankHealthCost);
        game.cardNews.push('You cranked hard. +' + CONFIG.crankPower + ' power, -' + CONFIG.crankHealthCost + ' health.');
    }

    if (game.health <= 0) {
        endMission('evacuated');
    }
    return true;
}

// The game radiation of this turn's storm (0 when there is no storm).
function getStormDose() {
    if (game.event.id === 'solarStorm') {
        return game.event.dose;
    }
    return 0;
}

// Going outside: radiation right away, then one result from EXPLORE_RESULTS.
function playExplore() {
    game.effects.shelterTurns = 0;      // going outside ends the shelter

    // Outside there are no walls. During a storm the whole storm hits the crew.
    const stormDose = getStormDose();
    const gain = (CONFIG.doseOutside + stormDose) * game.stats.doseMultiplier;
    addDose(gain);
    if (stormDose > 0) {
        addLog('openStorm', gain);
        game.cardNews.push('Outside in a solar storm! +' + Math.round(gain) + ' radiation.');
    }

    // Apply the result. A result can change science, health, backup power and radiation.
    let result = EXPLORE_RESULTS[0];
    for (let i = 0; i < EXPLORE_RESULTS.length; i++) {
        if (EXPLORE_RESULTS[i].id === game.nextExplore) {
            result = EXPLORE_RESULTS[i];
        }
    }
    if (result.science > 0) {
        addScience(result.science);
    }
    if (result.health > 0) {
        addHealth(result.health);
    }
    if (result.health < 0) {
        game.health += result.health;
        addLog('accident', -result.health);
    }
    if (result.backup > 0) {
        addBackup(result.backup);
    }
    if (result.dose > 0) {
        addDose(result.dose * game.stats.doseMultiplier);
        addLog('accident', result.dose);
    }
    game.cardNews.push(result.text);

    // Roll the next result. An old scan from Earth is used up.
    game.nextExplore = pickByWeight(EXPLORE_RESULTS).id;
    game.earth.scanTurn = -1;
}

// ---------- End of a turn ----------

// Called when the player presses "End turn".
function endTurn() {
    if (game.phase !== 'choose') {
        return false;
    }
    const now = getTurnNumber();
    game.turnNews = [];

    // Solar panels (day turns only).
    if (!isNight()) {
        let income = game.stats.solarPerTurn;
        if (game.effects.dustTurns > 0) {
            income = income * CONFIG.dustSolarMultiplier;
        }
        if (game.event.id === 'clearSky') {
            income = income * CONFIG.clearSkyMultiplier;
        }
        income = Math.round(income);
        addPower(income);
        game.turnNews.push('The solar panels made ' + income + ' power.');
    } else {
        game.turnNews.push('Night: the solar panels made no power.');
    }

    // Life support needs power every turn.
    if (!spendPower(CONFIG.lifeSupportCost)) {
        game.health -= CONFIG.lifeSupportDamage;
        addLog('noPower', CONFIG.lifeSupportDamage);
        game.turnNews.push('No power for life support! -' + CONFIG.lifeSupportDamage + ' health.');
    }

    // Radiation: a little every turn, a lot in a storm, less in the shelter.
    const stormDose = getStormDose();
    let gain = (CONFIG.dosePerTurn + stormDose) * game.stats.doseMultiplier;
    if (game.effects.shelterTurns > 0) {
        const blocked = gain * (1 - CONFIG.shelterMultiplier);
        gain = gain - blocked;
        if (stormDose > 0) {
            addLog('shelteredStorm', blocked);
            game.turnNews.push('The shelter blocked ' + Math.round(blocked) + ' radiation.');
        }
    } else if (stormDose > 0) {
        addLog('openStorm', gain);
        game.turnNews.push('The storm hit the crew. +' + Math.round(gain) + ' radiation.');
    }
    addDose(gain);

    if (game.dose >= CONFIG.doseLimit) {
        game.health -= CONFIG.overLimitDamage;
        addLog('overLimit', CONFIG.overLimitDamage);
        game.turnNews.push('Radiation is over the safe limit! -' + CONFIG.overLimitDamage + ' health.');
    }

    // Count the timers down.
    if (game.effects.shelterTurns > 0) {
        game.effects.shelterTurns--;
    }
    if (game.effects.dustTurns > 0) {
        game.effects.dustTurns--;
    }
    for (const cardId in game.effects.locked) {
        if (game.effects.locked[cardId] > 0) {
            game.effects.locked[cardId]--;
        }
    }
    // An old explore scan is out of date: roll a new result.
    if (game.earth.scanTurn !== -1 && game.earth.scanTurn <= now) {
        game.earth.scanTurn = -1;
        game.nextExplore = pickByWeight(EXPLORE_RESULTS).id;
    }

    if (game.health <= 0) {
        endMission('evacuated');
        return true;
    }

    if (game.turn === CONFIG.turnsPerSol) {
        endSol();
    } else {
        game.turn++;
        startTurn();
    }
    return true;
}

// ---------- End of a sol ----------

function endSol() {
    // The crew gets hungry.
    game.health -= CONFIG.hungerPerSol;
    if (game.health <= 0) {
        endMission('evacuated');
        return;
    }

    // The backup battery leaks.
    const leak = Math.min(CONFIG.backupLeakPerSol, game.backup);
    game.backup -= leak;

    // Enough science makes a discovery (at most one per sol).
    let madeDiscovery = false;
    if (game.science >= getDiscoveryCost()) {
        game.science -= getDiscoveryCost();
        game.discoveries++;
        madeDiscovery = true;
    }

    // Is a storm coming tomorrow?
    let stormTomorrow = false;
    const firstTurnTomorrow = game.sol * CONFIG.turnsPerSol;
    for (let i = firstTurnTomorrow; i < firstTurnTomorrow + CONFIG.turnsPerSol && i < game.schedule.length; i++) {
        if (game.schedule[i].id === 'solarStorm' || game.schedule[i].id === 'flareWarning') {
            stormTomorrow = true;
        }
    }

    game.solReport = {
        sol: game.sol,
        powerChange: game.power + game.backup - game.solStart.power,
        healthChange: game.health - game.solStart.health,
        doseChange: Math.round(game.dose - game.solStart.dose),
        scienceEarned: game.scienceThisSol,
        meals: game.mealsThisSol,
        leak: leak,
        events: game.eventsThisSol,
        discovery: madeDiscovery,
        stormTomorrow: stormTomorrow
    };

    if (game.sol === CONFIG.sols) {
        if (game.discoveries >= CONFIG.discoveriesToWin) {
            endMission('success');
        } else {
            endMission('survived');
        }
        return;
    }

    if (madeDiscovery) {
        game.upgradeOffer = makeUpgradeOffer();
    }
    game.phase = 'solReport';
}

function closeSolReport() {
    if (game.phase !== 'solReport') {
        return false;
    }
    if (game.upgradeOffer !== null) {
        game.phase = 'upgrade';
    } else {
        startNextSol();
    }
    return true;
}

function startNextSol() {
    game.sol++;
    game.turn = 1;
    game.solReport = null;
    rememberSolStart();
    startTurn();
}

// ---------- Upgrades ----------

// Offers 3 different items. Each one gets its own rarity.
function makeUpgradeOffer() {
    const items = UPGRADES.slice();     // a copy we can take items out of
    const offer = [];
    for (let i = 0; i < 3; i++) {
        const index = randomInt(items.length);
        const item = items[index];
        items.splice(index, 1);

        const rarity = pickByWeight(RARITIES);
        let value = item.values[0];
        if (rarity.id === 'rare') {
            value = item.values[1];
        } else if (rarity.id === 'epic') {
            value = item.values[2];
        }
        offer.push({ id: item.id, name: item.name, text: item.text, rarity: rarity.id, rarityName: rarity.name, value: value });
    }
    return offer;
}

function pickUpgrade(index) {
    if (game.phase !== 'upgrade' || game.upgradeOffer[index] === undefined) {
        return false;
    }
    const upgrade = game.upgradeOffer[index];

    if (upgrade.id === 'lab') {
        game.stats.researchScience += upgrade.value;
    } else if (upgrade.id === 'solar') {
        game.stats.solarPerTurn += upgrade.value;
    } else if (upgrade.id === 'battery') {
        game.stats.batteryMax += upgrade.value;
    } else if (upgrade.id === 'greenhouse') {
        game.stats.greenhouseHeal += upgrade.value;
    } else if (upgrade.id === 'medbay') {
        game.stats.healthMax += upgrade.value;
        game.health += upgrade.value;
    } else if (upgrade.id === 'walls') {
        game.stats.doseMultiplier = game.stats.doseMultiplier * (1 - upgrade.value / 100);
    }

    game.upgrades.push(upgrade);
    game.upgradeOffer = null;
    startNextSol();
    return true;
}

// ---------- End of the mission ----------

function endMission(result) {
    if (game.health < 0) {
        game.health = 0;
    }
    game.result = result;
    game.phase = 'ended';
}

// Returns up to 3 lines about the decisions that mattered most, each with a real fact.
function getDebrief() {
    const totals = {};
    const counts = {};
    for (let i = 0; i < game.log.length; i++) {
        const entry = game.log[i];
        if (totals[entry.type] === undefined) {
            totals[entry.type] = 0;
            counts[entry.type] = 0;
        }
        totals[entry.type] += entry.impact;
        counts[entry.type]++;
    }

    const list = [];
    for (const type in totals) {
        if (DEBRIEF[type] !== undefined) {
            list.push({ type: type, total: totals[type], count: counts[type], score: totals[type] * DEBRIEF[type].weight });
        }
    }
    list.sort(function (a, b) {
        return b.score - a.score;
    });

    const lines = [];
    for (let i = 0; i < list.length && i < 3; i++) {
        const info = DEBRIEF[list[i].type];
        const times = list[i].count === 1 ? 'once' : list[i].count + ' times';
        const text = info.text.replace('{count}', list[i].count).replace('{times}', times).replace('{total}', Math.round(list[i].total));
        lines.push({ text: text, fact: FACTS[info.fact].text, source: FACTS[info.fact].source });
    }
    return lines;
}
