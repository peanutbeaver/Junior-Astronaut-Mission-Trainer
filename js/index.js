// index.js - the page code.
// It handles clicks and draws the "game" object on the page.
// The rules are in game.js. The numbers and texts are in data.js.
//
// How a turn works on the page:
//   1. The player clicks cards. They go into "plan" (nothing is played yet).
//   2. The player clicks End turn. The cards in "plan" are played one by one,
//      with a short pause and an animation for each.
//   3. Then the turn ends and the next event appears.

const CARD_IDS = ['research', 'chargeBackup', 'greenhouse', 'shelter', 'explore', 'crank'];
const POPUP_IDS = ['sourcesPopup', 'earthPopup', 'solReportPopup', 'upgradePopup', 'endPopup', 'menuPopup'];
const CARD_DELAY = 700;         // milliseconds between two cards being played

// When a meter starts to flash red.
const LOW_HEALTH = 30;          // health at or below this
const LOW_POWER = 15;           // power plus backup at or below this
const HIGH_DOSE = 75;           // radiation at or above this

const startscreen = document.querySelector('.startscreen');
const gamescreen = document.querySelector('.gamescreen');

let plan = [];                  // ids of the cards picked for this turn, in order
let playedFromPlan = 0;         // how many cards of the plan have been played so far
let busy = false;               // true while the picked cards are being played
let shownSceneImage = 'assets/game_day1.png';
let shownMeters = null;         // the meter values drawn last time, to spot changes

function byId(id) {
    return document.querySelector("#" +id);
}

function showStartScreen() {
    hidePopups();
    gamescreen.classList.remove('active');
    startscreen.classList.add('active');
}

function showGameScreen() {
    startscreen.classList.remove('active');
    gamescreen.classList.add('active');
}

function showPopup(popupId) {
    hidePopups();
    byId(popupId).classList.add('active');
}

function hidePopups() {
    for (let i = 0; i < POPUP_IDS.length; i++) {
        byId(POPUP_IDS[i]).classList.remove('active');
    }
}

// Starts a CSS animation on an element. It can be started again and again.
function playAnimation(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;       // makes the browser forget the old animation
    element.classList.add(className);
}

// Shows a short message that floats up over the picture of the base.
function showToast(text) {
    if (text === '') {
        return;
    }
    setIconText(byId('toast'), text);
    playAnimation(byId('toast'), 'show');
}

// Sets how full a bar is.
function setBar(fillId, value, max) {
    let percent = (value / max) * 100;
    if (percent < 0) {
        percent = 0;
    }
    if (percent > 100) {
        percent = 100;
    }
    byId(fillId).style.width = percent + '%';
}

// Replaces the content of a <ul> with one <li> per line.
function fillList(listId, lines) {
    const list = byId(listId);
    list.innerHTML = '';
    for (let i = 0; i < lines.length; i++) {
        const item = document.createElement('li');
        setIconText(item, lines[i]);
        list.appendChild(item);
    }
}

// Adds a fact with its source to a <ul>.
function addFact(list, text, fact, source) {
    const item = document.createElement('li');
    if (text !== '') {
        const main = document.createElement('div');
        main.textContent = text;
        item.appendChild(main);
    }
    const factLine = document.createElement('div');
    factLine.className = 'fact';
    factLine.textContent = 'Real fact: ' + fact;
    item.appendChild(factLine);
    const sourceLine = document.createElement('div');
    sourceLine.className = 'source';
    sourceLine.textContent = 'Source: ' + source;
    item.appendChild(sourceLine);
    list.appendChild(item);
}

// Shows +5 or -5.
function signed(number) {
    const rounded = Math.round(number);
    if (rounded > 0) {
        return '+' + rounded;
    }
    return '' + rounded;
}

