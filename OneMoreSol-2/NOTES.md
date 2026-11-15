# Sol by Sol - team notes

Short notes on what does what.

## How to run

Double-click `index.html`. No server, no install, no build step.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page: start screen, game screen, and all popups. |
| `css/style.css` | The game screen, the popups and all animations. The colours are named at the top (`--sun`, `--pip`, ...). Sections are marked with `/* ===== ... ===== */`. |
| `js/data.js` | Every number and every text: config, cards, events, upgrades, Call Earth topics, facts, help. |
| `js/radiationData.js` | The real storm data (the teammate's JSON, pasted as it is). |
| `js/game.js` | The rules. Never touches the page; only changes the `game` object. |
| `js/index.js` | The page code. Handles clicks, the card plan, animations, and draws the `game` object. |
| `js/icons.js` | Every little picture: pixel icons drawn from squares (no emojis). `drawSquares()` lives here. |
| `js/sound.js` | All the sounds: made by the browser, plus two recordings in `assets/sounds`. `playSound('name')`. |
| `js/intro.js` | The start screen, the launch countdown and the training with Pip the robot. |
| `css/intro.css` | The styling for everything in `intro.js`. Loaded after `style.css`. |
| `tools/test-game.js` | Plays thousands of missions without the page and checks the rules. |

The scripts load in this order: `data.js`, `radiationData.js`, `game.js`, `icons.js`, `sound.js`, `index.js`, `intro.js`.

## How one turn works

1. `startTurn()` delivers a waiting answer from Earth, then applies this turn's event.
2. The player clicks cards. They only go into the **plan** (`plan` in `index.js`). Nothing is played yet.
   The minus button on a card takes one copy back. Explore and Hand crank can be picked once per turn.
3. The player may click Call Earth: `callEarth(topicId)`. This happens right away.
4. The player clicks End turn. `index.js` plays the plan one card at a time with `playCard(cardId)`,
   with a short pause and an animation for each card.
5. Then `endTurn()` adds solar power, pays life support, adds radiation and counts timers down.
6. After turn 5, `endSol()` applies hunger, the backup leak and the discovery check.
7. The page shows the sol report (`closeSolReport()`), then the upgrade choice (`pickUpgrade(index)`).

After every change, `index.js` calls `render()`, which redraws everything from the `game` object.
`game.phase` says what the page should show: `choose`, `solReport`, `upgrade` or `ended`.

## The start screen and the training

There is no rules page on the start screen. New players press Launch and play a training:
four real turns of the game, with Pip the robot pointing at one thing at a time.

- The training is a normal mission. Only its first four events are fixed (`TRAINING_EVENTS`
  in `js/intro.js`): quiet turn, spoiled food, flare warning, solar storm.
- Each step is one entry in `TRAINING_STEPS`: what Pip points at (`target`), what the player
  may click (`allow`), what Pip says (`text`) and what Pip waits for (`done`).
  A step without `done` gets a Next button.
- While the training runs, clicks on anything else are stopped in `guardClick()`.
- After the training the real mission starts with `startNewMission()`. Nothing carries over.
- The browser remembers the call sign and that the training was done (`localStorage`).
  Players who are trained go straight to Mars; "Train with Pip again" replays it.
- The title, Pip and the Mars hills are drawn from little squares in `intro.js`
  (`drawLogo()`, `drawPip()`, `drawGround()`), so they need no picture files.
- The pause menu has "Train with Pip again" instead of a rules list. `HELP_LINES` in `js/data.js` is no longer used.

### Pip hovers and the landing module lands

The scene on the start screen follows two rules of real physics (`js/intro.js`):
Mars pulls everything down all the time (`MARS_GRAVITY`), and only a rocket can push back.

- **Pip** (`hoverPip()`) sinks, fires its rockets, climbs, stops them and sinks again.
  A rocket pushes Pip away from its flame, so the push depends on how Pip is turned:
  upright the feet hold it up, upside down the rockets on its head do. Two rockets on
  opposite corners turn Pip. A click on Pip makes it spin (`pokePip()`).
  The numbers are in `HOVER`.
- **The landing module** (`flyLander()`) comes down fast, brakes with its engine and
  touches down slowly. Near the ground the engine blows dust into the air (`addDust()`),
  and after the landing the hot engine smokes. It lands again every time the start
  screen comes back. A click makes it hop (`hopLander()`). The numbers are in `LANDER`.
- The module is drawn from little squares (`LANDER_ROWS`), like Pip.
- With "reduce motion" switched on, Pip stays still and the module already stands on Mars.

### The launch: the airlock

Launch takes the crew into the base the way real astronauts get in: through an airlock
(`launch()` in `js/intro.js`). Outside is the thin air of Mars, so the airlock is filled
with air before the inner door may open.

1. The doors slide shut. Clunk, and the screen shakes.
2. Two big bolts slide across the gap, the lock wheel turns and the lights go red: LOCKED.
3. Air rushes in through four vents. Fast air cools down and makes fog (`addFog()`).
   In under a second the number on the wheel counts from 1.00 down to 0.00, the gauge fills,
   everything rumbles and the air goes whoosh (`air` in `js/sound.js`).
4. The bolts slide back, the wheel turns back, the lights go green.
5. The game screen is put behind the doors, they slide open and "MISSION BEGINS"
   (or "TRAINING BEGINS") floats up.

The steps are classes on `#airlock`: `active`, `shut`, `locked`, `filling`, `ready`, `opening`.
A click on the airlock skips it. With "reduce motion" switched on there is no airlock.
The airlock sits above both screens (`#airlock` in `index.html`), so the game can appear behind it.

| I want to... | Change this |
| --- | --- |
| Change what Pip says in the training | `TRAINING_STEPS` in `js/intro.js` |
| Add or remove a training step | `TRAINING_STEPS` (and `TRAINING_EVENTS` if it needs another turn) |
| Change Pip's lines on the start screen | `PIP_LINES` (and `POKE_LINES` for a click on Pip) in `js/intro.js` |
| Change the call sign words | `CALLSIGN_FIRST` and `CALLSIGN_SECOND` in `js/intro.js` |
| Make the airlock faster or slower | the times in `AIRLOCK` in `js/intro.js` (keep `lockTime` and `countTime` the same as the `0.7s` and `0.9s` in `css/intro.css`) |
| Count other numbers on the wheel | `countFrom` and `countTo` in `AIRLOCK` |
| More or less fog | `fogPerSecond` in `AIRLOCK`, where it comes from: `VENTS` |
| Stronger or softer shakes | `slamShake`, `boltShake` and `rumbleShake` in `AIRLOCK` (pixels) |
| Change the look of the doors or the panel | "The launch: the airlock" in `css/intro.css` |

## Sound

`js/sound.js` makes most sounds in the browser (Web Audio).
Call `playSound('name')`. The sounds are in `SOUNDS`.
Two airlock sounds are real recordings in `assets/sounds` (`RECORDINGS` in `js/sound.js`), both from
OpenGameArt.org: `airlock-air.wav` ("Steam release sounds" by bart, CC0) and `airlock-seal.wav`
("Vacuum/Pressure Seal Opening" by dklon, CC-BY 3.0: dklon must stay credited, see the Sources page).
Both were cut short and made louder. If a file cannot play, a made-up backup sound plays instead.
The satellite-dish button (cyan waves = on, red cross = off) on the start screen and in
the top bar switches sound on and off, and the browser remembers it.

## Icons: no emojis

The game uses no emojis anywhere. Every little picture is pixel art in `js/icons.js`, drawn from
squares like Pip. The colours of all icons are in `ICON_COLORS`.

- In any text the page shows, write an icon as its name in square brackets:
  `'[power] -15   [science] +10'`. `setIconText(element, text)` puts it on the page.
  `fillList()`, `showToast()`, the card costs, badges, reports and Pip's training lines all use it.
- In `index.html`, `<span data-icon="rocket"></span>` becomes that icon (`fillStaticIcons()`).
- Each event in `EVENTS` (`js/data.js`) names its icon: `icon: 'dust'`.
- An unknown icon name draws nothing, so it never breaks the page.
- Icons: power, health, science, starEmpty, radiation, backup, shelter, prize, time, warning, sun,
  moon, calm, dust, cold, fault, food, crate, letter, telescope, dice, rocket, dishOn, dishOff.
- On a yellow background (the Day label, the current turn, yellow buttons) icons are drawn dark.

## The look of the game screen

The game screen uses the same look as the start screen: dark console panels with a hard
shadow, yellow for everything the player can do, cyan for labels and for Pip.

- Change a colour everywhere: the `:root` block at the top of `css/style.css`.
- The six cards are tiles, two in a row (`.cards` in `css/style.css`). Call Earth stays a wide card.
- The squares in the top bar show the turns of the sol. `renderTop()` in `js/index.js` draws them.
- The stars under the science bar are the discoveries. `renderMeters()` draws them.
- A meter flashes red when it is in trouble. The limits are `LOW_HEALTH`, `LOW_POWER`
  and `HIGH_DOSE` at the top of `js/index.js`. They change nothing in the rules.
- At night the game screen gets the class `night` (the Day label turns blue).
- Pip tells the facts in the left column. The facts are still `FUN_FACTS` in `js/data.js`.
- The "Game screen polish" section at the end of `css/style.css` gives each meter its own colour
  (`--meter`), puts the event icon in a round badge, and makes the End turn button glow when cards
  are picked (`ready`) and the plan's power label flash red when life support is short (`warn`).
  Both classes are set in `renderPlan()`.

## Common changes

| I want to... | Change this |
| --- | --- |
| Rebalance a number | `CONFIG` in `js/data.js` |
| Change a card's cost or text | `CARDS` in `js/data.js` |
| Add or change a random event | `EVENTS` in `js/data.js`, and its effect in `applyEventEffect()` in `js/game.js` |
| Change what Explore can find | `EXPLORE_RESULTS` in `js/data.js` |
| Change an upgrade | `UPGRADES` in `js/data.js`, and `pickUpgrade()` in `js/game.js` for a new kind |
| Change a fact or its source | `FACTS` (game facts) or `FUN_FACTS` (facts panel) in `js/data.js` |
| Change the end-screen lines | `DEBRIEF` and `STORM_STORY` in `js/data.js` |
| Make cards play faster or slower | `CARD_DELAY` at the top of `js/index.js` |
| Change an animation | The `@keyframes` at the end of `css/style.css` |

## The real storm data

`js/radiationData.js` holds the JSON of the September 2017 storm. To update it, replace
everything after `const STORM_DATA =` with the new JSON (keep the `;` at the end).

How the game uses it (`addStormToSchedule()` in `js/game.js`):

- **Quiet days with events** (days 6 to 8) get one "News from the Sun" turn that shows each
  event's title and `kidText`. Nothing happens to the base.
- **Storm days** (`"type": "ragnarok"`, days 9 and 10): the first two turns are normal, turn 3 is
  the flare warning (it shows the `prelude` events), and the 7 turns after that are the storm.
- Each storm turn stands for the same amount of real time. Its strength is the average `doseRate`
  of the timeline in that time, divided by `baseline.doseRate` ("4.5 times normal").
- Game radiation for a storm turn = (times normal - 1) x `CONFIG.stormDoseScale`.
- `facts` and timeline `events` are shown on the storm turn that contains their step.
- If the data has no storm days or no timeline, the game still runs, just without a storm.

Simplifications, also listed on the game's Sources page (`DATA_NOTES` in `js/data.js`):

- The storm is 6 times stronger than the real one (`stormDoseScale`), so it matters in 10 sols.
- Days without a storm use the normal radiation level.
- Event times were measured near Earth, not at Mars.
- The game gives one whole turn of warning; the real warning was under one hour.
- The last sol also gets a dust storm and a cold snap (`LAST_SOL_EXTRAS`). These are game events, not data.

Things to check in the JSON itself:

- `calendarNote` says "Game day N = 2017-09-N", but the `date` of each day is one day later
  (day 1 is 2017-09-02). The events on days 6 to 8 follow the note, the storm days follow the dates.
  The game never shows a day's `date`; it shows each event's own time.
- `doseNote` says the dose values were read from a figure by eye and still need checking.

## Merged from the team's latest version (nasaChallenge.zip)

- Page title "SOL by SOL".
- The "Interesting Facts" panel with the Random Fact button and its 10 facts (`FUN_FACTS`).
- The pictures `game_day.png` and `game_night.png` (the same pictures as before, renamed).
  The old `game.png` and `night_background.png` were deleted.

## Testing

```
node tools/test-game.js 1000
```

It plays 1000 missions for each play style and checks that no meter breaks. Run it after
every balance change. Last result with the current numbers:

| Play style | Success | Safe, goal missed | Home early |
| --- | --- | --- | --- |
| Careful | 100% | 0% | 0% |
| Never shelter | 28% | 0% | 72% |
| Never eat | 20% | 0% | 80% |
| Never research | 0% | 100% | 0% |
| Explore every turn | 0% | 0% | 100% |
| Hand crank every turn | 76% | 8% | 16% |
| Research only | 0% | 0% | 100% |
| Random cards | 0% | 1% | 99% |

The careful style is a script that never makes a mistake, so real players will win less often.
Explore and Hand crank are meant for emergencies: using them every turn is clearly worse.

## Rules changed from the PDF

- **Many cards per turn.** The PDF says one card per turn. Now the player picks as many cards
  as the power allows and then presses End turn.
- **Explore is high risk, high reward.** It costs 15 power and 5 radiation, once per turn.
  Three results are jackpots (+30 science, +30 health, +40 backup power), one is nothing,
  two are bad (-25 health, +15 radiation). Exploring during the storm adds the storm dose too.
- **Hand crank is a last resort.** Once per turn, +15 power for -18 health.
- **One real storm instead of several sample storms.** Radiation storms only happen on the
  storm days of the data (sols 9 and 10). The May 2024 storm from the PDF is no longer used.

## Numbers changed from the PDF

| Number | PDF | Now |
| --- | --- | --- |
| Solar power per day turn | 25 | 22 |
| Hunger per sol | 10 | 12 |
| First discovery cost | 20 | 25 |
| Extra cost per discovery | 5 | 10 |
| Storm dose | 6 / 12 / 20 / 30 by strength | from the real data, 1 to 30 per turn |
| Health lost per turn over the radiation limit | 10 | 25 |
| Health lost when life support has no power | 10 | 20 |
| Hand crank | +20 power, -6 health | +15 power, -18 health |
| Explore | 10 power, +3 radiation | 15 power, +5 radiation |

## Known and not done

- The PDF and the online design doc still describe the old rules.
- Radiation only matters near the end, because the real data has one storm. Before sol 9 the
  radiation meter rises slowly and Take shelter is not needed.
- Charge backup rarely matters: never charging wins as often as charging.
- Random clicking always loses, around sol 5, because Explore and Hand crank punish it.
- The facts in `FACTS` and `FUN_FACTS` have not been checked against sources.
- Read-aloud and the AI-art credits are not built.
