// ===== Pixel icons =====
//
// The game uses no emojis. Every little picture is drawn from squares, like Pip.
//
// In any text the page shows, write an icon as its name in square brackets:
//     '[power] -15   [science] +10'
// setIconText() puts the text on the page and draws the icons in it.
// In index.html an element with data-icon="name" gets that icon (fillStaticIcons()).
//
// To add an icon: add a list of rows to ICONS. Every letter is one square,
// its colour is in ICON_COLORS, a dot is an empty square.

// ---------- Drawing with little squares ----------

// Turns rows of letters into an SVG picture. Every letter is one square.
// "colors" says which colour a letter is. A dot is an empty square.
// "classes" can give the squares of a letter a CSS class, for animations.
function drawSquares(rows, colors, classes) {
    let svg = '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true">';
    for (let y = 0; y < rows.length; y++) {
        let x = 0;
        while (x < rows[y].length) {
            const letter = rows[y][x];
            // Squares of the same colour next to each other become one long bar.
            let width = 1;
            while (x + width < rows[y].length && rows[y][x + width] === letter) {
                width++;
            }
            if (letter !== '.') {
                svg += '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="1" fill="' + colors[letter] + '"';
                if (classes !== undefined && classes[letter] !== undefined) {
                    svg += ' class="' + classes[letter] + '"';
                }
                svg += '/>';
            }
            x += width;
        }
    }
    return svg + '</svg>';
}

// ---------- The icons ----------

const ICON_COLORS = {
    W: '#f8fafc',   // white
    S: '#cbd5e1',   // light grey
    G: '#94a3b8',   // grey
    d: '#64748b',   // dark grey
    g: '#334155',   // very dark grey
    K: '#0b0b1e',   // black
    Y: '#f0cf4f',   // yellow
    O: '#f97316',   // orange
    R: '#ff5d73',   // red
    B: '#38bdf8',   // cyan
    N: '#4ade80',   // green
    M: '#a16207',   // wood
    m: '#713f12',   // dark wood
    A: '#c2410c'    // Mars dust
};