// "Extreme", "Strong", "Fading" or "Weak", from how many times normal the radiation is.
function getStormWord(multiple) {
    for (let i = 0; i < STORM_WORDS.length; i++) {
        if (multiple >= STORM_WORDS[i].from) {
            return STORM_WORDS[i].word;
        }
    }
    return '';
}

function countInPlan(cardId) {
    let count = 0;
    for (let i = 0; i < plan.length; i++) {
        if (plan[i] === cardId) {
            count++;
        }
    }
    return count;
}

// The power that is left after every picked card is paid.
// Returns -1 when the cards cannot be paid in this order.
function getPlanPower() {
    let left = game.power + game.backup;
    for (let i = playedFromPlan; i < plan.length; i++) {
        if (left < CARDS[plan[i]].cost) {
            return -1;
        }
        left -= CARDS[plan[i]].cost;
        if (plan[i] === 'crank') {
            left += CONFIG.crankPower;
        }
    }
    return left;
}

// Returns '' when one more of this card can be picked, or the reason why not.
function whyCannotPick(cardId) {
    if (busy) {
        return 'Your cards are being played...';
    }
    const blocked = whyCardBlocked(cardId);
    if (blocked !== '') {
        return blocked;
    }
    if (CARDS[cardId].oncePerTurn && countInPlan(cardId) > 0) {
        return 'Only once per turn.';
    }
    if (getPlanPower() < CARDS[cardId].cost) {
        return 'Not enough power.';
    }
    return '';
}

function pickCard(cardId) {
    if (busy) {
        return;
    }
    // Clicking a once-per-turn card again takes it back.
    if (CARDS[cardId].oncePerTurn && countInPlan(cardId) > 0) {
        unpickCard(cardId);
        return;
    }
    if (whyCannotPick(cardId) !== '') {
        playAnimation(byId(cardId), 'refused');
        playSound('nope');
        return;
    }
    plan.push(cardId);
    playSound('pick');
    render();
    playAnimation(byId(cardId), 'picked');
}

// Takes the last picked copy of a card out of the plan.
function unpickCard(cardId) {
    if (busy) {
        return;
    }
    const index = plan.lastIndexOf(cardId);
    if (index !== -1) {
        plan.splice(index, 1);
        playSound('unpick');
        trimPlan();
        render();
    }
}

// Drops cards from the end of the plan until the rest can be paid.
function trimPlan() {
    while (plan.length > 0 && getPlanPower() < 0) {
        plan.pop();
    }
}

function clearPlan() {
    if (!busy) {
        plan = [];
        render();
    }
}

function onEndTurnClick() {
    if (busy || game.phase !== 'choose') {
        return;
    }
    busy = true;
    playedFromPlan = 0;
    playNextCard();
}

function playNextCard() {
    if (playedFromPlan >= plan.length || game.phase !== 'choose') {
        finishTurnOnPage();
        return;
    }
    const cardId = plan[playedFromPlan];
    const newsBefore = game.cardNews.length;
    const played = playCard(cardId);
    playedFromPlan++;
    render();
    if (played) {
        playAnimation(byId(cardId), 'played');
        playSound('play');
        showToast(game.cardNews.slice(newsBefore).join(' '));
    }
    setTimeout(playNextCard, CARD_DELAY);
}

function finishTurnOnPage() {
    plan = [];
    playedFromPlan = 0;
    if (game.phase === 'choose') {
        endTurn();
    }
    busy = false;
    render();
    playAnimation(byId('eventBox'), 'appear');
    if (game.phase === 'choose') {
        playSound('turn');
    }
}

function startNewMission() {
    const seed = Date.now() % 1000000;
    plan = [];
    playedFromPlan = 0;
    busy = false;
    shownMeters = null;
    startMission(seed);
    hidePopups();
    showGameScreen();
    render();
    playAnimation(byId('eventBox'), 'appear');
    document.documentElement.requestFullscreen();
}

function render() {
    renderTop();
    renderMeters();
    renderScene();
    renderEvent();
    renderCards();
    renderPlan();
    renderPopupForPhase();
}

