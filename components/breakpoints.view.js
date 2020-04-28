import { get, overload, mutations } from '../../fn/module.js';
import { identify } from '../../dom/module.js';
import Sparky, { Observer, Stream, delegate, observe } from '../../sparky/module.js';
import { lines } from './lines.view.js';


/* Data */

const breakpoints = [{ x: 320 }, { x: 960 }];

function calcConstants(breakpoints, line0, line1) {
    const x1 = breakpoints[0].x;
    const x2 = breakpoints[1].x;
    const ya1 = line0.data[0].fontsize;
    const ya2 = line0.data[1].fontsize;
    const yb1 = line1.data[0].fontsize;
    const yb2 = line1.data[1].fontsize;
    const ma = (ya2 - ya1) / (x2 - x1);
    const mb = (yb2 - yb1) / (x2 - x1);
    const n = ((ya1 - yb1) / (ma - mb)) - x1;
    const c = ya1 - ma * (x1 + n);

    line0.data[1].m = ma;
    line1.data[1].m = mb;

    breakpoints[1].n = n;
    breakpoints[1].c = c;
}

var unobservers = new WeakMap();

observe('.', function(breakpoints, records) {
    records.removed.forEach(function remove(breakpoint) {
        unobservers.get(breakpoint)();
    });

    records.added.forEach(function add(breakpoint) {
        unobservers.set(breakpoint, observe('x', function() {
            calcConstants(breakpoints, Observer(lines[0]), Observer(lines[1]));
        }, breakpoint));
    });
}, breakpoints);

Sparky.fn('breakpoints', function (node) {
    return Stream.of(breakpoints);
});


/* Lines */

function calcGradient(breakpoint0, breakpoint1, data0) {
    const y0 = data0.fontsize;
    const x0 = breakpoint0.x;
    // gradient m up to breakpoint1 is m = (y0 - c) / (x0 + n)
    return (y0 - breakpoint1.c) / (x0 + breakpoint1.n);
}

function calcFontSize(breakpoint, data) {
    // fontsize at breakpoint is y = m(x + n) + c
    return data.m * (breakpoint.x + breakpoint.n) + breakpoint.c
}

mutations('.', breakpoints)
.combine(function(breakpoints, lines) {
    const unobservers = new WeakMap();

    // Observe first two lines
    lines
    .slice(0, 2)
    .forEach(function(line) {
        const unobserve = unobservers.get(line);
        if (unobserve) { unobserve.forEach((fn) => fn()); }

        function update(breakpoints, lines) {
            calcConstants(breakpoints, lines[0], lines[1]);
            breakpoints
            .slice(2)
            .forEach(function (breakpoint, i) {
                const point = line.data[i + 2];
                point.fontsize = calcFontSize(breakpoint, point);
            });
        }

        unobservers.set(line, [
            observe('fontsize', function(fontsize) {
                update(breakpoints, lines);
            }, line.data[0]),

            observe('fontsize', function(fontsize) {
                update(breakpoints, lines);
            }, line.data[1])
        ]);
    });

    // Observe additional lines
    lines
    .slice(2)
    .forEach(function(line) {
        const unobserve = unobservers.get(line);
        if (unobserve) { unobserve.forEach((fn) => fn()); }

        function update(breakpoints, line) {
            breakpoints
            .slice(1)
            .forEach(function(breakpoint, i) {
                const point = line.data[i + 1];
                point.m        = calcGradient(breakpoints[i], breakpoint, line.data[i]);
                point.fontsize = calcFontSize(breakpoint, point);
            });
        }

        unobservers.set(line, [
            // Observe starting fontsize
            observe('fontsize', function(fontsize) {
                update(breakpoints, line);
            }, line.data[0]),

            // Observe breakpoint n
            observe('n', function(fontsize) {
                update(breakpoints, line);
            }, breakpoints[1]),

            // Observe breakpoint c
            observe('c', function(fontsize) {
                update(breakpoints, line);
            }, breakpoints[1])
        ]);
    });
}, mutations('.', lines))
.each(console.log);

Sparky.fn('line-breakpoints', function(node) {
    const id = identify(node);
    return this.map(function(line) {
        return breakpoints
        .slice(1)
        .map(function(breakpoint, b) {
            const point = line.data[b + 1];

            const data = Observer({
                line:       line,
                breakpoint: breakpoint,
                point:      point
            });

            function update() {
                data.px = breakpoint.c + point.m * breakpoint.n;
            }

            observe('m', update, point);
            observe('c', update, breakpoint);
            observe('n', update, breakpoint);

            return data;
        })
    });
});


/* Actions */

const observer = Observer(breakpoints);

Sparky.fn('breakpoints-actions', delegate({
    'click': {
        'button[name]': overload(get('name'), {
            'add-breakpoint': function () {
                observer.push({
                    x: last(breakpoints).x + 480
                });
            },

            'remove-breakpoint': function () {
                observer.length--;
            }
        })
    }
}));

window.breakpoints = breakpoints;