const ICONS = {
    // ----- The meters -----
    power: [            // a lightning bolt
        '......YY.',
        '.....YY..',
        '....YY...',
        '...YYYYY.',
        '..YYYYY..',
        '....YY...',
        '...YY....',
        '..YY.....',
        '..Y......'
    ],
    health: [           // a heart
        '.RR...RR.',
        'RRRR.RRRR',
        'RWRRRRRRR',
        'RRRRRRRRR',
        '.RRRRRRR.',
        '..RRRRR..',
        '...RRR...',
        '....R....',
        '.........'
    ],
    science: [          // a star
        '....Y....',
        '....Y....',
        '...YYY...',
        'YYYYYYYYY',
        '.YYYYYYY.',
        '..YYYYY..',
        '..YYYYY..',
        '.YY...YY.',
        '.Y.....Y.'
    ],
    starEmpty: [        // a star still to win
        '....d....',
        '....d....',
        '...d.d...',
        'dddd.dddd',
        '.d.....d.',
        '..d...d..',
        '..d.d.d..',
        '.dd...dd.',
        '.d.....d.'
    ],
    radiation: [        // the radiation sign
        '.........',
        '.OOO.OOO.',
        '.OOO.OOO.',
        '..OO.OO..',
        '....O....',
        '.........',
        '...OOO...',
        '...OOO...',
        '..OOOOO..'
    ],
    backup: [           // a battery
        '...GGG...',
        '..GGGGG..',
        '..GNNNG..',
        '..GNNNG..',
        '..GNNNG..',
        '..GNNNG..',
        '..GNNNG..',
        '..GGGGG..',
        '.........'
    ],
    shelter: [          // a shield
        '.BBBBBBB.',
        '.BWWBBBB.',
        '.BWBBBBB.',
        '.BBBBBBB.',
        '.BBBBBBB.',
        '..BBBBB..',
        '..BBBBB..',
        '...BBB...',
        '....B....'
    ],
    prize: [            // a present
        '..Y...Y..',
        '...Y.Y...',
        '.RRRYRRR.',
        '.YYYYYYY.',
        '..RRYRR..',
        '..RRYRR..',
        '..RRYRR..',
        '..RRYRR..',
        '.........'
    ],
    time: [             // an hourglass
        '.GGGGGGG.',
        '..W...W..',
        '..WYYYW..',
        '...WYW...',
        '....W....',
        '...W.W...',
        '..W.Y.W..',
        '..WYYYW..',
        '.GGGGGGG.'
    ],
    warning: [          // a warning triangle
        '....Y....',
        '...YYY...',
        '...YKY...',
        '..YYKYY..',
        '..YYKYY..',
        '.YYYYYYY.',
        '.YYYKYYY.',
        'YYYYYYYYY',
        '.........'
    ],

    // ----- Day and night -----
    sun: [
        '....Y....',
        '.Y.....Y.',
        '...YYY...',
        '..YYYYY..',
        'Y.YYYYY.Y',
        '..YYYYY..',
        '...YYY...',
        '.Y.....Y.',
        '....Y....'
    ],
    moon: [
        '...SSSS..',
        '..SSS....',
        '.SSS.....',
        '.SS......',
        '.SS......',
        '.SSS.....',
        '..SSS....',
        '...SSSS..',
        '.........'
    ],

    // ----- The events (the "icon" of each event in EVENTS in data.js) -----
    calm: [             // a calm face
        '..YYYYY..',
        '.YYYYYYY.',
        'YYKYYYKYY',
        'YYKYYYKYY',
        'YYYYYYYYY',
        'YKYYYYYKY',
        'YYKKKKKYY',
        '.YYYYYYY.',
        '..YYYYY..'
    ],
    dust: [             // blowing dust
        '.........',
        'AAAAAA...',
        '......A..',
        '..AAAAA.A',
        '.A.......',
        'AAAAAAAA.',
        '........A',
        '..AAAAAAA',
        '.........'
    ],
    cold: [             // a snowflake
        '....B....',
        '.B..B..B.',
        '..B.B.B..',
        '...BBB...',
        'BBBBWBBBB',
        '...BBB...',
        '..B.B.B..',
        '.B..B..B.',
        '....B....'
    ],
    fault: [            // a wrench
        '.....G.G.',
        '.....G.G.',
        '.....GGG.',
        '....GGG..',
        '...GGG...',
        '..GGG....',
        '.GGG.....',
        'GGG......',
        'GG.......'
    ],
    food: [             // a can of food that went bad
        '.N...N...',
        '..N.N....',
        '.GGGGGGG.',
        '.GAAAAAG.',
        '.GAWWWAG.',
        '.GAAAAAG.',
        '.GAAAAAG.',
        '.GGGGGGG.',
        '.........'
    ],
    crate: [            // a box of supplies
        'MMMMMMMMM',
        'MmmmmmmmM',
        'MmMmmmMmM',
        'MmmMmMmmM',
        'MmmmMmmmM',
        'MmmMmMmmM',
        'MmMmmmMmM',
        'MmmmmmmmM',
        'MMMMMMMMM'
    ],
    letter: [           // a letter from Earth
        '.........',
        'WWWWWWWWW',
        'WGWWWWWGW',
        'WWGWWWGWW',
        'WWWGWGWWW',
        'WWWWGWWWW',
        'WWWWWWWWW',
        'WWWWWWWWW',
        '.........'
    ],
    telescope: [
        '.......WW',
        '.....GGWW',
        '...GGGG..',
        '.GGGG....',
        'GGGG.....',
        '..GG.....',
        '.G..G....',
        'G....G...',
        '.........'
    ],

    // ----- Buttons and titles -----
    dice: [
        'WWWWWWWWW',
        'WKWWWWWKW',
        'WWWWWWWWW',
        'WWWWWWWWW',
        'WWWWKWWWW',
        'WWWWWWWWW',
        'WWWWWWWWW',
        'WKWWWWWKW',
        'WWWWWWWWW'
    ],
    rocket: [
        '....R....',
        '...WWW...',
        '...WBW...',
        '...WWW...',
        '..RWWWR..',
        '.RRWWWRR.',
        '.R.OYO.R.',
        '...OYO...',
        '....O....'
    ],
    // The satellite dish: sends waves when the sound is on, a red cross when it is off.
    dishOn: [
        '..........BB....',
        '............B...',
        '..........B..B..',
        '...........B..B.',
        '.WW.........B.B.',
        '.dWW.....Y......',
        '.dSWW...G.......',
        '.dSSWW.G........',
        '..dSSWW.........',
        '..dSSSWW........',
        '...dSSSWW.......',
        '....ddSSWW......',
        '......dddd......',
        '.......dd.......',
        '....GGGGGGG.....',
        '...ddddddddd....'
    ],
    dishOff: [
        '................',
        '...........R..R.',
        '............RR..',
        '............RR..',
        '.WW........R..R.',
        '.dWW.....Y......',
        '.dSWW...G.......',
        '.dSSWW.G........',
        '..dSSWW.........',
        '..dSSSWW........',
        '...dSSSWW.......',
        '....ddSSWW......',
        '......dddd......',
        '.......dd.......',
        '....GGGGGGG.....',
        '...ddddddddd....'
    ]
};

// The dish waves pulse and its light blinks (css/intro.css).
const ICON_CLASSES = { dishOn: { B: 'dish-wave', Y: 'dish-light' } };

// The SVG of one icon, in a <span class="px-icon">.
// An unknown name draws nothing, so one wrong name never breaks the page.
function iconHtml(name) {
    if (ICONS[name] === undefined) {
        return '';
    }
    return '<span class="px-icon icon-' + name + '">' + drawSquares(ICONS[name], ICON_COLORS, ICON_CLASSES[name]) + '</span>';
}

// Puts text on the page and draws [name] as an icon. Everything else stays plain text.
function setIconText(element, text) {
    element.innerHTML = '';
    const parts = String(text).split(/\[([A-Za-z]+)\]/);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1 && ICONS[parts[i]] !== undefined) {
            element.insertAdjacentHTML('beforeend', iconHtml(parts[i]));
        } else if (i % 2 === 1) {
            element.appendChild(document.createTextNode('[' + parts[i] + ']'));
        } else if (parts[i] !== '') {
            element.appendChild(document.createTextNode(parts[i]));
        }
    }
}

// Draws the icons that are written into index.html as data-icon="name".
function fillStaticIcons() {
    const places = document.querySelectorAll('[data-icon]');
    for (let i = 0; i < places.length; i++) {
        places[i].outerHTML = iconHtml(places[i].getAttribute('data-icon'));
    }
}