function renderTop() {
    byId('solText').textContent = 'Sol ' + game.sol + ' / ' + CONFIG.sols;
    byId('turnText').textContent = 'Turn ' + game.turn + ' / ' + CONFIG.turnsPerSol;
    setIconText(byId('timeText'), isNight() ? '[moon] Night' : '[sun] Day');
    gamescreen.classList.toggle('night', isNight());

    // One square for every turn of this sol. The last one is the night.
    const track = byId('turnTrack');
    track.innerHTML = '';
    for (let turn = 1; turn <= CONFIG.turnsPerSol; turn++) {
        const square = document.createElement('span');
        square.className = 'turn-pip';
        if (turn === CONFIG.turnsPerSol) {
            square.className += ' night';
        }
        if (turn < game.turn) {
            square.className += ' done';
        } else if (turn === game.turn) {
            square.className += ' now';
        }
        square.innerHTML = iconHtml(turn === CONFIG.turnsPerSol ? 'moon' : 'sun');
        track.appendChild(square);
    }

    // The ticker shows a real fact. It changes every turn.
    const factKeys = Object.keys(FACTS);
    const fact = FACTS[factKeys[getTurnNumber() % factKeys.length]];
    let ticker = isNight() ? 'Night: the solar panels are asleep' : 'Day: the solar panels are charging';
    ticker += ' • Storm data: ' + getDataLabel();
    ticker += ' • Did you know? ' + fact.text;
    byId('tickerText').textContent = ticker;
}

function renderMeters() {
    const cost = getDiscoveryCost();
    let scienceText = game.science + ' / ' + cost;
    if (game.science >= cost) {
        scienceText += ' - discovery tonight!';
    }
    byId('scienceText').textContent = scienceText;
    setBar('scienceFill', game.science, cost);
    // One star for every discovery of the goal: full when made, empty when still to do.
    let stars = '';
    for (let i = 0; i < Math.max(CONFIG.discoveriesToWin, game.discoveries); i++) {
        stars += i < game.discoveries ? '[science]' : '[starEmpty]';
    }
    setIconText(byId('discoveryText'), 'Discoveries: ' + stars + '  ' + game.discoveries + ' / ' + CONFIG.discoveriesToWin);

    byId('healthText').textContent = Math.max(0, game.health) + ' / ' + game.stats.healthMax;
    setBar('healthFill', game.health, game.stats.healthMax);

    byId('powerText').textContent = game.power + ' / ' + game.stats.batteryMax;
    setBar('powerFill', game.power, game.stats.batteryMax);
    byId('backupText').textContent = 'Backup battery: ' + game.backup + ' / ' + CONFIG.backupMax;

    let doseText = Math.round(game.dose) + ' / ' + CONFIG.doseLimit;
    if (game.dose >= CONFIG.doseLimit) {
        doseText += ' [warning] over the safe limit!';
    }
    setIconText(byId('doseText'), doseText);
    setBar('doseFill', game.dose, CONFIG.doseLimit);

    // A meter that is in trouble flashes red.
    byId('healthStat').classList.toggle('danger', game.health <= LOW_HEALTH);
    byId('powerStat').classList.toggle('danger', game.power + game.backup <= LOW_POWER);
    byId('doseStat').classList.toggle('danger', game.dose >= HIGH_DOSE);

    // A meter that changed since the last drawing gives a little bounce.
    const now = { science: game.science, health: game.health, power: game.power + game.backup, dose: Math.round(game.dose) };
    if (shownMeters !== null) {
        // Sounds: more science is a ding, less health is an ouch.
        if (now.science > shownMeters.science) {
            playSound('science');
        }
        if (now.health < shownMeters.health) {
            playSound('hurt');
        }
        if (now.science !== shownMeters.science) {
            playAnimation(byId('scienceStat'), 'changed');
        }
        if (now.health !== shownMeters.health) {
            playAnimation(byId('healthStat'), 'changed');
        }
        if (now.power !== shownMeters.power) {
            playAnimation(byId('powerStat'), 'changed');
        }
        if (now.dose !== shownMeters.dose) {
            playAnimation(byId('doseStat'), 'changed');
        }
    }
    shownMeters = now;
}

