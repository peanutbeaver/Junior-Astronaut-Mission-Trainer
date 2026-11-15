// radiationData.js - the real storm data used by the game.
// Everything after "const STORM_DATA =" is the teammate's JSON, pasted as it is.
//
// HOW TO UPDATE IT
// Replace everything between "const STORM_DATA =" and the last ";" with the new JSON.
// Keep the same keys. The game reads:
//   meta.dataType, meta.sources     the ARCHIVED label and the Sources page
//   meta.doseNote, meta.timeNote    notes shown on the Sources page
//   baseline.doseRate               the normal dose rate (1 game radiation point per turn)
//   game.days                       "ragnarok" days get the storm; "events" become Sun news
//   prelude.events                  shown on the warning turn
//   timeline                        the dose rate of each storm step
//   events                          title and kidText of every event
//   facts                           shown when their storm step is reached

const STORM_DATA = {
  "meta": {
    "title": "Solar storm of September 2017 on Mars",
    "dataType": "archived",
    "doseUnit": "mGy/day",
    "doseNote": "Values read approximately from Figure 4, panel b (Mars surface, skin, double power law, orange solid line). Checked by eye only: verify against the paper's table.",
    "doseIncludesBackground": null,
    "stepNote": "Steps are about 2 hours apart (1 hour around the peak). Compute each step's length in code from the timestamps. An event is listed on the step whose window [time, next step time) contains it.",
    "timeNote": "DONKI event times come from instruments near Earth. On Mars, particles arrive at a different time; the game uses them as a simplification and should say so.",
    "sources": [
      {
        "id": "paper",
        "name": "The Solar Particle Event on 10–13 September 2017: Spectral Reconstruction and Calculation of the Radiation Exposure in Aviation and Space",
        "authors": "Daniel Matthiä, Matthias M. Meier, Thomas Berger",
        "url": "https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2018SW001921",
        "figure": "Figure 4 (file swe20729-fig-0004), panel b"
      },
      {
        "id": "donki",
        "name": "NASA DONKI (Space Weather Database of Notifications, Knowledge, Information)",
        "url": "https://ccmc.gsfc.nasa.gov/tools/DONKI",
        "accessed": "2026-11-14",
        "note": "Flares, CMEs, SEPs and storms for 2017-09-04 to 2017-09-15; fetched once, archived, not live."
      }
    ]
  },
  "baseline": {
    "doseRate": 0.21,
    "unit": "mGy/day",
    "source": "paper",
    "note": "Normal Mars surface dose rate from the paper. The multiplier is computed in code."
  },
  "game": {
    "totalDays": 10,
    "ragnarokDay": 10,
    "calendarNote": "Game day N = 2017-09-N. This mapping is a game design choice, not data. DONKI was fetched from 2017-09-04, so days 1-3 carry no events.",
    "quietDayNote": "No dose measurement for days 1-9 is used in this file, so quiet days use the baseline dose rate. This is a simplification and should be stated in the game.",
    "days": [
      {
        "day": 1,
        "date": "2017-09-02",
        "type": "quiet",
        "doseRate": "baseline",
        "events": []
      },
      {
        "day": 2,
        "date": "2017-09-03",
        "type": "quiet",
        "doseRate": "baseline",
        "events": []
      },
      {
        "day": 3,
        "date": "2017-09-04",
        "type": "quiet",
        "doseRate": "baseline",
        "events": []
      },
      {
        "day": 4,
        "date": "2017-09-05",
        "type": "quiet",
        "doseRate": "baseline",
        "events": []
      },
      {
        "day": 5,
        "date": "2017-09-06",
        "type": "quiet",
        "doseRate": "baseline",
        "events": []
      },
      {
        "day": 6,
        "date": "2017-09-07",
        "type": "quiet",
        "doseRate": "baseline",
        "events": [
          "x22-flare",
          "x93-flare"
        ]
      },
      {
        "day": 7,
        "date": "2017-09-08",
        "type": "quiet",
        "doseRate": "baseline",
        "events": [
          "x13-flare",
          "storm-sep7"
        ]
      },
      {
        "day": 8,
        "date": "2017-09-09",
        "type": "quiet",
        "doseRate": "baseline",
        "events": [
          "storm-sep8"
        ]
      },
      {
        "day": 9,
        "date": "2017-09-10",
        "type": "ragnarok",
        "doseRate": "timeline",
        "events": [],
        "prelude": true
      },
      {
        "day": 10,
        "date": "2017-09-11",
        "type": "ragnarok",
        "doseRate": "timeline",
        "events": [],
        "prelude": true
      }
    ]
  },
  "prelude": {
    "note": "Before the dose graph begins. Use as the warning phase or a tutorial.",
    "events": [
      "x82-flare",
      "cme-sep10",
      "sep-100mev",
      "sep-10mev"
    ],
    "alert": {
      "time": "2017-09-10T16:41Z",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/13102/1",
      "source": "donki"
    }
  },
  "timeline": [
    {
      "id": 1,
      "time": "2017-09-10T17:00Z",
      "doseRate": 0.62,
      "approx": true,
      "events": []
    },
    {
      "id": 2,
      "time": "2017-09-10T18:00Z",
      "doseRate": 1.08,
      "approx": true,
      "events": []
    },
    {
      "id": 3,
      "time": "2017-09-10T20:00Z",
      "doseRate": 1,
      "approx": true,
      "events": [
        "sep-soho"
      ]
    },
    {
      "id": 4,
      "time": "2017-09-10T22:00Z",
      "doseRate": 1.2,
      "approx": true,
      "events": []
    },
    {
      "id": 5,
      "time": "2017-09-11T00:00Z",
      "doseRate": 1.28,
      "approx": true,
      "events": []
    },
    {
      "id": 6,
      "time": "2017-09-11T01:00Z",
      "doseRate": 1.41,
      "approx": true,
      "events": [],
      "isPeak": true
    },
    {
      "id": 7,
      "time": "2017-09-11T02:00Z",
      "doseRate": 1.38,
      "approx": true,
      "events": []
    },
    {
      "id": 8,
      "time": "2017-09-11T04:00Z",
      "doseRate": 1,
      "approx": true,
      "events": []
    },
    {
      "id": 9,
      "time": "2017-09-11T06:00Z",
      "doseRate": 0.84,
      "approx": true,
      "events": []
    },
    {
      "id": 10,
      "time": "2017-09-11T08:00Z",
      "doseRate": 0.75,
      "approx": true,
      "events": []
    },
    {
      "id": 11,
      "time": "2017-09-11T10:00Z",
      "doseRate": 0.62,
      "approx": true,
      "events": []
    },
    {
      "id": 12,
      "time": "2017-09-11T12:00Z",
      "doseRate": 0.55,
      "approx": true,
      "events": []
    },
    {
      "id": 13,
      "time": "2017-09-11T14:00Z",
      "doseRate": 0.45,
      "approx": true,
      "events": []
    },
    {
      "id": 14,
      "time": "2017-09-11T16:00Z",
      "doseRate": 0.35,
      "approx": true,
      "events": []
    },
    {
      "id": 15,
      "time": "2017-09-11T18:00Z",
      "doseRate": 0.3,
      "approx": true,
      "events": []
    },
    {
      "id": 16,
      "time": "2017-09-11T20:00Z",
      "doseRate": 0.27,
      "approx": true,
      "events": []
    },
    {
      "id": 17,
      "time": "2017-09-11T22:00Z",
      "doseRate": 0.25,
      "approx": true,
      "events": []
    },
    {
      "id": 18,
      "time": "2017-09-12T00:00Z",
      "doseRate": 0.21,
      "approx": true,
      "events": []
    }
  ],
  "buildup": {
    "note": "Days before the dose graph. Optional intro, tutorial or a 'play another day' mode. No dose data for these days.",
    "events": [
      "x22-flare",
      "x93-flare",
      "x13-flare",
      "storm-sep7",
      "storm-sep8"
    ]
  },
  "aftermath": {
    "events": [
      "storm-sep14"
    ]
  },
  "events": {
    "x22-flare": {
      "title": "Solar flare X2.2",
      "type": "flare",
      "time": "2017-09-06T08:57Z",
      "donkiId": "2017-09-06T08:57:00-FLR-001",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13007/-1",
      "kidText": "The Sun released a strong flare, a burst of light and energy. X is the strongest class of flares."
    },
    "x93-flare": {
      "title": "Solar flare X9.3",
      "type": "flare",
      "time": "2017-09-06T11:53Z",
      "donkiId": "2017-09-06T11:53:00-FLR-001",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13010/-1",
      "kidText": "A very strong flare, class X9.3. The number after the letter tells how strong it is inside the class."
    },
    "x13-flare": {
      "title": "Solar flare X1.3",
      "type": "flare",
      "time": "2017-09-07T14:20Z",
      "donkiId": "2017-09-07T14:20:00-FLR-001",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13043/-1",
      "kidText": "Another X-class flare from the same busy area on the Sun."
    },
    "storm-sep7": {
      "title": "Geomagnetic storm",
      "type": "storm",
      "time": "2017-09-07T21:00Z",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/GST/13054/-1",
      "kidText": "Solar material reached Earth and shook its magnetic field. Earth's magnetic field protects us. Mars has no such global field."
    },
    "storm-sep8": {
      "title": "Geomagnetic storm",
      "type": "storm",
      "time": "2017-09-08T12:00Z",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/GST/13066/-1",
      "kidText": "Earth's magnetic field was shaken again."
    },
    "x82-flare": {
      "title": "Solar flare X8.2",
      "type": "flare",
      "time": "2017-09-10T15:35Z",
      "donkiId": "2017-09-10T15:35:00-FLR-001",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13098/-1",
      "kidText": "A huge flare. Its light is seen first. The dangerous fast particles come later, and that gap is your time to act."
    },
    "cme-sep10": {
      "title": "Coronal mass ejection (CME)",
      "type": "cme",
      "time": "2017-09-10T16:09Z",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/CME/13107/-1",
      "kidText": "A giant cloud of solar material was thrown into space."
    },
    "sep-100mev": {
      "title": "Fast protons arrive (>100 MeV)",
      "type": "sep",
      "time": "2017-09-10T16:25Z",
      "instrument": "GOES13: SEM/EPS >100 MeV",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13101/-1",
      "kidText": "The fastest particles show up first. They are tiny, very fast pieces of atoms that can pass through thin walls."
    },
    "sep-10mev": {
      "title": "More protons arrive (>10 MeV)",
      "type": "sep",
      "time": "2017-09-10T16:45Z",
      "instrument": "GOES13: SEM/EPS >10 MeV",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13104/-1",
      "kidText": "Slower particles follow. More and more radiation is coming."
    },
    "sep-soho": {
      "title": "Particle storm continues",
      "type": "sep",
      "time": "2017-09-10T20:00Z",
      "instrument": "SOHO: COSTEP 15.8-39.8 MeV",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13112/-1",
      "kidText": "Instruments in space still see lots of particles."
    },
    "storm-sep14": {
      "title": "Geomagnetic storm",
      "type": "storm",
      "time": "2017-09-14T15:00Z",
      "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/GST/13150/-1",
      "kidText": "Earth's magnetic field was disturbed once more."
    }
  },
  "facts": [
    {
      "atStep": 1,
      "text": "Dose rate tells how fast your body soaks up radiation, like water filling a bucket.",
      "source": "explanation"
    },
    {
      "atStep": 2,
      "text": "On Mars there is no thick air or global magnetic field to block fast particles from the Sun.",
      "source": "explanation"
    },
    {
      "atStep": 6,
      "text": "This is the peak: the highest dose rate of the storm on the Mars surface.",
      "source": "paper"
    },
    {
      "atStep": 9,
      "text": "Radiation fades slowly, so waiting inside a shelter for a while is worth it.",
      "source": "explanation"
    },
    {
      "atStep": 18,
      "text": "The data in this game is real but archived. It comes from NASA DONKI and a published study of the September 2017 storm.",
      "source": [
        "donki",
        "paper"
      ]
    }
  ]
};
