# One More Sol

**Junior Astronaut Mission Trainer.** A browser game for ages 7 to 12: keep a Mars base alive for ten sols, and survive a solar storm that really happened.

**Play it now at [onemoresol.earth](https://onemoresol.earth).**

A sol is one day on Mars. It lasts 24 hours and 39 minutes.

## The mission

Sending people to Mars is not mainly a rocket problem. It is a staying-alive problem. A crew on Mars has to manage three things at once:

- **Power.** Mars gets less than half the sunlight Earth gets, dust storms block the panels, and nights are freezing.
- **Food and health.** Nothing arrives quickly from Earth, so the crew has to grow what it eats.
- **Radiation.** Mars has no global magnetic field. When the Sun flares, the only protection is thick walls.

These ideas are hard to explain to a child and easy to forget after reading them. We wanted children to understand them by having to deal with them.

## Our solution

One More Sol puts the player in command of the base. Every turn they have a little power and several things they would like to do with it. They cannot do everything, so they have to plan.

The danger in the game is real. On sol 9 the Sun flares and the base is hit by the solar storm of September 2017, replayed from NASA space weather records and published measurements of the radiation on the surface of Mars. Players who saved power for the shelter get through it. Players who did not find out why astronauts hide behind thick walls.

There is no rules page. A small robot called Pip teaches the game inside the first four turns, one action at a time, so children learn by playing.

## How to run it

You can access it by going to [onemoresol.earth](https://onemoresol.earth)

To run it from the files instead:

1. Download or unzip the whole folder.
2. Open `index.html` in a browser.

There is nothing to install, no account, and no internet is needed. It works in Chrome, Edge, Firefox and Safari, on computers and phones.

## How the game works

### The goal

Survive 10 sols and make 5 discoveries.

A mission can end in three ways:

| Ending | What happened |
| --- | --- |
| Mission success | The crew lasted 10 sols and made 5 discoveries. |
| The crew is safe | The crew lasted 10 sols but made fewer than 5 discoveries. |
| The crew flies home early | Health reached zero. Nobody dies: the mission is called off and everyone goes home. |

### One turn

A sol has 5 turns. The first four are day, the fifth is night. A mission is 50 turns.

1. **An event happens.** A dust storm, a cold night, broken equipment, a supply box, a message from Earth, or a quiet turn.
2. **The player picks cards.** As many as the power in the battery allows. Nothing is played yet, and cards can be taken back.
3. **The player ends the turn.** The picked cards are played one by one.
4. **The base runs.** Solar panels add power (day only), life support uses power, and radiation goes up a little.

At the end of each sol the crew gets hungry, the backup battery leaks a little, and a sol report shows what changed.

### The three meters

| Meter | Starts at | What changes it | What goes wrong |
| --- | --- | --- | --- |
| Health | 100 | Hunger takes 12 every sol. The greenhouse gives health back. | At zero the mission ends early. |
| Power | 60 of 100 | Solar panels add 22 each day turn. Life support takes 5 every turn. Cards cost power. | With no power for life support, the crew loses 20 health. |
| Radiation | 0 of 100 | Rises by 1 each turn, and much faster in the storm. It never goes down. | At 100 or more, the crew loses 25 health every turn. |

A backup battery holds up to 60 extra power. It is used when the main battery is empty, and it leaks 6 every sol.

### The six cards

| Card | Costs | Gives | Notes |
| --- | --- | --- | --- |
| Research | 15 power | 10 science | Only half as much while in the shelter. |
| Greenhouse | 20 power | 20 health | |
| Charge backup | 30 power | 24 backup power | Saves power for the night or the storm. |
| Take shelter | 15 power | 3 safe turns | Blocks three quarters of the radiation. Once per turn. |
| Explore | 15 power, 5 radiation | A surprise | Day only, once per turn. Can find a meteorite, supplies or a battery, or end in a fall or getting lost. |
| Hand crank | 18 health | 15 power | Once per turn. A last resort: it costs more than it gives. |

### Events

| Event | Effect |
| --- | --- |
| Dust storm | Solar panels make less than half their power for 3 turns. |
| Clear sky | Solar panels make half as much again this turn. |
| Cold snap (night) | The heaters use 10 extra power. |
| Equipment fault | One card is broken for 2 turns. |
| Spoiled food | The crew loses 10 health. |
| Supplies found | A small gift of health, power or science. |
| Message from Earth | 5 science. |

### Science, discoveries and upgrades

Research adds science. When the science bar is full at the end of a sol, the crew makes a discovery and the player picks one of three upgrades for the base: a better lab, bigger solar panels, a bigger battery, a richer greenhouse, a med bay or thicker walls. Upgrades come in three strengths (common, rare and epic).

The first discovery needs 25 science, and each one after that needs 10 more.

### Call Earth

For 5 power the player can ask Mission Control one question: what the next event will be, what Explore will find, help with repairs, or a science tip. The answer arrives one or two turns later, because a radio message really does take 3 to 22 minutes to travel between Earth and Mars.

### The solar storm

- **Sols 6 to 8:** "News from the Sun" turns show the real flares that led up to the storm. Nothing happens to the base yet.
- **Sol 9, turn 3:** a flare warning. The storm arrives on the next turn.
- **The next 7 turns:** the storm. Each turn has the strength the real storm had at that point, from weak to extreme and fading again.
- **Sol 10:** the storm is still going, and the last sol also brings a dust storm and a cold night.

A player in the shelter takes a quarter of the radiation. A player caught outside can go over the safe limit in a few turns.

After the mission, the end screen tells the player that the storm was real, and explains the three decisions that mattered most in their game, each with a real fact and its source.

## How children learn it

New players press Launch, walk through an airlock into the base, and play a short training:

1. Pip highlights one thing on the screen and says one or two short sentences.
2. Pip waits until the player has done it. Everything else is locked until then.
3. The four training turns cover the whole game: do research, feed the crew, shelter from a storm, then choose freely.
4. The player earns a Junior Astronaut badge and the real mission starts from the beginning.

The browser remembers that the training was done, so returning players go straight to Mars. The training can be replayed from the start screen.

## How it is built

Plain HTML, CSS and JavaScript. No framework, no build step, no server.

| File | What it does |
| --- | --- |
| `index.html` | The page: start screen, airlock, game screen and popups. |
| `js/data.js` | Every number and every text. Change values here to rebalance the game. |
| `js/radiationData.js` | The real storm data. |
| `js/game.js` | The rules. It never touches the page. |
| `js/index.js` | The page code: clicks, the card plan, drawing the game. |
| `js/intro.js` | The start screen, the airlock and the training with Pip. |
| `js/icons.js` | The pixel icons, drawn from squares. |
| `js/sound.js` | The sounds, made by the browser. |
| `css/style.css`, `css/intro.css` | All styling and animation. |
| `tools/test-game.js` | Plays thousands of missions without the page to check the balance. |

Because the rules are separate from the page, the test script can play the game on its own:

```bash
node tools/test-game.js 1000
```

It plays 1000 missions for each of several play styles and checks that the rules never break. With the current numbers a careful player wins every time, a player who never shelters wins about 28% of the time, and a player who clicks at random almost never wins.

The start screen is a small physics scene. Pip hovers and a landing module comes down, and both follow the same two rules: Mars pulls everything down all the time, and only a rocket can push back.

## Where the data comes from

| Source | Used for |
| --- | --- |
| [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI) (Space Weather Database of Notifications, Knowledge, Information) | The flares, eruptions and particle events of 4 to 15 September 2017. |
| Matthiä, Meier and Berger, [The Solar Particle Event on 10–13 September 2017](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2018SW001921) | The radiation dose rate on the surface of Mars during the storm, and the normal level. |
| NASA Mars facts, the Curiosity rover (RAD instrument), the Opportunity rover, the Veggie plant experiment | The facts shown during the game and on the end screen. |
| Hassler et al., Science (2013) | The everyday radiation level measured by Curiosity. |

The Sources page inside the game lists all of these with links.

## Important notices

**The game simplifies the real storm, and says that.**

- The storm is 6 times stronger in the game than it was in reality, so that it matters in a 10-sol mission.
- The game gives one whole turn of warning. The real warning was under one hour.
- Event times were measured near Earth. On Mars the particles arrived at a slightly different time.
- Days without a storm use the normal radiation level for Mars.
- The dose values were read from a figure in the paper by eye. They are approximate.
- The dust storm and cold night on the last sol are game events, not data.

**The data is saved, not live.** The storm was fetched once and stored in the game, which is why it works offline.

**The facts need a final check.** The facts shown in the game come from the sources named beside them, but they have not all been checked line by line against those sources.

**Sound credits.** Two airlock sounds are recordings from OpenGameArt.org: "Steam release sounds" by bart (CC0) and "Vacuum/Pressure Seal Opening" by dklon (CC-BY 3.0). Both were shortened. All other sounds are made by the game itself.

**Accessibility.** With "reduce motion" switched on in the device settings, the airlock, the hovering robot and the landing are skipped. There is a sound button on every screen. Icons are drawn pixel art, with the meaning also written in words.

**What the browser remembers.** Only three things, stored on the player's own device: the call sign, whether the training was done, and whether sound is on. Nothing is sent anywhere.

**Known limits.**

- Radiation only becomes a real threat near the end, because the real data contains one storm.
- Charging the backup battery rarely decides a mission.
- There is no read-aloud mode yet for children who are still learning to read.

**Copyright © 2026. All rights reserved.**

This project and all associated source code, assets, designs, and documentation are the exclusive intellectual property of the author.

No permission is granted to copy, reproduce, modify, redistribute, publish, or use any part of this project for commercial purposes without prior written authorization from the copyright holder.

Unauthorized use, distribution, or commercial exploitation is prohibited.