function renderScene() {
    // Day or night picture. Only change it when needed, so it does not flicker.
    const image = isNight() ? 'assets/game_night1.png' : 'assets/game_day1.png';
    if (image !== shownSceneImage) {
        byId('sceneImage').src = image;
        shownSceneImage = image;
        playAnimation(byId('sceneImage'), 'fade-in');
    }

    // Storm and dust effects on top of the picture.
    let effect = 'scene-effect';
    // if (game.event.id === 'solarStorm') {
    //     effect += ' storm';
    // } else if (game.effects.dustTurns > 0) {
    //     effect += ' dust';
    // }
    if (game.event.id == 'solarStorm') {
        effect += ' storm';
    }
    if (game.effects.dustTurns > 0) {
        effect += ' dust';
    }

    byId('sceneEffect').className = effect;
    byId('dustLayer').classList.toggle('fierce', game.event.id === 'solarStorm');


    // Small labels for everything that is active right now.
    const badges = [];
    if (game.effects.shelterTurns > 0) {
        badges.push('[shelter] In shelter: ' + turnsText(game.effects.shelterTurns));
    }
    if (game.effects.dustTurns > 0) {
        badges.push('[dust] Dust: ' + turnsText(game.effects.dustTurns));
    }
    for (const cardId in game.effects.locked) {
        if (game.effects.locked[cardId] > 0) {
            badges.push('[fault] ' + CARDS[cardId].name + ' broken');
        }
    }
    if (game.effects.sparePart) {
        badges.push('[crate] Spare part ready');
    }
    if (game.effects.researchBoost) {
        badges.push('[science] Science tip ready');
    }
    if (game.earth.pending !== null) {
        badges.push('[time] Waiting for Earth');
    }
    if (game.earth.forecast !== null) {
        badges.push('[telescope] Next turn: ' + getEventInfo(game.earth.forecast.eventId).name);
    }

    const box = byId('badges');
    box.innerHTML = '';
    for (let i = 0; i < badges.length; i++) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        setIconText(badge, badges[i]);
        box.appendChild(badge);
    }
}

function renderEvent() {
    const event = game.event;
    const info = getEventInfo(event.id);
    const isDanger = event.id === 'flareWarning' || event.id === 'solarStorm';

    let name = info.name;
    let text = info.text;
    if (event.id === 'solarStorm') {
        name = getStormWord(event.multiple) + ' solar storm';
        text += ' Radiation is ' + event.multiple + ' times normal.';
    }
    byId('eventIcon').innerHTML = iconHtml(info.icon);
    byId('eventName').textContent = name;
    byId('eventText').textContent = text;

    // Events from the real data show where they come from.
    let label = '';
    if (event.label !== undefined) {
        label = event.label;
        if (event.date !== '') {
            label += ' · ' + event.date;
        }
    }
    byId('eventLabel').textContent = label;

    byId('eventBox').classList.toggle('danger', isDanger);
    fillList('eventNews', game.eventNews);
    renderNews();
}

// The news box is a log that stays on the page. While you choose, it shows what
// happened last turn. When you press End turn it is cleared and fills up with
// the new results as the cards are played. Then the new turn replaces it again.
function renderNews() {
    if (busy) {
        byId('cardNewsTitle').textContent = 'This turn: your cards';
        byId('turnNewsTitle').textContent = 'This turn: how it ends';
        fillList('cardNews', game.cardNews.length > 0 ? game.cardNews : ['Playing your cards...']);
        fillList('turnNews', []);
        return;
    }
    byId('cardNewsTitle').textContent = 'Last turn: your cards';
    byId('turnNewsTitle').textContent = 'Last turn: how it ended';
    if (getTurnNumber() === 0) {
        fillList('cardNews', ['Nothing has happened yet. Pick your cards and end the turn.']);
        fillList('turnNews', []);
        return;
    }
    fillList('cardNews', game.lastCardNews.length > 0 ? game.lastCardNews : ['No cards were played.']);
    fillList('turnNews', game.turnNews);
}

