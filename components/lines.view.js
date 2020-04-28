
import { get, overload } from '../../fn/module.js';
import Sparky, { Observer, Stream, delegate, observe, getScope } from '../../sparky/module.js';

export const lines = [{
    label: 'body',
    data: [{
        fontsize: 16
    }, {
        fontsize: 18
    }]
}, {
    label: 'h1',
    data: [{
        fontsize: 31.25
    }, {
        fontsize: 54
    }]
}, {
    label: 'h2',
    data: [{
        fontsize: 25
    }, {}]
}, {
    label: 'h3',
    data: [{
        fontsize: 20
    }, {}]
}];

const observer = Observer(lines);

Sparky.fn('lines', function(node) {
    return Stream.of(lines);
});

Sparky.fn('lines-actions', delegate({
    'click': {
        'button[name]': overload(get('name'), {
            'create-line': function(node, e) {
                observer.push({
                    label: '',
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
