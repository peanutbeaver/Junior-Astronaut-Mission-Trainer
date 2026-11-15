// ============================================================
// data.js - every number and every text of the game.
// Change values here to rebalance. No game logic in this file.
// ============================================================

const CONFIG = {
    // Mission length
    sols: 10,
    turnsPerSol: 5,             // the last turn of each sol is night

    // Power
    startPower: 60,
    batteryMax: 100,
    backupMax: 60,
    backupLeakPerSol: 6,
    solarPerTurn: 22,           // only on day turns
    lifeSupportCost: 5,         // paid every turn
    lifeSupportDamage: 20,      // health lost when life support has no power
    dustSolarMultiplier: 0.4,
    dustTurns: 3,
    clearSkyMultiplier: 1.5,
    coldSnapPower: 10,

    // Health
    startHealth: 100,
    hungerPerSol: 12,

    // Radiation
    doseLimit: 100,
    dosePerTurn: 1,
    doseOutside: 5,             // dose for every trip outside (Explore)
    shelterMultiplier: 0.25,
    shelterTurns: 3,
    shelterResearchMultiplier: 0.5,   // Research gives this share of science while in the shelter
    overLimitDamage: 25,        // health lost each turn at or above the limit

    // The real storm (see radiationData.js)
    stormWarningTurn: 3,        // on the first storm day, the warning comes on this turn
    stormDoseScale: 6,          // game radiation for each "1 times normal" above the normal level.
                                // The real storm is scaled up so it matters in a 10-sol game.

    // Science
    researchScience: 10,
    firstDiscoveryCost: 25,
    discoveryCostStep: 10,       // each discovery costs this much more
    discoveriesToWin: 5,

    // Cards and events
    greenhouseHeal: 20,
    chargeBackupGain: 24,
    crankPower: 15,             // the hand crank is for emergencies only:
    crankHealthCost: 18,        // it costs more health than the power is worth
    faultTurns: 2,
    spoiledFoodDamage: 10,
    earthMessageScience: 5,

    // Call Earth
    callEarthCost: 5,
    scienceTipMultiplier: 1.5
};

// Extra trouble on the last sol, on top of that turn's own event.
const LAST_SOL_EXTRAS = [
    { turn: 1, eventId: 'dustStorm' },
    { turn: 5, eventId: 'coldSnap' }
];

// The six cards. The ids match the ids in index.html.
// The player can play many cards in one turn. "oncePerTurn" cards only once.
const CARDS = {
    research:     { name: 'Research',      cost: 15, outside: false, oncePerTurn: false, text: 'Run an experiment.' },
    chargeBackup: { name: 'Charge backup', cost: 30, outside: false, oncePerTurn: false, text: 'Save power for later.' },
    greenhouse:   { name: 'Greenhouse',    cost: 20, outside: false, oncePerTurn: false, text: 'Grow food and eat it.' },
    shelter:      { name: 'Take shelter',  cost: 15, outside: false, oncePerTurn: true,  text: 'Hide from radiation. ([science] -50%)' },
    explore:      { name: 'Explore',       cost: 15, outside: true,  oncePerTurn: true,  text: 'Risky! Big prize or big trouble.' },
    crank:        { name: 'Hand crank',    cost: 0,  outside: false, oncePerTurn: true,  text: 'Emergency power. It hurts.' }
};

// Random events. "weight" is how often an event shows up.
const EVENTS = [
    { id: 'calm',          name: 'Quiet turn',         icon: 'calm', weight: 34, day: true,  night: true,
      text: 'All is calm on Mars.' },
    { id: 'dustStorm',     name: 'Dust storm',         icon: 'dust', weight: 10, day: true,  night: false,
      text: 'Dust hides the Sun. Solar panels make less power for 3 turns.' },
    { id: 'clearSky',      name: 'Clear sky',          icon: 'sun', weight: 8,  day: true,  night: false,
      text: 'A bright day! The solar panels make extra power this turn.' },
    { id: 'coldSnap',      name: 'Cold snap',          icon: 'cold', weight: 8,  day: false, night: true,
      text: 'A freezing night. The heaters use 10 extra power.' },
    { id: 'fault',         name: 'Equipment fault',    icon: 'fault', weight: 10, day: true,  night: true,
      text: 'Something broke!' },
    { id: 'spoiledFood',   name: 'Spoiled food',       icon: 'food', weight: 8,  day: true,  night: true,
      text: 'Some food went bad. The crew loses 10 health.' },
    { id: 'suppliesFound', name: 'Supplies found',     icon: 'crate', weight: 10, day: true,  night: true,
      text: 'The crew found a forgotten supply box!' },
    { id: 'earthMessage',  name: 'Message from Earth', icon: 'letter', weight: 6,  day: true,  night: true,
      text: 'Kids on Earth sent a great question. You gain 5 science.' }
];