// The cost and gain line of a card, for example "[power] -15   [science] +10" (icons, see js/icons.js).
function getCardCostText(cardId) {
    const cost = CARDS[cardId].cost;
    if (cardId === 'research') {
        let gain = game.stats.researchScience;
        if (game.effects.researchBoost) {
            gain = Math.round(gain * CONFIG.scienceTipMultiplier);
        }
        if (game.effects.shelterTurns > 0) {
            gain = Math.max(1, Math.round(gain * CONFIG.shelterResearchMultiplier));
            return '[power] -' + cost + '   [science] +' + gain + ' (slow in shelter)';
        }
        return '[power] -' + cost + '   [science] +' + gain;
    }
    if (cardId === 'chargeBackup') {
        return '[power] -' + cost + '   [backup] +' + CONFIG.chargeBackupGain;
    }
    if (cardId === 'greenhouse') {
        return '[power] -' + cost + '   [health] +' + game.stats.greenhouseHeal;
    }
    if (cardId === 'shelter') {
        return '[power] -' + cost + '   [shelter] ' + CONFIG.shelterTurns + ' safe turns';
    }
    if (cardId === 'explore') {
        let prize = '[prize] ?';
        if (isScanValid()) {
            for (let i = 0; i < EXPLORE_RESULTS.length; i++) {
                if (EXPLORE_RESULTS[i].id === game.nextExplore) {
                    prize = '[prize] ' + EXPLORE_RESULTS[i].name;
                }
            }
        }
        return '[power] -' + cost + '   [radiation] +' + CONFIG.doseOutside + '   ' + prize;
    }
    return '[power] +' + CONFIG.crankPower + '   [health] -' + CONFIG.crankHealthCost + '   [warning] last resort';
}

function renderCards() {
    for (let i = 0; i < CARD_IDS.length; i++) {
        const cardId = CARD_IDS[i];
        const element = byId(cardId);
        const reason = whyCannotPick(cardId);
        const count = countInPlan(cardId);

        element.querySelector('.card-name').textContent = CARDS[cardId].name;
        setIconText(element.querySelector('.card-cost'), getCardCostText(cardId));
        setIconText(element.querySelector('.card-note'), reason === '' ? CARDS[cardId].text : 'Not now: ' + reason);

        // Picked cards are highlighted and show how many times they were picked.
        element.classList.toggle('selected', count > 0);
        element.classList.toggle('disabled', reason !== '' && count === 0);
        element.querySelector('.card-count').textContent = count > 0 ? '×' + count : '';
        element.querySelector('.card-minus').style.display = (count > 0 && !busy) ? 'block' : 'none';
    }

    // The Call Earth button.
    let earthReason = whyCannotCallEarth();
    if (earthReason === '' && busy) {
        earthReason = 'Your cards are being played...';
    }
    if (earthReason === '' && getPlanPower() < CONFIG.callEarthCost) {
        earthReason = 'Your picked cards use all the power.';
    }
    setIconText(byId('earthCost'), '[power] -' + CONFIG.callEarthCost + '   [time] answer in 1-2 turns');
    byId('callEarth').classList.toggle('disabled', earthReason !== '');
    byId('earthNote').textContent = earthReason === '' ? 'Ask Mission Control for help.' : 'Not now: ' + earthReason;
}

