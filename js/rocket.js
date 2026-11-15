// ============================================================
// rocket.js - a rocket that now and then flies across the screen,
// behind all the other elements.
// Standalone: it needs no other file, it adds its own element and
// does not touch the game rules or the game page code.
// It only flies while the game screen is showing.
// ============================================================

const ROCKET = {
    image: 'assets/rocket.png',     // your picture. If it is missing, a small drawn rocket is used.
    angleUp: 20,                    // degrees the rocket climbs. Your picture points this many degrees up from flat.
    minGap: 300000,                  // shortest wait between two fly-bys (milliseconds)
    maxGap: 600000,                  // longest wait
    firstDelay: 5000,               // wait before the first one
    minSpeed: 200,                  // slowest flight, pixels per second
    maxSpeed: 280,                  // fastest flight
    minSize: 140,                    // rocket size in pixels
    maxSize: 170,
    minStartHeight: 0.15,           // where on the left edge it can start: from this share of the screen height...
    maxStartHeight: 0.95,           // ...down to this one (0 = top, 1 = bottom)
    opacity: 1,
    layer: -1                       // CSS z-index. -1 = behind everything. 0 or more = in front of the page.
};

(function () {
    // A small rocket drawn with SVG. It points to the right, flat.
    const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32">'
        + '<path d="M12 16 L4 8 L4 24 Z" fill="#ff9f1c"/>'
        + '<path d="M10 16 L2 10 L2 22 Z" fill="#ffd166"/>'
        + '<path d="M12 9 L22 4 L22 12 Z M12 23 L22 28 L22 20 Z" fill="#e63946"/>'
        + '<path d="M12 10 Q32 6 54 16 Q32 26 12 22 Z" fill="#f1f1f1"/>'
        + '<path d="M44 11 Q52 13 54 16 Q52 19 44 21 Z" fill="#e63946"/>'
        + '<circle cx="34" cy="16" r="4" fill="#4cc9f0" stroke="#555" stroke-width="1.2"/>'
        + '</svg>');

    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;overflow:hidden;'
        + 'pointer-events:none;z-index:' + ROCKET.layer + ';';
    document.body.insertBefore(layer, document.body.firstChild);

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    function gameIsShowing() {
        const screen = document.querySelector('.gamescreen');
        return screen !== null && screen.classList.contains('active') && !document.hidden;
    }

    function fly() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const size = random(ROCKET.minSize, ROCKET.maxSize);
        const slope = Math.tan(ROCKET.angleUp * Math.PI / 180);

        // Start just outside the left edge, at a random height.
        const startX = -size * 1.5;
        const startY = random(height * ROCKET.minStartHeight, height * ROCKET.maxStartHeight);

        // Climb at the fixed angle until the rocket leaves the screen (right edge or top).
        let endX = width + size * 1.5;
        let endY = startY - (endX - startX) * slope;
        if (endY < -size * 1.5) {
            endY = -size * 1.5;
            endX = startX + (startY - endY) / slope;
        }
        const distance = Math.hypot(endX - startX, endY - startY);
        const duration = distance / random(ROCKET.minSpeed, ROCKET.maxSpeed) * 1000;

        const picture = document.createElement('img');
        picture.alt = '';
        picture.draggable = false;
        picture.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:auto;'
            + 'opacity:' + ROCKET.opacity + ';will-change:transform;';

        // Your picture is already tilted up by angleUp, so it needs no turning.
        // The drawn fallback is flat, so it is turned up by angleUp.
        let turn = 0;
        function pose(x, y) {
            return 'translate(' + x + 'px,' + y + 'px) rotate(' + turn + 'deg)';
        }

        let animation = null;
        function startAnimation() {
            if (animation !== null) {
                animation.cancel();
            }
            animation = picture.animate(
                [{ transform: pose(startX, startY) }, { transform: pose(endX, endY) }],
                { duration: duration, easing: 'linear', fill: 'forwards' }
            );
            animation.onfinish = function () {
                picture.remove();
            };
        }

        picture.onerror = function () {
            picture.onerror = null;
            turn = -ROCKET.angleUp;
            picture.src = FALLBACK_IMAGE;
            startAnimation();
        };
        picture.style.transform = pose(startX, startY);
        picture.src = ROCKET.image;
        layer.appendChild(picture);
        startAnimation();
    }

    function scheduleNext(delay) {
        setTimeout(function () {
            if (gameIsShowing()) {
                fly();
                scheduleNext(random(ROCKET.minGap, ROCKET.maxGap));
            } else {
                scheduleNext(2000);     // not in the game right now: check again soon
            }
        }, delay);
    }

    // People who ask their computer for less motion get no rocket.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && typeof document.body.animate === 'function') {
        scheduleNext(ROCKET.firstDelay);
    }
})();