// Events from the real storm data. They are placed from radiationData.js, never drawn at random.
const STORM_EVENTS = [
    { id: 'solarNews',    name: 'News from the Sun',   icon: 'telescope',
      text: 'Scientists near Earth saw this. Your base stays calm today.' },
    { id: 'flareWarning', name: 'Solar flare warning', icon: 'warning',
      text: 'The Sun just flared! Dangerous particles arrive next turn. Save power for the shelter!' },
    { id: 'solarStorm',   name: 'Solar storm',         icon: 'radiation',
      text: 'Solar particles hit Mars. Shelter blocks most of the radiation.' }
];

// The word shown for a storm turn. "from" is how many times normal the radiation is.
const STORM_WORDS = [
    { from: 5, word: 'Extreme' },
    { from: 3, word: 'Strong' },
    { from: 1.5, word: 'Fading' },
    { from: 0, word: 'Weak' }
];

// Shown on the end screen once the storm has started. {title}, {multiple} and {source} come from the data.
const STORM_STORY = 'This storm really happened! {title}. At its peak, radiation on the ground was about {multiple} times higher than normal. Source: {source}.';

// Notes for the Sources page about how the game simplifies the real data.
const DATA_NOTES = [
    'The game makes the storm {scale} times stronger than the real one, so it matters in a 10-sol mission.',
    'Days without a storm use the normal radiation level for Mars.',
    'Event times were measured near Earth. On Mars the particles arrived at a slightly different time.',
    'The game gives one whole turn of warning. The real warning was under one hour.'
];

// What the Explore card can find: high risk, high reward.
// Each result can change science, health, backup power and radiation (dose).
const EXPLORE_RESULTS = [
    { id: 'meteorite',  name: 'Meteorite',       weight: 20, science: 30, health: 0,   backup: 0,  dose: 0,
      text: 'Jackpot! You found a meteorite. +30 science.' },
    { id: 'supplies',   name: 'Supply cache',    weight: 15, science: 0,  health: 30,  backup: 0,  dose: 0,
      text: 'Jackpot! You found a big supply cache. +30 health.' },
    { id: 'battery',    name: 'Lander battery',  weight: 15, science: 0,  health: 0,   backup: 40, dose: 0,
      text: 'Jackpot! An old lander battery still works. +40 backup power.' },
    { id: 'nothing',    name: 'Just rocks',      weight: 15, science: 0,  health: 0,   backup: 0,  dose: 0,
      text: 'Just rocks today. Nothing found.' },
    { id: 'fall',       name: 'A bad fall',      weight: 20, science: 0,  health: -25, backup: 0,  dose: 0,
      text: 'Ouch! A bad fall on sharp rocks. -25 health.' },
    { id: 'lost',       name: 'Lost in the dust', weight: 15, science: 0, health: 0,   backup: 0,  dose: 15,
      text: 'The crew got lost and stayed out too long. +15 radiation.' }
];

// The six items that can be upgraded. "values" = common, rare, epic.
const UPGRADES = [
    { id: 'lab',        name: 'Better lab',        values: [2, 4, 7],    text: 'more science from each Research' },
    { id: 'solar',      name: 'Bigger solar panels', values: [3, 5, 8],  text: 'more power every day turn' },
    { id: 'battery',    name: 'Bigger battery',    values: [15, 25, 40], text: 'more room in the main battery' },
    { id: 'greenhouse', name: 'Richer greenhouse', values: [4, 7, 12],   text: 'more health from each meal' },
    { id: 'medbay',     name: 'Med bay',           values: [10, 15, 25], text: 'more maximum health' },
    { id: 'walls',      name: 'Thicker walls',     values: [8, 12, 20],  text: '% less radiation, always' }
];

const RARITIES = [
    { id: 'common', name: 'Common', weight: 60 },
    { id: 'rare',   name: 'Rare',   weight: 30 },
    { id: 'epic',   name: 'Epic',   weight: 10 }
];

// Questions the player can ask Earth.
const EARTH_TOPICS = [
    { id: 'weather',    name: 'Weather report', text: 'Earth tells you the next event.' },
    { id: 'scan',       name: 'Explore scan',   text: 'Earth tells you what Explore will find.' },
    { id: 'repair',     name: 'Repair help',    text: 'Earth helps you fix broken equipment.' },
    { id: 'scienceTip', name: 'Science tip',    text: 'Your next Research gives 50% more science.' }
];