// The list of picked cards and the End turn button.
function renderPlan() {
    const list = byId('planList');
    list.innerHTML = '';
    for (let i = 0; i < plan.length; i++) {
        const chip = document.createElement('span');
        chip.className = 'plan-chip';
        if (i < playedFromPlan) {
            chip.className += ' done';
        }
        chip.textContent = (i + 1) + '. ' + CARDS[plan[i]].name;
        list.appendChild(chip);
    }
    if (plan.length === 0) {
        list.textContent = 'No cards picked. Click a card to pick it.';
    }

    const left = getPlanPower();
    let powerText = '[power] Power after your cards: ' + Math.max(0, left);
    if (left < CONFIG.lifeSupportCost) {
        powerText += '   [warning] Life support needs ' + CONFIG.lifeSupportCost + '!';
    }
    setIconText(byId('planPower'), powerText);
    byId('planPower').classList.toggle('warn', left < CONFIG.lifeSupportCost);
    byId('clearPlanButton').style.display = (plan.length > 0 && !busy) ? 'inline-block' : 'none';

    const button = byId('endTurnButton');
    // The button glows when cards are picked and waiting to be played.
    button.classList.toggle('ready', plan.length > 0 && !busy);
    if (busy) {
        button.textContent = 'Playing your cards...';
    } else if (plan.length === 0) {
        button.textContent = 'End turn →';
    } else if (plan.length === 1) {
        button.textContent = 'Play 1 card and end turn →';
    } else {
        button.textContent = 'Play ' + plan.length + ' cards and end turn →';
    }
    button.disabled = busy || game.phase !== 'choose';
}

const dustLayer = byId('dustLayer');

for (let i = 0; i < 50; i++) {
    const dust = document.createElement('span');
    dust.classList.add('dust');

    dust.style.top  = Math.random() * 100 + "%";
    dust.style.left = (Math.random() * 100 - 20) + "%";
    dust.style.animationDuration = (0.8 + Math.random() * 1.7) + "s";   

    dust.style.animationDelay = (-Math.random() * 6) + "s";
    dust.style.width = (10 + Math.random() * 30) + "px";

    dustLayer.appendChild(dust);
}

function renderPopupForPhase() {
    if (game.phase === 'solReport') {
        fillSolReport();
        showPopup('solReportPopup');
    } else if (game.phase === 'upgrade') {
        fillUpgradeChoices();
        showPopup('upgradePopup');
        playSound('fanfare');
    } else if (game.phase === 'ended') {
        fillEndPopup();
        showPopup('endPopup');
        playSound(game.result === 'evacuated' ? 'sad' : 'fanfare');
    }
}

function fillSolReport() {
    const report = game.solReport;
    byId('reportTitle').textContent = 'Sol ' + report.sol + ' report';

    const lines = [];
    lines.push('[health] Health today: ' + signed(report.healthChange));
    lines.push('[power] Power today: ' + signed(report.powerChange));
    lines.push('[radiation] Radiation today: ' + signed(report.doseChange));
    lines.push('[science] Science earned: ' + signed(report.scienceEarned));
    if (report.meals === 0) {
        lines.push('[health] Nobody ate fresh food today. Hunger cost ' + CONFIG.hungerPerSol + ' health.');
    } else {
        lines.push('[health] The crew ate, but still got hungry: -' + CONFIG.hungerPerSol + ' health.');
    }
    if (report.leak > 0) {
        lines.push('[backup] The backup battery leaked ' + report.leak + ' power.');
    }
    if (report.discovery) {
        lines.push('[science] You made a discovery! Pick an upgrade next.');
    } else {
        lines.push('[science] Science for the next discovery: ' + game.science + ' / ' + getDiscoveryCost());
    }
    fillList('reportList', lines);

    if (report.stormTomorrow) {
        setIconText(byId('reportForecast'), '[warning] Forecast: the Sun is active. A solar storm may hit tomorrow. (' + getDataLabel() + ')');
    } else {
        setIconText(byId('reportForecast'), '[sun] Forecast: no solar storm tomorrow. (' + getDataLabel() + ')');
    }
}

