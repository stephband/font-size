
import { get, overload, remove } from '../../fn/module.js';
import Sparky, { Observer, Stream, delegate, observe, getScope } from '../../sparky/module.js';

export const lines = window.location.search
    // Lines from the URL
    && (Array.from(new URLSearchParams(window.location.search)))
    .filter((entry) => entry[0] !== 'breakpoints')
    .map((entry) => ({
        label: entry[0],
        data: entry[1].split(',').map(parseFloat).map((n) => ({ fontsize: n }))
    }))

    // Default lines
    || [{
        label: 'body',
        data: [{
            fontsize: 16
        }, {
            fontsize: 18
        }]
    }, {
        label: 'h1',
        data: [{
            fontsize: 32
        }, {
            fontsize: 54
        }]
    }, {
        label: 'h2',
        data: [{
            fontsize: 25
        }, {}]
    }] ;

const observer = Observer(lines);

Sparky.fn('lines', function(node) {
    return Stream.of(lines);
});

Sparky.fn('lines-actions', delegate({
    'click': {
        'button[name]': overload(get('name'), {
            'create-line': function(node, e) {
                observer.push({
                    label: '.class',
                    data: [{
                        fontsize: 16
                    }, {}]
                });
            },

            'delete-line': function (node, e) {
                remove(observer, getScope(node));
            }
        })
    }
}));