// Real facts shown in the game. Check each one against its source before the final submission.
const FACTS = {
    magnetic:    { text: 'Earth has a magnetic field that shields it from the Sun. Mars has no global one.',
                   source: 'NASA, Mars facts' },
    shelter:     { text: 'Astronauts on Mars would hide behind thick walls during a solar storm.',
                   source: 'NASA/JPL-Caltech, Curiosity rover (RAD instrument)' },
    dose:        { text: 'Curiosity measured about 0.67 millisieverts of radiation every day on Mars.',
                   source: 'Hassler et al., Science (2013), Curiosity RAD' },
    opportunity: { text: 'The Opportunity rover lost power in a giant Mars dust storm in 2018.',
                   source: 'NASA, Mars Exploration Rover mission' },
    sunlight:    { text: 'Mars gets less than half of the sunlight that Earth gets.',
                   source: 'NASA, Mars facts' },
    lettuce:     { text: 'Astronauts have grown lettuce on the International Space Station and eaten it.',
                   source: 'NASA, Veggie plant growth experiment' },
    delay:       { text: 'A radio message takes 3 to 22 minutes to travel between Earth and Mars.',
                   source: 'NASA, Mars communications' },
    sol:         { text: 'A day on Mars is called a sol. It lasts 24 hours and 39 minutes.',
                   source: 'NASA, Mars facts' },
    wheels:      { text: 'Sharp Mars rocks made holes in the wheels of the Curiosity rover.',
                   source: 'NASA/JPL-Caltech, Curiosity rover' }
};

// Debrief lines for the end screen. {count}, {times} ("once" or "3 times") and {total} are filled in by the game.
// "weight" makes one kind of decision count more or less when the top 3 are picked.
const DEBRIEF = {
    shelteredStorm: { weight: 1,   fact: 'shelter',
                      text: 'Good call! You sheltered for {count} storm turns. That blocked {total} radiation.' },
    openStorm:      { weight: 1.5, fact: 'magnetic',
                      text: 'Storms hit the crew {times} with no shelter. That added {total} radiation.' },
    noPower:        { weight: 2,   fact: 'opportunity',
                      text: 'The base ran out of power {times}. That cost {total} health.' },
    overLimit:      { weight: 2,   fact: 'dose',
                      text: 'Radiation passed the safe limit. That cost {total} health.' },
    crank:          { weight: 1,   fact: 'sunlight',
                      text: 'You cranked the generator {times}. That cost {total} health.' },
    meal:           { weight: 0.5, fact: 'lettuce',
                      text: 'The crew ate {count} greenhouse meals. That gave back {total} health.' },
    accident:       { weight: 1.5, fact: 'wheels',
                      text: 'Exploring went wrong {times}. It cost {total} health and radiation.' },
    earthCall:      { weight: 1,   fact: 'delay',
                      text: 'You called Earth {times} and planned ahead.' }
};

// One step of help text per line, shown in the "How to play" popup.
const HELP_LINES = [
    'Keep your crew safe for 10 sols. A sol is one Mars day.',
    'Every sol has 5 turns. The last turn is night.',
    'Each turn starts with an event. Read it first.',
    'Then pick your cards. Pick as many as your power allows.',
    'Picked the wrong card? Press the minus button to take it back.',
    'Press End turn. Your cards are played one by one.',
    'Explore and Hand crank are risky. Keep them for emergencies.',
    'Watch your 3 meters: Health, Power and Radiation.',
    'Research gives science. Enough science gives you an upgrade.',
    'You can call Earth for help. The answer takes 1 or 2 turns.',
    'When the Sun flares, take shelter before the storm arrives!'
];

// Fun space facts for the "Interesting Facts" panel (from the team's latest version).
const FUN_FACTS = [
    { title: 'The Sun is SUPER hot!',
      fact: 'The Sun is so hot that its surface is about 5,500°C! That\'s hotter than any oven on Earth!' },
    { title: 'Saturn can FLOAT!',
      fact: 'Saturn is so light for its size that it would float in a giant bathtub of water!' },
    { title: 'The Moon has footprints!',
      fact: 'Astronauts left footprints on the Moon in 1969. Because there is almost no wind or rain, those footprints could stay there for millions of years!' },
    { title: 'Space has no sound!',
      fact: 'You cannot hear someone shouting in space because sound needs air to travel, and space is almost completely empty!' },
    { title: 'It might rain diamonds!',
      fact: 'Scientists think that deep inside Neptune and Uranus, extreme pressure could turn carbon into diamonds!' },
    { title: 'Earth is SUPER fast!',
      fact: 'Earth spins so quickly that someone standing at the equator moves at about 1,670 kilometres per hour without even noticing!' },
    { title: 'Astronauts grow taller!',
      fact: 'In space, astronauts can grow up to about 5 centimetres taller because their spines stretch without gravity pressing down on them!' },
    { title: 'There are billions of stars!',
      fact: 'Our Milky Way galaxy contains hundreds of billions of stars. And there are billions of other galaxies in the universe!' },
    { title: 'Mars has the biggest volcano!',
      fact: 'Mars is home to Olympus Mons, the biggest known volcano in our solar system. It is almost three times taller than Mount Everest!' },
    { title: 'NASA has a robot on Mars!',
      fact: 'NASA sent robotic rovers to Mars. They drive around, take pictures, study rocks, and search for clues about whether life could ever have existed there!' }
];