function fillUpgradeChoices() {
    const box = byId('upgradeChoices');
    box.innerHTML = '';
    for (let i = 0; i < game.upgradeOffer.length; i++) {
        const upgrade = game.upgradeOffer[i];
        let effect = '+' + upgrade.value + ' ' + upgrade.text;
        if (upgrade.id === 'walls') {
            effect = upgrade.value + upgrade.text;
        }

        const button = document.createElement('button');
        button.className = 'choice ' + upgrade.rarity;
        button.textContent = upgrade.name + ' (' + upgrade.rarityName + '): ' + effect;
        button.addEventListener('click', function () {
            pickUpgrade(i);
            hidePopups();
            render();
            playAnimation(byId('eventBox'), 'appear');
        });
        box.appendChild(button);
    }
}

// The names behind the storm data, for example "Daniel Matthia, NASA DONKI.
function getSourceNames() {
    const sources = (STORM_DATA.meta !== undefined && Array.isArray(STORM_DATA.meta.sources)) ? STORM_DATA.meta.sources : [];
    const names = [];
    for (let i = 0; i < sources.length; i++) {
        names.push(sources[i].authors !== undefined ? sources[i].authors : sources[i].name);
    }
    return names.join('; ');
}

function fillEndPopup() {
    if (game.result === 'success') {
        byId('endTitle').textContent = 'Mission success!';
        byId('endText').textContent = 'The crew is safe and made ' + game.discoveries + ' discoveries. Amazing work!';
    } else if (game.result === 'survived') {
        byId('endTitle').textContent = 'The crew is safe!';
        byId('endText').textContent = 'You survived all 10 sols. The science goal needs ' + CONFIG.discoveriesToWin + ' discoveries. You made ' + game.discoveries + '.';
    } else {
        byId('endTitle').textContent = 'The crew flies home early';
        byId('endText').textContent = 'Everyone is safe. You kept the base going until sol ' + game.sol + '. Try again!';
    }

    setIconText(byId('endStats'), 'Sol ' + game.sol + ' / ' + CONFIG.sols
        + '   [science] ' + game.discoveries + ' discoveries'
        + '   [radiation] ' + Math.round(game.dose) + ' / ' + CONFIG.doseLimit
        + '   [health] ' + Math.max(0, game.health));

    // The real story behind the storm, once the player has seen it.
    const story = byId('endStory');
    if (game.sawStorm) {
        story.textContent = STORM_STORY
            .replace('{title}', STORM_DATA.meta.title)
            .replace('{multiple}', getPeakMultiple())
            .replace('{source}', getSourceNames());
        story.style.display = 'block';
    } else {
        story.style.display = 'none';
    }

    const debrief = getDebrief();
    const list = byId('endDebrief');
    list.innerHTML = '';
    for (let i = 0; i < debrief.length; i++) {
        addFact(list, debrief[i].text, debrief[i].fact, debrief[i].source);
    }
    byId('endDebriefTitle').style.display = debrief.length > 0 ? 'block' : 'none';
}

function fillSources() {
    const meta = STORM_DATA.meta !== undefined ? STORM_DATA.meta : {};
    byId('sourcesData').textContent = 'Storm data: ' + getDataLabel() + ' (saved real data, not live). ' + (meta.title !== undefined ? meta.title + '.' : '');

    // Where the storm data comes from, with links.
    const sources = Array.isArray(meta.sources) ? meta.sources : [];
    const list = byId('dataSources');
    for (let i = 0; i < sources.length; i++) {
        const item = document.createElement('li');
        const url = String(sources[i].url);
        if (url.indexOf('https://') === 0 || url.indexOf('http://') === 0) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = sources[i].name;
            item.appendChild(link);
        } else {
            item.textContent = sources[i].name;
        }
        if (sources[i].authors !== undefined) {
            const authors = document.createElement('div');
            authors.className = 'source';
            authors.textContent = sources[i].authors;
            item.appendChild(authors);
        }
        list.appendChild(item);
    }

    // How the game simplifies the real data.
    const notes = [];
    for (let i = 0; i < DATA_NOTES.length; i++) {
        notes.push(DATA_NOTES[i].replace('{scale}', CONFIG.stormDoseScale));
    }
    if (meta.doseNote !== undefined) {
        notes.push(meta.doseNote);
    }
    fillList('dataNotes', notes);

    for (const key in FACTS) {
        addFact(byId('sourcesList'), '', FACTS[key].text, FACTS[key].source);
    }
}

function showRandomFact() {
    const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
    byId('factTitle').textContent = fact.title;
    byId('factText').textContent = fact.fact;
    playAnimation(byId('facts'), 'appear');
}

function setUpPage() {
    fillStaticIcons();      // the icons written into index.html (js/icons.js)
    // Start screen. The Launch button and the training are set up in intro.js.
    byId('sourcesbutton').addEventListener('click', function () {
        showPopup('sourcesPopup');
    });

    // Sources popup
    fillSources();
    byId('sourcesClose').addEventListener('click', hidePopups);

    // The six cards. Each card gets a counter ("x2") and a minus button.
    for (let i = 0; i < CARD_IDS.length; i++) {
        const cardId = CARD_IDS[i];
        const element = byId(cardId);

        const count = document.createElement('div');
        count.className = 'card-count';
        element.appendChild(count);

        const minus = document.createElement('button');
        minus.className = 'card-minus';
        minus.textContent = '-';
        minus.title = 'Take back one ' + CARDS[cardId].name;
        minus.addEventListener('click', function (event) {
            event.stopPropagation();    // do not also pick the card
            unpickCard(cardId);
        });
        element.appendChild(minus);

        element.addEventListener('click', function () {
            pickCard(cardId);
        });
    }

    // The plan and the End turn button
    byId('clearPlanButton').addEventListener('click', clearPlan);
    byId('endTurnButton').addEventListener('click', onEndTurnClick);

    // Call Earth
    byId('callEarth').addEventListener('click', function () {
        if (!busy && whyCannotCallEarth() === '' && getPlanPower() >= CONFIG.callEarthCost) {
            showPopup('earthPopup');
        }
    });
    byId('earthClose').addEventListener('click', hidePopups);
    for (let i = 0; i < EARTH_TOPICS.length; i++) {
        const topic = EARTH_TOPICS[i];
        const button = document.createElement('button');
        button.className = 'choice';
        button.textContent = topic.name + ': ' + topic.text;
        button.addEventListener('click', function () {
            callEarth(topic.id);
            trimPlan();
            hidePopups();
            render();
            showToast('[time] Message sent to Earth!');
        });
        byId('earthTopics').appendChild(button);
    }

    // Sol report
    byId('reportClose').addEventListener('click', function () {
        closeSolReport();
        hidePopups();
        render();
        playAnimation(byId('eventBox'), 'appear');
    });

    // End screen
    byId('newMissionButton').addEventListener('click', startNewMission);
    byId('endMenuButton').addEventListener('click', showStartScreen);

    // Menu (pause)
    byId('menubutton').addEventListener('click', function () {
        if (!busy) {
            showPopup('menuPopup');
        }
    });
    byId('menuResume').addEventListener('click', hidePopups);
    // No rules to read: "Train with Pip again" replays the training (startTraining() in intro.js).
    byId('menuTrain').addEventListener('click', function () {
        hidePopups();
        startTraining();
    });
    byId('menuRestart').addEventListener('click', startNewMission);
    byId('menuQuit').addEventListener('click', showStartScreen);

    // Load the night picture early, so the first night appears without a gap.
    const nightPicture = new Image();
    nightPicture.src = 'assets/game_night1.png';

    // Fun facts
    byId('randomFactBtn').addEventListener('click', showRandomFact);
    showRandomFact();
}

setUpPage();
