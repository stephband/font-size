// font-size 1.0.2 (Built 2020-07-20 17:24)

import { c as cache$1, o as overload, i as id, t as toType, h as capture, e as nothing, j as exec, n as noop, k as contains, m as equals, q as exp, r as getPath, u as invoke, v as last$1, w as clamp, x as log$1, y as mod, z as append, A as prepend, B as prepad, C as postpad, D as slugify, E as isDefined, F as compose, G as get, H as is, I as sum, J as has, K as matches, L as toClass, M as addDate, N as addTime, O as subTime, P as root, Q as pow, R as toCamelCase, T as normalise, U as denormalise, V as todB, W as toLevel, X as toCartesian, Y as toPolar, Z as toFixed, _ as formatDate, $ as formatTime, a0 as multiply, a1 as toDeg, a2 as toRad, a3 as parseInteger, a4 as toString, a5 as not, a6 as observe, d as pipe$1, a7 as getPath$1, a8 as Target, a9 as setPath, aa as weakCache, g as get$1, f as choose, S as Stream, ab as Observer, ac as mutations, ad as rest, ae as take, af as requestTick, ag as remove$1 } from './modules/fn.rolled.js';
import { n as now, r as request, p as parseHTML, s as select, e as escape, a as parseValue, t as toRem, b as toVw, c as toVh, d as classes, f as tag, g as trigger, h as fragmentFromChildren, i as isFragmentNode, j as create, k as before, l as fragmentFromHTML, m as remove, o as requestGet, q as events, u as element } from './modules/dom.rolled.js';

// Debug mode on by default
const DEBUG$1 = window.DEBUG === undefined || window.DEBUG;

// Render queue
const maxFrameDuration = 0.015;

const queue = new Set();

const addons = [];

var renderCount = 0;

var frame;


/** Console logging */

function tokenOrLabel(token) {
	return typeof token === 'string' ? token : token.label;
}

function tabulateRenderer(renderer) {
	return {
		'label':  renderer.label,
		'source': renderer.tokens ?
			renderer.tokens
			.filter((token) => token.label !== 'Listener')
			.map(tokenOrLabel)
			.join('') :
			renderer.path,
		'rendered': renderer.renderedValue,
		'DOM mutations (accumulative)': renderer.renderCount
	};
}

function filterListener(renderer) {
	return renderer.constructor.name !== 'Listener';
}

function logRenders(tStart, tStop) {
	if (DEBUG$1) {
		console.table(
			Array.from(queue)
			.concat(addons)
			.filter(filterListener)
			.map(tabulateRenderer)
		);

		console.log('%c' + queue.size + ' cued renderer' + (queue.size === 1 ? '' : 's') + '. '
		+ addons.length + ' in-frame renderer' + (addons.length === 1 ? '' : 's') + '. '
		+ renderCount + ' DOM mutation' + (renderCount === 1 ? '' : 's') + '. %c'
		+ (tStop - tStart).toFixed(3) + 's', 'color: #6894ab; font-weight: 300;', '');

		console.groupEnd();
	}

	if ((tStop - tStart) > maxFrameDuration) {
		console.log('%c  ' + queue.size + ' cued renderer' + (queue.size === 1 ? '' : 's') + '. '
		+ addons.length + ' in-frame renderer' + (addons.length === 1 ? '' : 's') + '. '
		+ renderCount + ' DOM mutation' + (renderCount === 1 ? '' : 's') + '. %c'
		+ (tStop - tStart).toFixed(3) + 's', 'color: #d34515; font-weight: 300;', '');
	}
}


/** The meat and potatoes */

function fireEachDEBUG(queue) {
	var count, renderer;

	for (renderer of queue) {
		count = renderer.renderCount;

		try {
			renderer.fire();
		}
		catch(e) {
			throw e;
			//throw new Error('failed to render ' + renderer.tokens.map(get('label')).join(', ') + '. ' + e.message);
		}

		renderCount += (renderer.renderCount - count);
	}
}

function fireEach(queue) {
	var renderer;

	for (renderer of queue) {
		renderer.fire();
	}
}

function run(time) {
	var tStart;

	if (DEBUG$1) {
		window.console.groupCollapsed('%cSparky %c ' + (window.performance.now() / 1000).toFixed(3) + ' frame ' + (time / 1000).toFixed(3), 'color: #a3b31f; font-weight: 600;', 'color: #6894ab; font-weight: 400;');

		try {
			renderCount = 0;
			addons.length = 0;

			tStart = now();
			frame = true;
			fireEachDEBUG(queue);
			frame = undefined;
		}
		catch (e) {
			const tStop = now();

			// Closes console group, logs warning for frame overrun even
			// when not in DEBUG mode
			logRenders(tStart, tStop);
			queue.clear();

			throw e;
		}
	}
	else {
		renderCount = 0;
		addons.length = 0;

		tStart = now();
		frame = true;
		fireEach(queue);
		frame = undefined;
	}

	const tStop = now();

    // Closes console group, logs warning for frame overrun even
    // when not in DEBUG mode
    logRenders(tStart, tStop);
	queue.clear();
}

function cue(renderer) {
	var count;

	// Run functions cued during frame synchronously to preserve
	// inner-DOM-first order of execution during setup
	if (frame === true) {
		if (DEBUG$1) {
			if (typeof renderer.renderCount !== 'number') {
				console.warn('Sparky renderer has no property renderCount', renderer);
			}

			count = renderer.renderCount;
		}

		renderer.fire();

		if (DEBUG$1) {
			addons.push(renderer);
			renderCount += (renderer.renderCount - count);
		}

		return;
	}

	// Don't recue cued renderers. This shouldn't happen much.
	if (queue.has(renderer)) { return; }

	queue.add(renderer);

	if (frame === undefined) {
		frame = requestAnimationFrame(run);
	}
}

function uncue(renderer) {
	queue.delete(renderer);

	if (frame !== undefined && frame !== true && queue.size === 0) {
		//if (DEBUG) { console.log('(cancel master frame)'); }
		cancelAnimationFrame(frame);
		frame = undefined;
	}
}

function log(text) {
    window.console.log('%cSparky%c ' + text,
        'color: #858720; font-weight: 600;',
        'color: #6894ab; font-weight: 400;'
    );
}

function logNode(target, attrFn, attrInclude) {
    const attrIs = target.getAttribute('is') || '';
    window.console.log('%cSparky%c'
        + ' ' + (window.performance.now() / 1000).toFixed(3)
        + ' <'
        + (target.tagName.toLowerCase())
        + (attrIs ? ' is="' + attrIs + '"' : '')
        + (attrFn ? ' fn="' + attrFn + '"' : '')
        + (attrInclude ? ' src="' + attrInclude + '"' : '')
        + '>',
        'color: #858720; font-weight: 600;',
        'color: #6894ab; font-weight: 400;'
    );
}

function nodeToString(node) {
    return '<' +
    node.tagName.toLowerCase() +
    (['fn', 'class', 'id', 'include'].reduce((string, name) => {
        const attr = node.getAttribute(name);
        return attr ? string + ' ' + name + '="' + attr + '"' : string ;
    }, '')) +
    '/>';
}

/* config.

```js
import { config } from './sparky/module.js'

config.attributeFn = 'data-fn';
config.attributeSrc = 'data-src';
```
*/

var config = {
    attributeFn: 'fn',
    attributeSrc: 'src',
    attributePrefix: ':',
    parse: {
        default: { attributes: ['id', 'title', 'style'], booleans: ['hidden'] },
        a: { attributes: ['href'] },
        button: { attributes: ['name', 'value'], booleans: ['disabled'] },
        circle: { attributes: ['cx', 'cy', 'r', 'transform'] },
        ellipse: { attributes: ['cx', 'cy', 'rx', 'ry', 'r', 'transform'] },
        form: { attributes: ['method', 'action'] },
        fieldset: { booleans: ['disabled'] },
        g: { attributes: ['transform'] },
        img: { attributes: ['alt', 'src'] },
        input: {
            booleans: ['disabled', 'required'],
            attributes: ['name'],
            types: {
                button: { attributes: ['value'] },
                checkbox: { attributes: [], booleans: ['checked'] },
                date: { attributes: ['min', 'max', 'step'] },
                hidden: { attributes: ['value'] },
                image: { attributes: ['src'] },
                number: { attributes: ['min', 'max', 'step'] },
                radio: { attributes: [], booleans: ['checked'] },
                range: { attributes: ['min', 'max', 'step'] },
                reset: { attributes: ['value'] },
                submit: { attributes: ['value'] },
                time: { attributes: ['min', 'max', 'step'] }
            }
        },
        label: { attributes: ['for'] },
        line: { attributes: ['x1', 'x2', 'y1', 'y2', 'transform'] },
        link: { attributes: ['href'] },
        meta: { attributes: ['content'] },
        meter: { attributes: ['min', 'max', 'low', 'high', 'value'] },
        option: { attributes: ['value'], booleans: ['disabled'] },
        output: { attributes: ['for'] },
        path: { attributes: ['d', 'transform'] },
        polygon: { attributes: ['points', 'transform'] },
        polyline: { attributes: ['points', 'transform'] },
        progress: { attributes: ['max', 'value'] },
        rect: { attributes: ['x', 'y', 'width', 'height', 'rx', 'ry', 'transform'] },
        select: { attributes: ['name'], booleans: ['disabled', 'required'] },
        svg: { attributes: ['viewbox'] },
        text: { attributes: ['x', 'y', 'dx', 'dy', 'text-anchor', 'transform'] },
        textarea: { attributes: ['name'], booleans: ['disabled', 'required'] },
        time: { attributes: ['datetime'] },
        use: { attributes: ['href', 'transform', 'x', 'y'] }
    }
};

const translations = {};

const requestDocument = cache$1(function requestDocument(path) {
    return request('GET', path)
    .then(parseHTML);
});

let scriptCount = 0;

function importDependencies(path, doc) {
    const dir = path.replace(/[^\/]+$/, '');

    // Import templates and styles

    // Is there a way to do this without importing them into the current document?
    // Is that even wise?
    // Is that just unecessary complexity?
    doc.querySelectorAll('style, template').forEach(function(node) {
        if (!node.title) { node.title = dir; }
        document.head.appendChild(document.adoptNode(node));
    });

    // Import CSS links
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(function(node) {
        if (!node.title) { node.title = dir; }
        const href = node.getAttribute('href');

        // Detect local href. Todo: very crude. Improve.
        if (/^[^\/]/.test(href)) {
            // Get rid of leading './'
            const localHref = href.replace(/^\.\//, '');
            node.setAttribute('href', dir + localHref);
        }

        document.head.appendChild(document.adoptNode(node));
    });

    // Wait for scripts to execute
    const promise = Promise.all(
        select('script', doc).map(toScriptPromise)
    )
    .then(() => doc);

    return DEBUG ? promise.then((object) => {
        console.log('%cSparky %cinclude', 'color: #a3b31f; font-weight: 600;', 'color: #6894ab; font-weight: 400;', path);
        return object;
    }) :
    promise ;
}

function toScriptPromise(node) {
    return new Promise(function(resolve, reject) {
        window['sparkyScriptImport' + (++scriptCount)] = resolve;

        // This method doesnt seem to run the script
        // document.head.appendChild(document.adoptNode(node));
        // Try this instead...
        const script = document.createElement('script');
        script.type = 'module';
        script.title = node.title || node.baseURL;

        // Detect script has parsed and executed
        script.textContent = node.textContent + ';window.sparkyScriptImport' + scriptCount + '();';
        document.head.appendChild(script);
    });
}

function importTemplate(src) {
    const parts = src.split('#');
    const path  = parts[0] || '';
    const id    = parts[1] || '';

    return path ?
        id ?
            requestDocument(path)
            .then((doc) => importDependencies(path, doc))
            .then((doc) => document.getElementById(id))
            .then((template) => {
                if (!template) { throw new Error('Sparky template "' + src + '" not found'); }
                return template;
            }) :

        requestDocument(path)
        .then((doc) => document.adoptNode(doc.body)) :

    id ?
        // If path is blank we are looking in the current document, so there
        // must be a template id (we can't import the document into itself!)
        Promise
        .resolve(document.getElementById(id))
        .then((template) => {
            if (!template) { throw new Error('Sparky template "' + src + '" not found'); }
            return template;
        }) :

    // If no path and no id
    Promise.reject(new Error('Sparky template "' + src + '" not found. URL must have a path or a hash ref')) ;
}

// Matches the arguments list in the result of fn.toString()
const rarguments = /function(?:\s+\w+)?\s*(\([\w,\s]*\))/;

var toText = overload(toType, {
	'boolean': function(value) {
		return value + '';
	},

	'function': function(value) {
		// Print function and parameters
		return (value.name || 'function')
			+ (rarguments.exec(value.toString()) || [])[1];
	},

	'number': function(value) {
		// Convert NaN to empty string and Infinity to ∞ symbol
		return Number.isNaN(value) ? '' :
			Number.isFinite(value) ? value + '' :
			value < 0 ? '-∞' : '∞';
	},

	'string': id,

	'symbol': function(value) {
		return value.toString();
	},

	'undefined': function() {
		return '';
	},

	'object': function(value) {
		// Don't render null
		return value ? JSON.stringify(value) : '';
	},

	'default': JSON.stringify
});

const assign = Object.assign;

function Value(path) {
    this.path = path;
}

function isValue(object) {
    return Value.prototype.isPrototypeOf(object);
}

assign(Value.prototype, {
    valueOf: function valueOf() {
        return this.transform ?
            this.value === undefined ?
                undefined :
            this.transform(this.value) :
        this.value ;
    },

    toString: function toString() {
        return toText(this.valueOf());
    },
});

/**
parseParams(array, string)
*/

//                                        number                                     "string"            'string'                    null   true   false    [array]      {object}   function(args)   /regex/             dot  string             comma
const parseParams = capture(/^\s*(?:(-?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?)|"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(null)|(true)|(false)|(\[[^\]]*\])|(\{[^}]*\})|(\w+)\(([^)]+)\)|\/((?:[^/]|\.)*)\/|(\.)?([\w.\-#/?:\\]+))/, {
    // number
    1: function(params, tokens) {
        params.push(parseFloat(tokens[1]));
        return params;
    },

    // "string"
    2: function(params, tokens) {
        params.push(tokens[2]);
        return params;
    },

    // 'string'
    3: function(params, tokens) {
        params.push(tokens[3]);
        return params;
    },

    // null
    4: function(params) {
        params.push(null);
        return params;
    },

    // true
    5: function(params) {
        params.push(true);
        return params;
    },

    // false
    6: function(params) {
        params.push(false);
        return params;
    },

    // [array]
    7: function(params, tokens) {
        params.push(JSON.parse(tokens[7]));
        return params;
    },

    // flat {object}
    8: function (params, tokens) {
        params.push(JSON.parse(tokens[8]));
        return params;
    },

    // Todo: review syntax for nested functions
    // function(args)
    //8: function(params, value, result) {
    //    // Todo: recurse to parseFn for parsing inner functions
    //    value = Sparky.transforms[value].apply(null, JSON.parse('[' + result[9].replace(rsinglequotes, '"') + ']'));
    //    params.push(value);
    //    return params;
    //},

    // /regexp/
    11: function(params, tokens) {
        const regex = RegExp(tokens[11]);
        params.push(regex);
    },

    // string
    13: function(params, tokens) {
        if (tokens[12]) {
            params.push(new Value(tokens[13]));
        }
        else {
            params.push(tokens[13]);
        }
        return params;
    },

    // Comma terminator - more params to come
    close: capture(/^\s*(,)/, {
        1: function(params, tokens) {
            parseParams(params, tokens);
        },

        catch: id
    }),

    catch: function(params, string) {
        // string is either the input string or a tokens object
        // from a higher level of parsing
        throw new SyntaxError('Invalid parameter "' + (string.input || string) + '"');
    }
});

/**
parsePipe(array, string)
*/

const parsePipe = capture(/^\s*([\w-]+)\s*(:)?\s*/, {
    // Function name '...'
    1: function(fns, tokens) {
        fns.push({
            name: tokens[1],
            args: nothing
        });

        return fns;
    },

    // Params ':'
    2: function(fns, tokens) {
        fns[fns.length - 1].args = parseParams([], tokens);
        return fns;
    },

    close: capture(/^\s*(\|)?\s*/, {
        // More pipe '|'
        1: function(fns, tokens) {
            return parsePipe(fns, tokens);
        }
    }),

    catch: function(fns, string) {
        // string is either the input string or a tokens object
        // from a higher level of parsing
        console.log(string.input, string);
        throw new SyntaxError('Invalid pipe "' + (string.input || string) + '"');
    }
});

/**
parseTag(string)
*/

const parseTag = capture(/^\s*([\w.-]*)\s*(\|)?\s*/, {
    // Object path 'xxxx.xxx.xx-xxx'
    1: (nothing, tokens) => new Value(tokens[1]),

    // Pipe '|'
    2: function(tag, tokens) {
        tag.pipe = parsePipe([], tokens);
        return tag;
    },

    // Tag close ']}'
    close: function(tag, tokens) {
        if (!exec(/^\s*\]\}/, id, tokens)) {
            throw new SyntaxError('Unclosed tag in "' + tokens.input + '"');
        }

        return tag;
    },

    // Where nothing is found, don't complain
    catch: id
}, undefined);

/**
parseToken(string)
*/

const parseToken = capture(/^\s*(\{\[)/, {
    // Tag opener '{['
    1: function(unused, tokens) {
        const tag = parseTag(tokens);
        tag.label = tokens.input.slice(tokens.index, tokens.index + tokens[0].length + tokens.consumed);
        return tag;
    },

    close: function(tag, tokens) {
        // Only spaces allowed til end
        if (!exec(/^\s*$/, id, tokens)) {
            throw new SyntaxError('Invalid characters after token (only spaces valid) "' + tokens.input + '"');
        }

        return tag;
    },

    // Where nothing is found, don't complain
    catch: id
}, undefined);

/**
parseBoolean(array, string)
*/

const parseBoolean = capture(/^\s*(?:(\{\[)|$)/, {
    // Tag opener '{['
    1: function(array, tokens) {
        const tag = parseTag(tokens);
        tag.label = tokens.input.slice(tokens.index, tokens.index + tokens[0].length + tokens.consumed);
        array.push(tag);
        return parseBoolean(array, tokens);
    },

    // Where nothing is found, don't complain
    catch: id
});

/**
parseText(array, string)
*/

const parseText = capture(/^([\S\s]*?)(?:(\{\[)|$)/, {
    // String of text, whitespace and newlines included
    1: (array, tokens) => {
        // If no tags have been found return undefined
        if (!array.length && !tokens[2]) {
            return;
        }

        // If it is not empty, push in leading text
        if (tokens[1]) {
            array.push(tokens[1]);
        }

        return array;
    },

    // Tag opener '{['
    2: (array, tokens) => {
        const tag = parseTag(tokens);
        tag.label = tokens.input.slice(tokens.index + tokens[1].length, tokens.index + tokens[0].length + tokens.consumed);
        array.push(tag);
        return parseText(array, tokens);
    },

    // Where nothing is found, don't complain
    catch: noop
});

/**
fn="name:params"

A `fn` attribute declares one or more functions to run on a template.
A **function** is expected to supply an object that Sparky uses to
render template **tags**:

```html
<template is="sparky-template" fn="fetch:package.json">
    I am {[title]}.
</template>
```

```html
I am Sparky.
```

The `fn` attribute may be declared on any element in a sparky template.
Here we use the built-in functions `fetch`, `get` and `each` to loop over an
array of keywords and generate a list:

```html
<template is="sparky-template" fn="fetch:package.json">
    <ul>
        <li fn="get:keywords each">{[.]}</li>
    </ul>
</template>
```

```html
<ul>
    <li>javascript</li>
    <li>browser</li>
</ul>
```
*/

/**
Functions
*/

/**
Sparky.fn(name, fn)

Sparky 'functions' are view-controllers with access to the node where they are
declared and control over the flow of objects being sent to the renderer.

```
import Sparky from './sparky/build/module.js';

// Define fn="my-function:params"
Sparky.fn('my-function', function(input, node, params) {
    // input is a mappable, filterable, consumable,
    // stoppable stream of scope objects
    return input.map(function(scope) {
        // Map scope...
    });
});
```

Functions are called before a node is mounted. They receive a stream of scopes
and the DOM node, and may return the same stream, or a new stream, or they may
block mounting and rendering altogether. Types of return value are interpreted
as follows:

- `Promise` - automatically converted to a stream
- `Stream` - a stream of scopes
- `undefined` - equivalent to returning the input stream
- `false` - cancels the mount process

The stream returned by the last function declared in the `fn` attribute is
piped to the renderer. Values in that stream are rendered, and the life
of the renderer is controlled by the state of that stream. Sparky's streams
come from <a href="https://stephen.band/fn/#stream">stephen.band/fn/#stream</a>.
*/

/**
Examples

Push a single scope object to the renderer:

```
import { register, Stream } from './sparky/module.js';

register('my-scope', function(node, params) {
    // Return a stream of one object
    return Stream.of({
        text: 'Hello, Sparky!'
    });
});
```

Return a promise to push a scope when it is ready:

```
register('my-package', function(node, params) {
    // Return a promise
    return fetch('package.json')
    .then((response) => response.json());
});
```

Push a new scope object to the renderer every second:

```
register('my-clock', function(node, params) {
    const output = Stream.of();

    // Push a new scope to the renderer once per second
    const timer = setInterval(() => {
        output.push({
            time: window.performance.now()
        });
    }, 1000);

    // Listen to the input stream, stop the interval
    // timer when it is stopped
    this.done(() => clearInterval(timer));

    // Return the stream
    return output;
});
```
*/


const DEBUG$2 = window.DEBUG;

const functions = Object.create(null);

function register(name, fn) {
    if (/^(?:function\s*)?\(node/.exec(fn.toString())) ;

    if (DEBUG$2 && functions[name]) {
        throw new Error('Sparky: fn already registered with name "' + name + '"');
    }

    functions[name] = fn;
}

var A         = Array.prototype;
var S         = String.prototype;

const reducers = {
    sum: sum
};

function addType(n) {
    const type = typeof n;
    return type === 'string' ?
        /^\d\d\d\d(?:-|$)/.test(n) ? 'date' :
        /^\d\d(?::|$)/.test(n) ? 'time' :
        'string' :
    type;
}

function interpolateLinear(xs, ys, x) {
    var n = -1;
    while (++n < xs.length && xs[n] < x);

    // Shortcut if x is lower than smallest x
    if (n === 0) {
        return ys[0];
    }

    // Shortcut if x is greater than biggest x
    if (n >= xs.length) {
        return last$1(ys);
    }

    // Shortcurt if x corresponds exactly to an interpolation coordinate
    if (x === xs[n]) {
        return ys[n];
    }

    // Linear interpolate
    var ratio = (x - xs[n - 1]) / (xs[n] - xs[n - 1]) ;
    return ratio * (ys[n] - ys[n - 1]) + ys[n - 1] ;
}



const transformers = {

    /** is: value
    Returns `true` where value is strictly equal to `value`, otherwise `false`. */
    is: { tx: is, ix: (value, bool) => (bool === true ? value : undefined) },

    /** has: property
    Returns `true` where value is an object with `property`, otherwise `false`. */
    has: { tx: has },

/**
matches: selector

Renders `true` if value matches `selector`. Behaviour is overloaded to accept
different types of `selector`. Where `selector` is a RegExp, value is assumed
to be a string and tested against it.

```html
{[ .|matches:/abc/ ]}     // `true` if value contains 'abc'
```

Where `selector` is an Object, value is assumed to be an object and its
properties are matched against those of `selector`.

```html
{[ .|matches:{key: 3} ]}  // `true` if value.key is `3`.
```
*/

    matches: {
        tx: overload(toClass, {
            RegExp: (regex, string) => regex.test(string),
            Object: matches
        })
    },

    /** class:
    Renders the Class – the name of the constructor – of value. */
    'class': { tx: toClass },

    /** type:
    Renders `typeof` value. */
    'type': { tx: toType },

    /** Booleans */

    /** yesno: a, b
    Where value is truthy renders `a`, otherwise `b`. */
    yesno: {
        tx: function (truthy, falsy, value) {
            return value ? truthy : falsy;
        }
    },

    /** Numbers */

/** add: n

Adds `n` to value. Behaviour is overloaded to accept various types of 'n'.
Where `n` is a number, it is summed with value. So to add 1 to any value:

```html
{[ number|add:1 ]}
```

Where 'n' is a duration string in date-like format, value is expected to be a
date and is advanced by the duration. So to advance a date by 18 months:

```html
{[ date|add:'0000-18-00' ]}
```

Where 'n' is a duration string in time-like format, value is expected to be a
time and is advanced by the duration. So to put a time back by 1 hour and 20
seconds:

```html
{[ time|add:'-01:00:20' ]}
```

*/
    add: {
        tx: overload(addType, {
            number: function(a, b) {
                return typeof b === 'number' ? b + a :
                    b && b.add ? b.add(a) :
                    undefined ;
            },
            date: addDate,
            time: addTime,
            default: function(n) {
                throw new Error('Sparky add:value does not like values of type ' + typeof n);
            }
        }),

        ix: overload(addType, {
            number: function(a, c) { return c.add ? c.add(-a) : c - a ; },
            date: function (d, n) { return addDate('-' + d, n); },
            time: subTime,
            default: function (n) {
                throw new Error('Sparky add:value does not like values of type ' + typeof n);
            }
        })
    },

    /** floor:
    Floors a number.
    **/
    floor: { tx: Math.floor },

    /** root: n
    Returns the `n`th root of value. */
    root: { tx: root, ix: pow },

    /** normalise: curve, min, max
    Return a value in the nominal range `0-1` from a value between `min` and
    `max` mapped to a `curve`, which is one of `linear`, `quadratic`, `exponential`. */
    normalise: {
        tx: function (curve, min, max, number) {
            const name = toCamelCase(curve);
            if (!number) {
                console.log('HELLO');
                return;
            }
            return normalise[name](min, max, number);
        },

        ix: function (curve, min, max, number) {
            const name = toCamelCase(curve);
            return denormalise[name](min, max, number);
        }
    },

    /** denormalise: curve, min, max
    Return a value in the range `min`-`max` of a value in the range `0`-`1`,
    reverse mapped to `curve`, which is one of `linear`, `quadratic`, `exponential`. */
    denormalise: {
        tx: function (curve, min, max, number) {
            const name = toCamelCase(curve);
            return denormalise[name](min, max, number);
        },

        ix: function (curve, min, max, number) {
            const name = toCamelCase(curve);
            return normalise[name](min, max, number);
        }
    },

    /** to-db:
    Transforms values in the nominal range `0-1` to dB scale, and, when used in
    two-way binding, transforms them back a number in nominal range. */
    'to-db': { tx: todB, ix: toLevel },

    /** to-cartesian:
    Transforms a polar coordinate array to cartesian coordinates. */
    'to-cartesian': { tx: toCartesian, ix: toPolar },

    /** to-polar:
    Transforms a polar coordinate array to cartesian coordinates. */
    'to-polar': { tx: toPolar, ix: toCartesian },

    /** floatformat: n
    Transforms numbers to strings with `n` decimal places. Used for
    two-way binding, gaurantees numbers are set on scope. */
    floatformat: { tx: toFixed, ix: function (n, str) { return parseFloat(str); } },

    /** floatprecision: n
    Converts number to string representing number to precision `n`. */
    floatprecision: {
        tx: function (n, value) {
            return Number.isFinite(value) ?
                value.toPrecision(n) :
                value;
        },

        ix: parseFloat
    },

    /** Dates */

    /** add: yyyy-mm-dd
    Adds ISO formatted `yyyy-mm-dd` to a date value, returning a new date. */

    /** dateformat: yyyy-mm-dd
    Converts an ISO date string, a number (in seconds) or a Date object
    to a string date formatted with the symbols:

    - `'YYYY'` years
    - `'YY'`   2-digit year
    - `'MM'`   month, 2-digit
    - `'MMM'`  month, 3-letter
    - `'MMMM'` month, full name
    - `'D'`    day of week
    - `'DD'`   day of week, two-digit
    - `'ddd'`  weekday, 3-letter
    - `'dddd'` weekday, full name
    - `'hh'`   hours
    - `'mm'`   minutes
    - `'ss'`   seconds
    - `'sss'`  seconds with decimals
    */
    dateformat: { tx: formatDate },

    /** Times */

    /** add: duration
    Adds `duration`, an ISO-like time string, to a time value, and
    returns a number in seconds.

    Add 12 hours:

    ```html
    {[ time|add:'12:00' ]}
    ```

    Durations may be negative. Subtract an hour and a half:

    ```html
    {[ time|add:'-01:30' ]}
    ```

    Numbers in a `duration` string are not limited by the cycles of the clock.
    Add 212 seconds:

    ```html
    {[ time|add:'00:00:212' ]}
    ```

    Use `timeformat` to transform the result to a readable format:

    ```html
    {[ time|add:'12:00'|timeformat:'h hours, mm minutes' ]}
    ```

    Not that `duration` must be quoted because it contains ':' characters.
    May be used for two-way binding.
    */

    /** timeformat: format
    Formats value, which must be an ISO time string or a number in seconds, to
    match `format`, a string that may contain the tokens:

    - `'±'`   Sign, renders '-' if time is negative, otherwise nothing
    - `'Y'`   Years, approx.
    - `'M'`   Months, approx.
    - `'MM'`  Months, remainder from years (max 12), approx.
    - `'w'`   Weeks
    - `'ww'`  Weeks, remainder from months (max 4)
    - `'d'`   Days
    - `'dd'`  Days, remainder from weeks (max 7)
    - `'h'`   Hours
    - `'hh'`  Hours, remainder from days (max 24), 2-digit format
    - `'m'`   Minutes
    - `'mm'`  Minutes, remainder from hours (max 60), 2-digit format
    - `'s'`   Seconds
    - `'ss'`  Seconds, remainder from minutes (max 60), 2-digit format
    - `'sss'` Seconds, remainder from minutes (max 60), fractional
    - `'ms'`  Milliseconds, remainder from seconds (max 1000), 3-digit format

    ```html
    {[ .|timeformat:'±hh:mm' ]}
    -13:57
    ```
    */
    timeformat: { tx: formatTime },



    join: {
        tx: function(string, value) {
            return A.join.call(value, string);
        },

        ix: function(string, value) {
            return S.split.call(value, string);
        }
    },



    multiply:    { tx: multiply,    ix: function(d, n) { return n / d; } },
    degrees:     { tx: toDeg,       ix: toRad },
    radians:     { tx: toRad,       ix: toDeg },
    pow:         { tx: pow,         ix: function(n) { return pow(1/n); } },
    exp:         { tx: exp,         ix: log$1 },
    log:         { tx: log$1,         ix: exp },


    /** Type converters */

    /** boolean-string:
    Transforms booleans to strings and vice versa. May by used for two-way binding. */
    'boolean-string': {
        tx: function(value) {
            return value === true ? 'true' :
                value === false ? 'false' :
                undefined;
        },

        ix: function (value) {
            return value === 'true' ? true :
                value === 'false' ? false :
                undefined;
        }
    },

    /** float-string:
    Transforms numbers to float strings, and, used for two-way binding,
    gaurantees numbers are set on scope. */
    'float-string': { tx: (value) => value + '', ix: parseFloat },

    /** floats-string: separator
    Transforms an array of numbers to a string using `separator`, and,
    used for two-way binding, gaurantees an array of numbers is set on scope. */
    'floats-string': {
        tx: function (string, value) {
            return A.join.call(value, string);
        },

        ix: function (string, value) {
            return S.split.call(value, string).map(parseFloat);
        }
    },

    /** int-string:
    Transforms numbers to integer strings, and, used for two-way binding,
    gaurantees integer numbers are set on scope. */
    'int-string':   {
        tx: (value) => (value && value.toFixed && value.toFixed(0) || undefined),
        ix: parseInteger
    },

    /** ints-string: separator
    Transforms an array of numbers to a string of integers seperated with
    `separator`, and, used for two-way binding, gaurantees an array of integer
    numbers is set on scope. */
    'ints-string': {
        tx: function (string, value) {
            return A.join.call(A.map.call(value, (value) => value.toFixed(0)), string);
        },

        ix: function (string, value) {
            return S.split.call(value, string).map(parseInteger);
        }
    },

    /** string-float:
    Transforms strings to numbers, and, used for two-way binding,
    gaurantees float strings are set on scope. */
    'string-float': { tx: parseFloat, ix: toString },

    /** string-int:
    Transforms strings to integer numbers, and, used for two-way binding,
    gaurantees integer strings are set on scope. */
    'string-int': { tx: parseInteger, ix: (value) => value.toFixed(0) },

    /** json:
    Transforms objects to json, and used in two-way binding, sets parsed
    objects on scope. */
    json: { tx: JSON.stringify, ix: JSON.parse },

    interpolate: {
        tx: function(point) {
            var xs = A.map.call(arguments, get('0'));
            var ys = A.map.call(arguments, get('1'));

            return function(value) {
                return interpolateLinear(xs, ys, value);
            };
        },

        ix: function(point) {
            var xs = A.map.call(arguments, get('0'));
            var ys = A.map.call(arguments, get('1'));

            return function(value) {
                return interpolateLinear(ys, xs, value);
            }
        }
    },

    deg:       { tx: toDeg, ix: toRad },
    rad:       { tx: toRad, ix: toDeg },
    level:     { tx: toLevel, ix: todB },
    px:        { tx: parseValue, ix: toRem },
    rem:       { tx: toRem, ix: parseValue },
    vw:        { tx: toVw,  ix: parseValue },
    vh:        { tx: toVh,  ix: parseValue },
    not:       { tx: not,   ix: not }
};

const transforms = {
    /** contains: n **/
    contains:     contains,

    /** equals: n **/
    equals:       equals,
    escape:       escape,
    exp:          exp,

    /** get: path **/
    get:          getPath,

    /** invoke: name, args **/
    invoke:       invoke,

    last:         last$1,
    limit:        clamp,

    /** clamp: min, max **/
    clamp:        clamp,

    /** log: **/
    log:          log$1,

    /** max: **/
    max:          Math.max,

    /** min: **/
    min:          Math.min,

    /** sin: **/
    sin:          Math.sin,

    /** cos: **/
    cos:          Math.cos,

    /** tan: **/
    tan:          Math.tan,

    /** asin: **/
    asin:         Math.asin,

    /** acos: **/
    acos:         Math.acos,

    /** atan: **/
    atan:         Math.atan,

    /** mod: **/
    mod:          mod,

    /** Strings */

    /** append: string
    Returns value + `string`. */
    append:       append,

    /** prepend: string
    Returns `string` + value. */
    prepend:      prepend,

    /** prepad: string, n
    Prepends value with `string` until the output is `n` characters long. */
    prepad:       prepad,

    /** postpad: string, n
    Appends value with `string` until the output is `n` characters long. */
    postpad:      postpad,

    /** slugify:
    Returns the slug of value. */
    slugify:      slugify,

    divide: function(n, value) {
        if (typeof value !== 'number') { return; }
        return value / n;
    },


    /** is-in: array
    Returns `true` if value is contained in `array`, otherwise `false`.

    ```html
    {[ path|is-in:[0,1] ]}
    ```
    */
    'is-in': function(array, value) {
        return array.includes(value);
    },

    'find-in': function(path, id) {
        if (!isDefined(id)) { return; }
        var array = getPath(path, window);
        return array && array.find(compose(is(id), get('id')));
    },

    "greater-than": function(value2, value1) {
        return value1 > value2;
    },

    invert: function(value) {
        return typeof value === 'number' ? 1 / value : !value ;
    },

    "less-than": function(value2, value1) {
        return value1 < value2 ;
    },

    /** localise:n
    Localises a number to `n` digits. */
    localise: function(digits, value) {
        var locale = document.documentElement.lang;
        var options = {};

        if (isDefined(digits)) {
            options.minimumFractionDigits = digits;
            options.maximumFractionDigits = digits;
        }

        // Todo: localise value where toLocaleString not supported
        return value.toLocaleString ? value.toLocaleString(locale, options) : value ;
    },


    /** lowercase:
    Returns the lowercase string of value. */
    lowercase: function(value) {
        if (typeof value !== 'string') { return; }
        return String.prototype.toLowerCase.apply(value);
    },

    map: function(method, params, array) {
        //var tokens;
        //
        //if (params === undefined) {
        //	tokens = parsePipe([], method);
        //	fn     = createPipe(tokens, transforms);
        //	return function(array) {
        //		return array.map(fn);
        //	};
        //}

        var fn = (
            (transformers[method] && transformers[method].tx) ||
            transforms[method]
        );

        return array && array.map((value) => fn(...params, value));
    },

    filter: function(method, args, array) {
        var fn = (
            (transformers[method] && transformers[method].tx) ||
            transforms[method]
        );

        return array && array.filter((value) => fn(...args, value));
    },

    /** pluralise: str1, str2, lang
    Where value is singular in a given `lang`, retuns `str1`, otherwise `str2`. */
    pluralise: function(str1, str2, lang, value) {
        if (typeof value !== 'number') { return; }

        str1 = str1 || '';
        str2 = str2 || 's';

        // In French, numbers less than 2 are considered singular, where in
        // English, Italian and elsewhere only 1 is singular.
        return lang === 'fr' ?
            (value < 2 && value >= 0) ? str1 : str2 :
            value === 1 ? str1 : str2 ;
    },

    reduce: function(name, initialValue, array) {
        return array && array.reduce(reducers[name], initialValue || 0);
    },

    replace: function(str1, str2, value) {
        if (typeof value !== 'string') { return; }
        return value.replace(RegExp(str1, 'g'), str2);
    },

    round: function round(n, value) {
        return Math.round(value / n) * n;
    },

    slice: function(i0, i1, value) {
        return typeof value === 'string' ?
            value.slice(i0, i1) :
            Array.prototype.slice.call(value, i0, i1) ;
    },

    striptags: (function() {
        var rtag = /<(?:[^>'"]|"[^"]*"|'[^']*')*>/g;

        return function(value) {
            return value.replace(rtag, '');
        };
    })(),

    translate: (function() {
        var warned = {};

        return function(value) {
            var text = translations[value] ;

            if (!text) {
                if (!warned[value]) {
                    console.warn('Sparky: config.translations contains no translation for "' + value + '"');
                    warned[value] = true;
                }

                return value;
            }

            return text ;
        };
    })(),

    truncatechars: function(n, value) {
        return value.length > n ?
            value.slice(0, n) + '…' :
            value ;
    },

    uppercase: function(value) {
        if (typeof value !== 'string') { return; }
        return String.prototype.toUpperCase.apply(value);
    }
};

const assign$1  = Object.assign;

function call(fn) {
    return fn();
}

function observeThing(renderer, token, object, scope) {
    // Normally observe() does not fire on undefined initial values.
    // Passing in NaN as an initial value to forces the callback to
    // fire immediately whatever the initial value. It's a bit
    // smelly, but this works because even NaN !== NaN.
    const unobserve = observe(object.path, (value) => {
        object.value = value;

        // If token has noRender flag set, it is being updated from
        // the input and does not need to be rendered back to the input
        if (token.noRender) { return; }
        renderer.cue();
    }, scope, NaN);

    token.unobservers.push(unobserve);
}

function Renderer() {
    this.renderCount = 0;
}

assign$1(Renderer.prototype, {
    fire: function() {
        this.cued = false;
    },

    cue: function() {
        if (this.cued) { return; }
        this.cued = true;
        cue(this);
    },

    push: function(scope) {
        const tokens = this.tokens;
        let n = tokens.length;

        // Todo: keep a renderer-level cache of paths to avoid creating duplicate observers??
        //if (!renderer.paths) {
        //    renderer.paths = {};
        //}

        while (n--) {
            const token = tokens[n];

            // Ignore plain strings
            if (typeof token === 'string') { continue; }

            // Empty or initialise unobservers
            if (token.unobservers) {
                token.unobservers.forEach(call);
                token.unobservers.length = 0;
            }
            else {
                token.unobservers = [];
            }

            observeThing(this, token, token, scope);

            let p = token.pipe && token.pipe.length;
            while (p--) {
                let args = token.pipe[p].args;
                if (!args.length) { continue; }

                // Look for dynamic value objects
                args = args.filter(isValue);
                if (!args.length) { continue; }

                args.forEach((param) => observeThing(this, token, param, scope));
            }
        }
    },

    stop: function stop() {
        uncue(this);

        const tokens = this.tokens;
        let n = tokens.length;

        while (n--) {
            const token = tokens[n];

            if (token.unobservers) {
                token.unobservers.forEach(call);
                token.unobservers.length = 0;
            }
        }

        this.stop = noop;
    }
});

const assign$2 = Object.assign;

function isTruthy(token) {
	return !!token.valueOf();
}

function renderBooleanAttribute(name, node, value) {
	if (value) {
		node.setAttribute(name, name);
	}
	else {
		node.removeAttribute(name);
	}

	// Return DOM mutation count
	return 1;
}

function renderProperty(name, node, value) {
	node[name] = value;

	// Return DOM mutation count
	return 1;
}

function BooleanRenderer(tokens, node, name) {
    Renderer.call(this);

    this.label  = 'Boolean';
	this.node   = node;
    this.name   = name;
	this.tokens = tokens;
	this.render = name in node ?
		renderProperty :
		renderBooleanAttribute ;
}

assign$2(BooleanRenderer.prototype, Renderer.prototype, {
    fire: function renderBoolean() {
        Renderer.prototype.fire.apply(this);

        const value = !!this.tokens.find(isTruthy);

        // Avoid rendering the same value twice
        if (this.renderedValue === value) { return 0; }

		// Return DOM mutation count
        this.renderCount += this.render(this.name, this.node, value);
		this.renderedValue = value;
    }
});

const assign$3 = Object.assign;

// Matches anything that contains a non-space character
const rtext = /\S/;

// Matches anything with a space
const rspaces = /\s+/;


function addClasses(classList, text) {
    var classes = text.trim().split(rspaces);
    classList.add.apply(classList, classes);

    // Return DOM mutation count
    return 1;
}

function removeClasses(classList, text) {
    var classes = text.trim().split(rspaces);
    classList.remove.apply(classList, classes);

    // Return DOM mutation count
    return 1;
}

function partitionByType(data, token) {
    data[typeof token].push(token);
    return data;
}

function ClassRenderer(tokens, node) {
    Renderer.call(this);

    this.label  = 'Class';

    const types = tokens.reduce(partitionByType, {
        string: [],
        object: []
    });

    this.tokens = types.object;
    this.classList = classes(node);

    // Overwrite the class with just the static text
    node.setAttribute('class', types.string.join(' '));
}

assign$3(ClassRenderer.prototype, Renderer.prototype, {
    fire: function renderBoolean() {
        Renderer.prototype.fire.apply(this);

        const list  = this.classList;
        const value = this.tokens.join(' ');

        // Avoid rendering the same value twice
        if (this.renderedValue === value) {
            return;
        }

        this.renderCount += this.renderedValue && rtext.test(this.renderedValue) ?
            removeClasses(list, this.renderedValue) :
            0 ;

        this.renderCount += value && rtext.test(value) ?
            addClasses(list, value) :
            0 ;

        this.renderedValue = value;
    }
});

const assign$4 = Object.assign;

function StringRenderer(tokens, render, node, name) {
    Renderer.call(this);
    this.label  = 'String';
    this.render = render;
    this.node   = node;
    this.name   = name;
    this.tokens = tokens;
}

assign$4(StringRenderer.prototype, Renderer.prototype, {
    fire: function renderString() {
        Renderer.prototype.fire.apply(this);

        // Causes token.toString() to be called
        const value = this.tokens.join('');

        // Avoid rendering the same value twice
        if (this.renderedValue === value) { return; }

        // Return DOM mutation count
        this.renderCount += this.render(this.name, this.node, value);
        this.renderedValue = value;
    }
});

const assign$5 = Object.assign;

function observeMutations(node, fn) {
    var observer = new MutationObserver(fn);
    observer.observe(node, { childList: true });
    return function unobserveMutations() {
        observer.disconnect();
    };
}

function TokenRenderer(token, render, node, name) {
    Renderer.call(this);

    this.label  = 'Token';
    this.render = render;
    this.node   = node;
    this.name   = name;
    this.tokens = [token];

    // Observe mutations to select children, they alter the value of
    // the select, and try to preserve the value if possible
    if (node.tagName.toLowerCase() === 'select') {
        this.unobserveMutations = observeMutations(node, () => {
            if (node.value === this.renderedValue + '') { return; }
            this.renderedValue = undefined;
            cue(this);
        });
    }
}

assign$5(TokenRenderer.prototype, Renderer.prototype, {
    fire: function renderValue() {
        Renderer.prototype.fire.apply(this);

        const token = this.tokens[0];
        const value = token.valueOf();

        // Avoid rendering the same value twice
        if (this.renderedValue === value) {
            return;
        }

        this.renderCount += this.render(this.name, this.node, value);
        this.renderedValue = value;
    },

    stop: function stop() {
        Renderer.prototype.stop.apply(this, arguments);
        this.unobserveMutations && this.unobserveMutations();
    }
});

const inputMap  = new WeakMap();
const changeMap = new WeakMap();

const listenRootNode = weakCache(function(rootNode) {
    if (!rootNode) {
        throw new Error('listenRootNode called with ' + rootNode);
    }

    // Delegate input and change handlers to the document at the cost of
    // one WeakMap lookup, and using the capture phase so that accompanying
    // scope is updated before any other handlers do anything

    rootNode.addEventListener('input', function(e) {
        const fn = inputMap.get(e.target);
        if (!fn) { return; }
        fn(e.target.value);
    }, { capture: true });

    rootNode.addEventListener('change', function(e) {
        const fn = changeMap.get(e.target);
        if (!fn) { return; }
        fn(e.target.value);
    }, { capture: true });

    console.log('Sparky listening to rootNode', rootNode);

    return rootNode;
});

function getInvert(name) {
    return transformers[name] && transformers[name].ix;
}

function fire() {
    Renderer.prototype.fire.apply(this, arguments);

    // Test for undefined and if so set value on scope from the current
    // value of the node. Yes, this means the data can change unexpectedly
    // but the alternative is inputs that jump values when their scope
    // is replaced.
    if (getPath$1(this.path, this.scope) === undefined) {
        // A fudgy hack. A hacky fudge.
        this.token.noRender = true;
        this.fn();
        this.token.noRender = false;
    }
}

function Listener(node, token, eventType, read, readAttributeValue, coerce) {
    this.label = "Listener";
    this.node  = node;
    this.token = token;
    this.path  = token.path;
    this.pipe  = token.pipe;
    this.type  = eventType;
    this.renderCount = 0;
    this.read = read;
    this.readAttributeValue = readAttributeValue;
    this.coerce = coerce || id;
    this.fns   = eventType === 'input' ? inputMap :
        eventType === 'change' ? changeMap :
        undefined ;
}

Object.assign(Listener.prototype, {
    transform: id,

    set: noop,

    fire: function() {
        Renderer.prototype.fire.apply(this, arguments);

        // First render, set up reverse pipe
        if (this.pipe) {
            this.transform = pipe$1.apply(null,
                this.pipe
                .map((data) => {
                    const fn = getInvert(data.name);
                    if (!fn) { throw new Error('Sparky invert fn ' + data.name + '() not found.'); }

                    console.log(data.args);

                    // If there are arguments apply them to fn
                    return data.args && data.args.length ?
                        (value) => fn(...data.args, value) :
                        fn;
                })
                .reverse()
            );
        }

        // Define the event handler
        this.fn = () => {
            const value = this.coerce(this.read(this.node));
            // Allow undefined to pass through with no transform
            this.set(value !== undefined ? this.transform(value) : undefined);
        };

        listenRootNode(this.node.getRootNode());

        // Add it to the delegate pool
        this.fns.set(this.node, this.fn);

        // Handle subsequent renders by replacing this fire method
        this.fire = fire;

        // Set the original value on the scope
        if (getPath$1(this.path, this.scope) === undefined) {
            // Has this element already had its value property set? Custom
            // elements may not yet have the value property
            if ('value' in this.node) {
                this.fn();
            }
            else {
                // A fudgy hack. A hacky fudge.
                this.token.noRender = true;
                this.set(this.transform(this.coerce(this.readAttributeValue(this.node))));
                this.token.noRender = false;
            }
        }
    },

    push: function(scope) {
        this.scope = scope;

        if (scope[this.path] && scope[this.path].setValueAtTime) {
            // Its an AudioParam... oooo... eeeuuuhhh...
            this.set = (value) => {
                if (value === undefined) { return; }
                Target(scope)[this.path].setValueAtTime(value, scope.context.currentTime);
            };
        }
        else {
            this.set = setPath(this.path, scope);
        }

        // Wait for values to have been rendered on the next frame
        // before setting up. This is so that min and max and other
        // constraints have had a chance to affect value before it is
        // read and set on scope.
        cue(this);
        return this;
    },

    stop: function() {
        this.fns.delete(this.node);
        return this;
    }
});

const DEBUG$3 = window.DEBUG === true || window.DEBUG === 'Sparky';

const A$1      = Array.prototype;
const assign$6 = Object.assign;

const $cache = Symbol('cache');

const cased = {
    viewbox: 'viewBox'
};


// Helpers

const getType = get$1('type');

const getNodeType = get$1('nodeType');

const types = {
    'number':     'number',
    'range':      'number'
};

function push(value, pushable) {
    pushable.push(value);
    return value;
}

function stop$1(object) {
    object.stop();
    return object;
}


// Pipes

const pipesCache = transforms[$cache] = {};

function getTransform(name) {
    return transformers[name] ?
        transformers[name].tx :
        transforms[name] ;
}

function createPipe(array, pipes) {
    // Cache is dependent on pipes object - a new pipes object
    // results in a new cache
    const localCache = pipes
        && (pipes[$cache] || (pipes[$cache] = {}));

    // Cache pipes for reuse by other tokens
    const key = JSON.stringify(array);

    // Check global and local pipes caches
    if (pipesCache[key]) { return pipesCache[key]; }
    if (localCache && localCache[key]) { return localCache[key]; }

    // All a bit dodgy - we cycle over transforms and switch the cache to
    // local cache if a global pipe is not found...
    var cache = pipesCache;
    const fns = array.map((data) => {
        // Look in global pipes first
        var fn = getTransform(data.name);

        if (!fn) {
            if (DEBUG$3 && !pipes) {
                throw new ReferenceError('Template pipe "' + data.name + '" not found.');
            }

            // Switch the cache, look in local pipes
            cache = localCache;
            fn = pipes[data.name];

            if (DEBUG$3 && !fn) {
                throw new ReferenceError('Template pipe "' + data.name + '" not found.');
            }
        }

        // If there are arguments apply them to fn
        return data.args && data.args.length ?
            (value) => fn(...data.args, value) :
            fn ;
    });

    // Cache the result
    return (cache[key] = pipe$1.apply(null, fns));
}

function assignTransform(pipes, token) {
    if (token.pipe) {
        token.transform = createPipe(token.pipe, pipes);
    }

    return pipes;
}


// Read

function coerceString(value) {
    // Reject empty strings
    return value || undefined;
}

function coerceNumber(value) {
    // Reject non-number values including NaN
    value = +value;
    return value || value === 0 ? value : undefined ;
}

function readValue(node) {
    // Falsy values other than false or 0 should return undefined,
    // meaning that an empty <input> represents an undefined property
    // on scope.
    const value = node.value;
    return value || value === 0 ? value : undefined ;
}

function readCheckbox(node) {
    // Check whether value is defined to determine whether we treat
    // the input as a value matcher or as a boolean
    return isDefined(node.getAttribute('value')) ?
        // Return string or undefined
        node.checked ? node.value : undefined :
        // Return boolean
        node.checked ;
}

function readRadio(node) {
    if (!node.checked) { return; }

    return isDefined(node.getAttribute('value')) ?
        // Return value string
        node.value :
        // Return boolean
        node.checked ;
}

function readAttributeValue(node) {
    // Get original value from attributes. We cannot read properties here
    // because custom elements do not yet have their properties initialised
    return node.getAttribute('value') || undefined;
}

function readAttributeChecked(node) {
    // Get original value from attributes. We cannot read properties here
    // because custom elements do not yet have their properties initialised
    const value    = node.getAttribute('value');
    const checked  = !!node.getAttribute('checked');
    return value ? value : checked ;
}


// Render

function renderText(name, node, value) {
    node.nodeValue = value;

    // Return DOM mod count
    return 1;
}

function renderAttribute(name, node, value) {
    node.setAttribute(cased[name] || name, value);

    // Return DOM mod count
    return 1;
}

function renderProperty$1(name, node, value) {
    // Bit of an edge case, but where we have a custom element that has not
    // been upgraded yet, but it gets a property defined on its prototype when
    // it does upgrade, setting the property on the instance now will mask the
    // ultimate get/set definition on the prototype when it does arrive.
    //
    // So don't, if property is not in node. Set the attribute, it will be
    // picked up on upgrade.
    if (name in node) {
        node[name] = value;
    }
    else {
        node.setAttribute(name, value);
    }

    // Return DOM mutation count
    return 1;
}

function renderPropertyBoolean(name, node, value) {
    if (name in node) {
        node[name] = value;
    }
    else if (value) {
        node.setAttribute(name, name);
    }
    else {
        node.removeAttribute(name);
    }

    // Return DOM mutation count
    return 1;
}

function renderValue(name, node, value) {
    // Don't render into focused nodes, it makes the cursor jump to the
    // end of the field, plus we should cede control to the user anyway
    if (document.activeElement === node) {
        return 0;
    }

    value = typeof value === (types[node.type] || 'string') ?
        value :
        null ;

    // Avoid updating with the same value. Support values that are any
    // type as well as values that are always strings
    if (value === node.value || (value + '') === node.value) { return 0; }

    const count = renderProperty$1('value', node, value);

    // Event hook (validation in dom lib)
    trigger('dom-update', node);

    // Return DOM mod count
    return count;
}

function renderValueNumber(name, node, value) {
    // Don't render into focused nodes, it makes the cursor jump to the
    // end of the field, and we should cede control to the user anyway
    if (document.activeElement === node) { return 0; }

    // Be strict about type, dont render non-numbers
    value = typeof value === 'number' ? value : null ;

    // Avoid updating with the same value. Beware that node.value
    // may be a string (<input>) or number (<range-control>)
    if (value === (node.value === '' ? null : +node.value)) { return 0; }

    const count = renderProperty$1('value', node, value);

    // Event hook (validation in dom lib)
    trigger('dom-update', node);

    // Return DOM mod count
    return count;
}

function renderChecked(name, node, value) {
    // Where value is defined check against it, otherwise
    // value is "on", uselessly. Set checked state directly.
    const checked = isDefined(node.getAttribute('value')) ?
        value === node.value :
        value === true ;

    if (checked === node.checked) { return 0; }

    const count = renderPropertyBoolean('checked', node, checked);

    // Event hook (validation in dom lib)
    trigger('dom-update', node);

    // Return DOM mod count
    return count;
}


// Mount

function mountToken(source, render, renderers, options, node, name) {
    // Shortcut empty string
    if (!source) { return; }

    const token = parseToken(source);
    if (!token) { return; }

    // Create transform from pipe
    assignTransform(options.pipes, token);
    const renderer = new TokenRenderer(token, render, node, name);
    renderers.push(renderer);
    return renderer;
}

function mountString(source, render, renderers, options, node, name) {
    // Shortcut empty string
    if (!source) { return; }

    const tokens = parseText([], source);
    if (!tokens) { return; }

    // Create transform from pipe
    tokens.reduce(assignTransform, options.pipes);

    const renderer = new StringRenderer(tokens, render, node, name);
    renderers.push(renderer);
    return renderer;
}

function mountAttribute(name, node, renderers, options, prefixed) {
    name = cased[name] || name;

    var source = prefixed !== false && node.getAttribute(options.attributePrefix + name);

    if (source) {
        node.removeAttribute(options.attributePrefix + name);
    }
    else {
        source = node.getAttribute(name);
    }

    return mountString(source, renderAttribute, renderers, options, node, name);
}

function mountAttributes(names, node, renderers, options) {
    var name;
    var n = -1;

    while ((name = names[++n])) {
        mountAttribute(name, node, renderers, options);
    }
}

function mountBoolean(name, node, renderers, options) {
    // Look for prefixed attributes before attributes.
    //
    // In FF, the disabled attribute is set to the previous value that the
    // element had when the page is refreshed, so it contains no sparky
    // tags. The proper way to address this problem is to set
    // autocomplete="off" on the parent form or on the field.
    const prefixed = node.getAttribute(options.attributePrefix + name);

    if (prefixed) {
        node.removeAttribute(options.attributePrefix + name);
    }

    const source = prefixed || node.getAttribute(name);
    if (!source) { return; }

    const tokens = parseBoolean([], source);
    if (!tokens) { return; }

    // Create transform from pipe
    tokens.reduce(assignTransform, options.pipes);

    const renderer = new BooleanRenderer(tokens, node, name);
    renderers.push(renderer);
    return renderer;
}

function mountBooleans(names, node, renderers, options) {
    var name;
    var n = -1;

    while ((name = names[++n])) {
        mountBoolean(name, node, renderers, options);
    }
}

function mountClass(node, renderers, options) {
    const prefixed = node.getAttribute(options.attributePrefix + 'class');

    if (prefixed) {
        node.removeAttribute(options.attributePrefix + 'class');
    }

    // Are there classes?
    const source = prefixed || node.getAttribute('class');
    if (!source) { return; }

    const tokens = parseText([], source);
    if (!tokens) { return; }

    // Create transform from pipe
    tokens.reduce(assignTransform, options.pipes);

    const renderer = new ClassRenderer(tokens, node);
    renderers.push(renderer);
}

function mountValueProp(node, renderers, options, render, eventType, read, readAttribute, coerce) {
    const prefixed = node.getAttribute(options.attributePrefix + 'value');

    if (prefixed) {
        node.removeAttribute(options.attributePrefix + 'value');
    }

    const source   = prefixed || node.getAttribute('value');
    const renderer = mountToken(source, render, renderers, options, node, 'value');
    if (!renderer) { return; }

    // Insert a new listener ahead of the renderer so that on first
    // cue the listener populates scope from the input value first
    const listener = new Listener(node, renderer.tokens[0], eventType, read, readAttribute, coerce);
    renderers.splice(renderers.length - 1, 0, listener);
}

function mountValueChecked(node, renderers, options, render, read, readAttribute, coerce) {
    const source = node.getAttribute('value') ;
    mountString(source, renderProperty$1, renderers, options, node, 'value');

    const sourcePre = node.getAttribute(options.attributePrefix + 'value');
    const renderer = mountToken(sourcePre, render, renderers, options, node, 'value');
    if (!renderer) { return; }

    // Insert a new listener ahead of the renderer so that on first
    // cue the listener populates scope from the input value first
    const listener = new Listener(node, renderer.tokens[0], 'change', read, readAttribute, coerce);
    renderers.splice(renderers.length - 1, 0, listener);
}

const mountValue = choose({
    number: function(node, renderers, options) {
        return mountValueProp(node, renderers, options, renderValueNumber, 'input', readValue, readAttributeValue, coerceNumber);
    },

    range: function(node, renderers, options) {
        return mountValueProp(node, renderers, options, renderValueNumber, 'input', readValue, readAttributeValue, coerceNumber);
    },

    checkbox: function(node, renderers, options) {
        return mountValueChecked(node, renderers, options, renderChecked, readCheckbox, readAttributeChecked);
    },

    radio: function(node, renderers, options) {
        return mountValueChecked(node, renderers, options, renderChecked, readRadio, readAttributeChecked);
    },

    file: function(node, renderers, options) {
        // Safari does not send input events on file inputs
        return mountValueProp(node, renderers, options, renderValue, 'change', readValue, readAttributeValue, coerceString);
    },

    default: function(node, renderers, options) {
        return mountValueProp(node, renderers, options, renderValue, 'input', readValue, readAttributeValue, coerceString);
    }
});

const kinds = {
    text: 'string',
    checkbox: 'checkbox',
    date: 'string',
    number: 'number',
    radio: 'radio',
    range: 'number',
    time: 'string',
    'select-one': 'string',
    'select-multiple': 'array',
    textarea: 'string'
};

function mountTag(settings, node, name, renderers, options) {
    var setting = settings[name];
    if (!setting) { return; }
    if (setting.booleans)   { mountBooleans(setting.booleans, node, renderers, options); }
    if (setting.attributes) { mountAttributes(setting.attributes, node, renderers, options); }

    var type = getType(node);
    if (!type) { return; }

    var typeSetting = setting.types && setting.types[type];
    if (typeSetting) {
        if (typeSetting.booleans) { mountBooleans(typeSetting.booleans, node, renderers, options); }
        if (typeSetting.attributes) { mountAttributes(typeSetting.attributes, node, renderers, options); }
    }

    if (kinds[type]) { mountValue(kinds[type], node, renderers, options); }
}

function mountCollection(children, renderers, options, level) {
    var n = -1;
    var child;

    while ((child = children[++n])) {
        mountNode(child, renderers, options, level);
    }
}

const mountNode = overload(getNodeType, {
    // element
    1: function mountElement(node, renderers, options, level) {
        // Avoid remounting the node we are already trying to mount
        if (level !== 0) {
            const sparky = options.mount && options.mount(node, options);

            if (sparky) {
                renderers.push(sparky);
                return;
            }
        }

        // Ignore SVG <defs>, which we consider as equivalent to the inert
        // content of HTML <template>
        var name = tag(node);
        if (name === 'defs') {
            return;
        }

        // Get an immutable list of children. Remember node.childNodes is
        // dynamic, and we don't want to mount elements that may be dynamically
        // inserted during mounting, so turn childNodes into an array first.
        mountCollection(Array.from(node.childNodes), renderers, options, ++level);
        mountClass(node, renderers, options);

        options.parse.default
        && options.parse.default.booleans
        && mountBooleans(options.parse.default.booleans, node, renderers, options);

        options.parse.default
        && options.parse.default.attributes
        && mountAttributes(options.parse.default.attributes, node, renderers, options);

        mountTag(options.parse, node, name, renderers, options);
    },

    // text
    3: function mountText(node, renderers, options) {
        mountString(node.nodeValue, renderText, renderers, options, node);
    },

    // comment
    8: noop,

    // document
    9: function mountDocument(node, renderers, options, level) {
        mountCollection(A$1.slice.apply(node.childNodes), renderers, options, ++level);
    },

    // doctype
    10: noop,

    // fragment
    11: function mountFragment(node, renderers, options, level) {
        mountCollection(A$1.slice.apply(node.childNodes), renderers, options, ++level);
    },

    default: function(node) {
        throw new TypeError('mountNode(node) node is not a mountable Node');
    }
});


/**
Mount(node, options)

`const mount = Mount(node, options);`

A mount is a pushable stream. Push an object of data to render the templated
node on the next animation frame.

```
mount.push(data);
```
*/

function Mount(node, options) {
    if (!Mount.prototype.isPrototypeOf(this)) {
        return new Mount(node, options);
    }

    this.renderers = [];

    // mountNode(node, renderers, options, level)
    mountNode(node, this.renderers, options, 0);
}

assign$6(Mount.prototype, {
    stop: function() {
        this.renderers.forEach(stop$1);
        return this;
    },

    push: function(scope) {
        // Dedup
        if (this.scope === scope) {
            return this;
        }

        // Set new scope
        this.scope = scope;
        this.renderers.reduce(push, scope);
        return this;
    }
});

const DEBUG$4 = window.DEBUG === true || window.DEBUG === 'Sparky';

const assign$7 = Object.assign;

const captureFn = capture(/^\s*([\w-]+)\s*(:)?/, {
    1: function(output, tokens) {
        output.name = tokens[1];
        return output;
    },

    2: function(output, tokens) {
        output.params = parseParams([], tokens);
        return output;
    },

    close: function(output, tokens) {
        // Capture exposes consumed index as .consumed
        output.remainingString = tokens.input.slice(tokens[0].length + (tokens.consumed || 0));
        return output;
    }
});

function valueOf(object) {
    return object.valueOf();
}

function toObserverOrSelf(object) {
    return Observer(object) || object;
}

function replace(target, content) {
    before(target, content);
    //target.before(content);
    target.remove();
}

function prepareInput(input, output) {
    // Support promises and streams P
    const stream = output.then ?
        new Stream(function(push, stop) {
            output
            .then(push)
            .catch(stop);
            return { stop };
        }) :
        output ;

    input.done(() => stream.stop());

    // Make sure the next fn gets an observable
    return stream.map(toObserverOrSelf);
}

function run$1(context, node, input, options) {
    var result;

    while(input && options.fn && (result = captureFn({}, options.fn))) {
        // Find Sparky function by name, looking in global functions
        // first, then local options. This order makes it impossible to
        // overwrite built-in fns.
        const fn = functions[result.name] || (options.functions && options.functions[result.name]);

        if (!fn) {
            if (DEBUG$4) { console.groupEnd(); }
            throw new Error(
                'Sparky function "'
                + result.name
                + '" not found mounting node '
                + nodeToString(node)
            );
        }

        options.fn = result.remainingString;

        if (fn.settings) {
            // Overwrite functions / pipes
            assign$7(options, fn.settings);
        }

        // Return values from Sparky functions mean -
        // stream    - use the new input stream
        // promise   - use the promise
        // undefined - use the same input streeam
        // false     - stop processing this node
        const output = fn.call(input, node, result.params, options) ;

        // Output false means stop processing the node
        if (output === false) {
            return false;
        }

        // If output is defined and different from input
        if (output && output !== input) {
            input = prepareInput(input, output);
        }
    }

    return input;
}

function mountContent(content, options) {
    // Launch rendering
    return new Mount(content, options);
}

function setupTarget(src, input, render, options, renderers) {
    // If there are no dynamic tokens to render, return the include
    if (!src) {
        throw new Error('Sparky attribute src cannot be empty');
    }

    const tokens = parseText([], src);

    // If there are no dynamic tokens to render, return the include
    if (!tokens) {
        return setupSrc(src, input, render, options, renderers);
    }

    // Create transform from pipe
	tokens.reduce(assignTransform, options.pipes);

    let output  = nothing;
    let prevSrc = null;

    function update(scope) {
        const values = tokens.map(valueOf);

        // Tokens in the src tag MUST evaluate in order that a template
        // may be rendered.
        //
        // If any tokens evaluated to undefined (which can happen frequently
        // because observe is not batched, it will attempt to update() before
        // all tokens have value) we don't want to go looking for a template.
        if (values.indexOf(undefined) !== -1) {
            if (prevSrc !== null) {
                render(null);
                prevSrc = null;
            }

            return;
        }

        // Join the tokens together
        const src = values
        .map(toText)
        .join('');

        // If template path has not changed
        if (src === prevSrc) {
            output.push(scope);
            return;
        }

        prevSrc = src;

        // Stop the previous
        output.stop();

        // If src is empty string render nothing
        if (!src) {
            if (prevSrc !== null) {
                render(null);
                prevSrc = null;
            }

            output = nothing;
            return;
        }

        // Push scope to the template renderer
        output = Stream.of(scope);
        setupSrc(src, output, render, options, renderers);
    }

    input
    .each(function(scope) {
        let n = tokens.length;

        while (n--) {
            const token = tokens[n];

            // Ignore plain strings
            if (typeof token === 'string') { continue; }

            // Passing in NaN as an initial value to observe() forces the
            // callback to be called immediately. It's a bit tricksy, but this
            // works because even NaN !== NaN.
            token.unobserve && token.unobserve();
            token.unobserve = observe(token.path, (value) => {
                token.value = value;
                update(scope);
            }, scope, NaN);
        }
    })
    .done(() => {
        output.stop();
    });
}

function setupSrc(src, input, firstRender, options, renderers) {
    // Strip off leading # before running the test
    const source = document.getElementById(src.replace(/^#/, ''));

    if (source) {
        const content = source.content ? source.content.cloneNode(true) :
            source instanceof SVGElement ? source.cloneNode(true) :
            undefined ;

        return setupInclude(content, input, firstRender, options, renderers);
    }

    importTemplate(src)
    .then((node) => {
        if (input.status === 'done') { return; }

        const content =
            // Support templates
            node.content ? node.content.cloneNode(true) :
            // Support SVG elements
            node instanceof SVGElement ? node.cloneNode(true) :
            // Support body elements imported from exernal documents
            fragmentFromChildren(node) ;

        setupInclude(content, input, firstRender, options, renderers);
    })
    // Swallow errors – unfound templates should not stop the rendering of
    // the rest of the tree – but log them to the console as errors.
    .catch((error) => {
        console.error(error.stack);
    });
}

function setupInclude(content, input, firstRender, options, renderers) {
    var renderer;

    input.each((scope) => {
        if (renderer) {
            return renderer.push(scope);
        }

        renderer = isFragmentNode(content) ?
            mountContent(content, options) :
            new Sparky(content, options) ;

        renderer.push(scope);
        firstRender(content);

        // This is async, but we also need to stop sync...
        //input.done(() => renderer.stop());
        renderers.push(renderer);
    });
}

function setupElement(target, input, options, sparky, renderers) {
    var renderer;

    input.each((scope) => {
        if (renderer) {
            return renderer.push(scope);
        }

        renderer = mountContent(target.content || target, options);
        renderer.push(scope);

        // If target is a template, replace it
        if (target.content) {
            replace(target, target.content);

            // Increment mutations for logging
            ++sparky.renderCount;
        }

        // This is async, but we also need to stop sync...
        //input.done(() => renderer.stop());
        renderers.push(renderer);
    });
}

function setupTemplate(target, src, input, options, sparky, renderers) {
    const nodes = { 0: target };

    return setupTarget(src, input, (content) => {
        // Store node 0
        const node0 = nodes[0];

        // Remove nodes from 1 to last
        var n = 0;
        while (nodes[++n]) {
            nodes[n].remove();
            nodes[n] = undefined;

            // Update count for logging
            ++sparky.renderCount;
        }

        // If there is content cache new nodes
        if (content && content.childNodes && content.childNodes.length) {
            assign$7(nodes, content.childNodes);
        }

        // Otherwise content is a placemarker text node
        else {
            content = nodes[0] = target.content ?
                DEBUG$4 ?
                    create('comment', ' src="' + src + '" ') :
                    create('text', '') :
                target ;
        }

        // Replace child 0, which we avoided doing above to keep it as a
        // position marker in the DOM for exactly this reason...
        replace(node0, content);

        // Update count for logging
        ++sparky.renderCount;
    }, options, renderers);
}

function setupSVG(target, src, input, options, sparky, renderers) {
    return setupTarget(src, input, (content) => {
        content.removeAttribute('id');

        replace(target, content);
        target = content;

        // Increment mutations for logging
        ++sparky.renderCount;
    }, options, renderers);
}

function makeLabel(target, options) {
    return '<'
        + (target.tagName ? target.tagName.toLowerCase() : '')
        + (options.fn ? ' fn="' + options.fn + '">' : '>');
}

function invokeStop(renderer) {
    renderer.stop();
}

/**
Sparky(nodeOrSelector)

Mounts any element as a template and returns a pushable stream. Push an object
to the stream to have it rendered by the template:

```html
<div id="title-div">
    I am {[title]}.
</div>
```
```
import Sparky from '/sparky/module.js';

// Mount the <div>
const sparky = Sparky('#title-div');

// Render it by pushing in an object
sparky.push({ title: 'rendered' });
```

Results in:

```html
<div id="title-div">
    I am rendered.
</div>
```
*/



/**
src=""

Templates may include other templates. Define the `src` attribute
as an href to a template:

```html
<template id="i-am-title">
    I am {[title]}.
</template>

<template is="sparky-template" fn="fetch:package.json" src="#i-am-title"></template>

I am Sparky.
```

Templates may be composed of includes:

```html
<template id="i-am-title">
    I am {[title]}.
</template>

<template is="sparky-template" fn="fetch:package.json">
    <template src="#i-am-title"></template>
    <template src="#i-am-title"></template>
</template>

I am Sparky.
I am Sparky.
```
*/

function setupSparky(sparky, target, options) {
    const input = Stream.of().map(toObserverOrSelf);
    const output = run$1(null, target, input, options);

    sparky.push = function push() {
        input.push(arguments[arguments.length - 1]);
        return this;
    };

    // If output is false do not go on to parse and mount content,
    // a fn is signalling that it will take over. fn="each" does this,
    // for example, replacing the original node and Sparky with duplicates.
    if (!output) {
        sparky.stop = function () {
            input.stop();
            return this;
        };

        return sparky;
    }

    const renderers = [];
    const name = tag(target) || 'fragment';
    const src = options.src || (
        name === 'use' ?      target.getAttribute(options.attributeSrc) :
        name === 'template' ? target.getAttribute(options.attributeSrc) :
        null
    );

    // We have consumed fn and src lets make sure they are not read again...
    // Todo: This shouldn't be needed if we program properly
    options.fn  = null;
    options.src = null;

    //if (DEBUG) { logNode(target, options.fn, options.src); }

    src ?
        name === 'use' ?
            setupSVG(target, src, output, options, sparky, renderers) :
            setupTemplate(target, src, output, options, sparky, renderers) :
        name === 'fragment' ?
            setupElement(target, output, options, sparky, renderers) :
            setupElement(target, output, options, sparky, renderers) ;

    sparky.stop = function () {
        input.stop();

        // Renderers need to be stopped sync, or they allow one more frame
        // to render before stopping
        renderers.forEach(invokeStop);
        renderers.length = 0;

        return this;
    };

    output.done(stop);

    return sparky;
}

function mountSparky(node, options) {
    // Does the node have Sparkyfiable attributes?
    if (!(options.fn = node.getAttribute(options.attributeFn))
        && !(
            tag(node) === 'template' &&
            (options.src = node.getAttribute(options.attributeSrc)))
        && !(
            tag(node) === 'use' &&
            (options.src = node.getAttribute(options.attributeSrc)))
    ) {
        return;
    }

    // Return a writeable stream. A writeable stream
    // must have the methods .push() and .stop().
    // A Sparky() is a write stream.
    var sparky = setupSparky({
        label: makeLabel(node, options),
        renderCount: 0
    }, node, options);

    // Options object is still used by the mounter, reset it
    options.fn  = null;
    options.src = null;

    return sparky;
}

function Sparky(selector, settings) {
    if (!Sparky.prototype.isPrototypeOf(this)) {
        return new Sparky(selector, settings);
    }

    const target = typeof selector === 'string' ?
        document.querySelector(selector) :
        selector ;

    const options = assign$7({ mount: mountSparky }, config, settings);

    options.fn = options.fn
        // Fragments and shadows have no getAttribute
        || (target.getAttribute && target.getAttribute(options.attributeFn))
        || '';

    this.label = makeLabel(target, options);
    this.renderCount = 0;

    setupSparky(this, target, options);
}

register('after', function(node, params) {
    const path = params[0];
    return this.tap((scope) => {
        // Avoid having Sparky parse the contents of documentation by waiting
        // until the next frame
        requestAnimationFrame(function () {
            const fragment = fragmentFromHTML(getPath$1(path, scope));
            node.after(fragment);
        });
    });
});

register('before', function(node, params) {
    const path = params[0];
    return this.tap((scope) => {
        // Avoid having Sparky parse the contents of documentation by waiting
        // until the next frame
        requestAnimationFrame(function () {
            const fragment = fragmentFromHTML(getPath$1(path, scope));
            node.before(fragment);
        });
    });
});

register('append', function (node, params) {
    const path = params[0];
    return this.tap((scope) => {
        // Avoid having Sparky parse the contents of documentation by waiting
        // until the next frame
        requestAnimationFrame(function () {
            const fragment = fragmentFromHTML(getPath$1(path, scope));
            node.appendChild(fragment);
        });
    });
});

register('prepend', function (node, params) {
    const path = params[0];
    return this.tap((scope) => {
        // Avoid having Sparky parse the contents of documentation by waiting
        // until the next frame
        requestAnimationFrame(function () {
            const fragment = fragmentFromHTML(getPath$1(path, scope));
            node.prepend(fragment);
        });
    });
});

const DEBUG$5 = window.DEBUG;

register('debug', function(node) {
    return DEBUG$5 ? this.tap((scope) => {
        console.log('Sparky fn="debug" node:', node,'scope:', scope);
        debugger;
    }) :
    this ;
});

const DEBUG$6 = window.DEBUG;

function MarkerNode(node, options) {
    // A text node, or comment node in DEBUG mode, for marking a
    // position in the DOM tree so it can be swapped out with some
    // content in the future.

    if (!DEBUG$6) {
        return create('text', '');
    }

    var attrFn      = node && node.getAttribute(options ? options.attributeFn : 'fn');
    var attrInclude = node && node.getAttribute(options ? options.attributeSrc : 'include');

    return create('comment',
        tag(node) +
        (attrFn ? ' ' + (options ? options.attributeFn : 'fn') + '="' + attrFn + '"' : '') +
        (attrInclude ? ' ' + (options ? options.attributeSrc : 'include') + '="' + attrInclude + '"' : '')
    );
}

/**
each:

Clones the DOM node and renders a clone for each value in an array.

```html
<ul>
    <li fn="get:keywords each">{[.]}</li>
</ul>
```
```html
<ul>
    <li>javascript</li>
	<li>browser</li>
</ul>
```

Where there are functions declared after `each` in the attribute, they are run
on each clone.
*/

const A$2       = Array.prototype;
const isArray = Array.isArray;
const assign$8  = Object.assign;
const $scope  = Symbol('scope');


function EachRenderer(node, marker, isOption, options) {
	Renderer.call(this);

	this.label    = 'Each';
	this.node     = node;
    this.marker   = marker;
    this.isOption = isOption;
    this.options  = options;
	this.sparkies = [];
}


assign$8(EachRenderer.prototype, Renderer.prototype, {
	fire: function renderEach(time) {
		Renderer.prototype.fire.apply(this);
		var value = this.value;
		this.value = undefined;
		this.render(value);
	},

	render: function render(array) {
		const node = this.node;
		const marker = this.marker;
		const sparkies = this.sparkies;
		// const isOption = this.isOption;
		const options = this.options;

		// Selects will lose their value if the selected option is removed
		// from the DOM, even if there is another <option> of same value
		// already in place. (Interestingly, value is not lost if the
		// selected <option> is simply moved). Make an effort to have
		// selects retain their value across scope changes.
		//
		// There is also code for something similar in render-token.js
		// maybe have a look and decide on what's right
		//var value = isOption ? marker.parentNode.value : undefined ;

		if (!isArray(array)) {
			array = Object.entries(array).map(entryToKeyValue);
		}

		this.renderCount += reorderCache(node, array, sparkies, options);
		this.renderCount += reorderNodes(marker, array, sparkies);
		this.renderedValue = 'Array(' + array.length + ')';
		// A fudgy workaround because observe() callbacks (like this update
		// function) are not batched to ticks.
		// TODO: batch observe callbacks to ticks.
		//		if (isOption && value !== undefined) {
		//			marker.parentNode.value = value;
		//		}
	},

	stop: function() {
		uncue(this);
		this.sparkies.forEach((sparky) => sparky.stop());
	}
});


// Logic

function createEntry(master, options) {
	const node = master.cloneNode(true);
	const fragment = document.createDocumentFragment();
	fragment.appendChild(node);

	// We treat the sparky object as a store for carrying internal data
	// like fragment and nodes, because we can
	const sparky = new Sparky(node, options);
	sparky.fragment = fragment;
	return sparky;
}

function reorderCache(master, array, sparkies, options) {
	// Reorder sparkies
	var n = -1;
	var renderCount = 0;

	while (++n < array.length) {
		const object = array[n];
		let sparky = sparkies[n];

		if (sparky && object === sparky[$scope]) {
			continue;
		}

		// Scan forward through sparkies to find the sparky that
		// corresponds to the scope object
		let i = n - 1;
		while (sparkies[++i] && sparkies[i][$scope] !== object);

		// Create a new one or splice the existing one out
		sparky = i === sparkies.length ?
			createEntry(master, options) :
			sparkies.splice(i, 1)[0];

		// Splice it into place
		sparkies.splice(n, 0, sparky);
	}

	// Reordering has pushed unused sparkies to the end of
	// sparkies collection. Go ahead and remove them.
	while (sparkies.length > array.length) {
		const sparky = sparkies.pop().stop();

		// If sparky nodes are not yet in the DOM, sparky does not have a
		// .nodes property and we may ignore it, otherwise go ahead
		// and get rid of the nodes
		if (sparky.nodes) {
            renderCount += sparky.nodes.length;
			A$2.forEach.call(sparky.nodes, (node) => node.remove());
		}
	}

	return renderCount;
}

function reorderNodes(node, array, sparkies) {
	// Reorder nodes in the DOM
	const l = sparkies.length;
	const parent = node.parentNode;

	var renderCount = 0;
	var n = -1;

	while (n < l) {
		// Note that node is null where nextSibling does not exist.
		// Passing null to insertBefore appends to the end
		node = node ? node.nextSibling : null ;

		while (++n < l && (!sparkies[n].nodes || sparkies[n].nodes[0] !== node)) {
			if (!sparkies[n][$scope]) {
				sparkies[n].push(array[n]);
				sparkies[n][$scope] = array[n];
			}

			if (sparkies[n].fragment) {
				// Cache nodes in the fragment
				sparkies[n].nodes = Array.from(sparkies[n].fragment.childNodes);

				// Stick fragment in the DOM
				parent.insertBefore(sparkies[n].fragment, node);
				sparkies[n].fragment = undefined;

				// Increment renderCount for logging
				++renderCount;
			}
			else {
				// Reorder exising nodes
				let i = -1;
				while (sparkies[n].nodes[++i]) {
					parent.insertBefore(sparkies[n].nodes[i], node);

					// Increment renderCount for logging
					++renderCount;
				}
			}
		}

		if (!sparkies[n]) { break; }
		node = last$1(sparkies[n].nodes);
	}

	return renderCount;
}

function entryToKeyValue(entry) {
	return {
		key:   entry[0],
		value: entry[1]
	};
}

register('each', function(node, params, options) {
	if (isFragmentNode(node)) {
		throw new Error('Sparky.fn.each cannot be used on fragments.');
	}

	const marker   = MarkerNode(node);
	const isOption = tag(node) === 'option';

	// Put the marker in place and remove the node
	before(node, marker);
	node.remove();

	// The master node has it's fn attribute truncated to avoid setup
	// functions being run again. Todo: This is a bit clunky - can we avoid
	// doing this by passing in the fn string in options to the child instead
	// of reparsing the fn attribute?
	if (options.fn) { node.setAttribute(options.attributeFn, options.fn); }
	else { node.removeAttribute(options.attributeFn); }

	// Prevent further functions being run on current node
	// SHOULD NOT BE NECESSARY - DELETE
	//options.fn = '';

	// Get the value of scopes in frames after it has changed
	const renderer = new EachRenderer(node, marker, isOption, options);
	var unobserve = noop;

	function cueRenderer(scope) {
		renderer.value = scope;
		renderer.cue(scope);
	}

	this
	.latest()
	.dedup()
	.each(function(scope) {
		renderer.value = scope;
		renderer.cue(scope);
		unobserve();
		unobserve = observe('.', cueRenderer, scope);
	})
	.done(function stop() {
		renderer.stop();
		remove(marker);
	});

	// Prevent further processing of this Sparky
	return false;
});

register('entries', function(node, params) {
    return this.map(Object.entries);
});

/**
fetch: url

Fetches and parses a JSON file and uses it as scope to render the node.

```html
<p fn="fetch:package.json">{[title]}!</p>
```

```html
<p>Sparky!</p>
```

*/

const DEBUG$7 = window.DEBUG;

const cache = {};

function importScope(url, scopes) {
    requestGet(url)
    .then(function(data) {
        if (!data) { return; }
        cache[url] = data;
        scopes.push(data);
    })
    .catch(function(error) {
        console.warn('Sparky: no data found at', url);
        //throw error;
    });
}

register('fetch', function(node, params) {
    var path = params[0];

    if (DEBUG$7 && !path) {
        throw new Error('Sparky: ' + Sparky.attributePrefix + 'fn="import:url" requires a url.');
    }

    var scopes = Stream.of();

    // Test for path template
    if (/\$\{(\w+)\}/.test(path)) {
        this.each(function(scope) {
            var url = path.replace(/\$\{(\w+)\}/g, function($0, $1) {
                return scope[$1];
            });

            // If the resource is cached...
            if (cache[url]) {
                scopes.push(cache[url]);
            }
            else {
                importScope(url, scopes);
            }
        });

        return scopes;
    }

    // If the resource is cached, return it as a readable
    if (cache[path]) {
        return Stream.of(cache[path]);
    }

    importScope(path, scopes);
    return scopes;
});

/**
get: path

Maps scope to the value at `path` of the current scope:

```html
<a fn="get:repository" href="{[ url ]}">{[type|capitalise]} repository</a>
```

```html
<a href="https://github.com/cruncher/sparky.git">Git repository</a>
```
*/

register('get', function(node, params) {
    return this
    .scan((stream, object) => {
        stream.stop();
        return mutations(params[0], object);
    }, nothing)
    .flat();
});

const DEBUG$8 = window.DEBUG;

register('on', function(node, params) {
    const type   = params[0];
    const length = params.length - 1;

    let flag = false;
    let i = -1;
    let scope;

    const listener = (e) => {
        // Cycle through params[1] to params[-1]
        i = (i + 1) % length;

        const name = params[i + 1];

        if (DEBUG$8 && (!scope || !scope[name])) {
            console.error('Sparky scope', scope);
            throw new Error('Sparky scope has no method "' + name + '"');
        }

        // Buttons have value...
        scope[name](e.target.value);
    };

    return this.tap(function(object) {
        if (!flag) {
            flag = true;

            // Keep event binding out of the critical render path by
            // delaying it
            setTimeout(() => node.addEventListener(type, listener), 10);
        }

        scope = object;
    });
});

register('rest', function (node, params) {
    return this
        .scan((stream, object) => {
            stream.stop();
            return mutations('.', object)
                .map(rest(params[0]));
        }, nothing)
        .flat();
});

const map = new WeakMap();

function getScope(node) {
    if (!map.has(node.correspondingUseElement || node)) {
        throw new Error('Sparky scope is not set on node');
    }

    return map.get(node);
}

register('scope', function(node, params) {
    return this
    .tap((scope) => map.set(node.correspondingUseElement || node, scope))
    .done(() => map.delete(node));
});

register('take', function(node, params) {
    return this
    .scan((stream, object) => {
        stream.stop();
        return mutations('.', object)
        .map(take(params[0]));
    }, nothing)
    .flat();
});

/**
Sparky.pipe(name, fn)

Define a pipe using `Sparky.pipe(name, fn)`.

```js
import Sparky from './sparky/build/module.js';

// Define {[.|my-pipe:param]}
Sparky.pipe('my-pipe', function(param, value) {
    // return something from param and value
});
```

A pipe may take any number of params; the final parameter is the
value being piped frmo the tag scope.

Pipes are called during the render process on the next animation frame
after the value of a tag has changed. It is best not to do anything
too expensive in a pipe to keep the render process fast.
*/

const DEBUG$9 = !!window.DEBUG;

function pipe(name, fx, ix) {
    if (DEBUG$9 && transformers[name]) {
        throw new Error('Sparky pipe "' + name + '" already defined');
    }

    transformers[name] = {
        tx: fx,
        ix: ix
    };
}

/**
Examples

```js
import Sparky from './sparky/build/module.js';
const tax = 1.175;

// Define {[number|add-tax]}
Sparky.pipe('add-tax', function(value) {
    return value * tax;
});
```
*/

function createArgs(e, selector) {
    const node = e.target.closest(selector);
    // Default to undefined, the stream filters out undefined
    return node ? [node, e] : undefined ;
}

function notDisabled(args) {
    return !args[0].disabled;
}

function listen(scopes, type, selector, fn, node) {
    var stream = events(type, node)
    .map((e) => createArgs(e, selector))
    // Don't listen to disabled nodes
    .filter(notDisabled)
    // Call fn(node, e)
    .each((args) => fn.apply(null, args));

    scopes.done(() => stream.stop());
}

function delegate(types, selector, fn) {
    return typeof types === 'object' ?
        function delegate(node) {
            var type;
            for (type in types) {
                for (selector in types[type]) {
                    listen(this, type, selector, types[type][selector], node);
                }
            }
        } :
        function delegate(node) {
            listen(this, types, selector, fn, node);
        } ;
}

// Sparky

// Sparky colour scheme
//
// #d0e84a
// #b9d819 - Principal bg colour
// #a3b31f
// #858720
// #d34515
// #915133
// #723f24
// #6894ab
// #4a6a7a
// #25343c
// #282a2b

if (window.console && window.console.log) {
    console.log('%cSparky%c      - https://labs.cruncher.ch/sparky', 'color: #a3b31f; font-weight: 600;', 'color: inherit; font-weight: 300;');
}

const DEBUG$a = window.DEBUG === true || window.DEBUG === 'sparky';

Sparky.fn = register;
Sparky.pipe = pipe;

const assign$9 = Object.assign;

/*
Sparky templates

First, import Sparky:

```js
import '/sparky/module.js';
```

Sparky registers the `is="sparky-template"` custom element. Sparky templates
in the DOM are automatically replaced with their own rendered content:

```html
<template is="sparky-template">
    Hello!
</template>
```

```html
Hello!
```

Sparky templates extend HTML with 3 features: **template tags**, **functions**
and **includes**.
*/


// Register customised built-in element <template is="sparky-template">
//
// While loading we must wait a tick for sparky functions to register before
// declaring the customised template element. This is a little pants, I admit.
requestTick(function() {
    var supportsCustomBuiltIn = false;

    element('sparky-template', {
        extends: 'template',

        properties: {},

        attributes: {
            src: function(src) {
                this.options.src = src;
            },

            fn: function(fn) {
                this.options.fn = fn;
            }
        },

        construct: function(elem) {
            elem.options = assign$9({
                mount: mountSparky
            }, config);

            // Flag
            supportsCustomBuiltIn = true;
        },

        connect: function(elem) {
            if (DEBUG$a) { logNode(elem, elem.options.fn, elem.options.src); }

            if (elem.options.fn) {
                setupSparky(elem, elem, elem.options);
            }
            else {
                // If there is no attribute fn, there is no way for this sparky
                // to launch as it will never get scope. Enable sparky templates
                // with just an include by passing in blank scope.
                setupSparky(elem, elem, elem.options).push({});
            }
        }
    });

    // If one has not been found already, test for customised built-in element
    // support by force creating a <template is="sparky-template">
    if (!supportsCustomBuiltIn) {
        document.createElement('template', { is: 'sparky-template' });
    }

    // If still not supported, fallback to a dom query for [is="sparky-template"]
    if (!supportsCustomBuiltIn) {
        log("Browser does not support custom built-in elements so we're doin' it oldskool selector stylee.");

        window.document
        .querySelectorAll('[is="sparky-template"]')
        .forEach((template) => {
            const fn  = template.getAttribute(config.attributeFn) || undefined;
            const src = template.getAttribute(config.attributeSrc) || undefined;

            if (fn) {
                Sparky(template, { fn: fn, src: src });
            }
            else {
                // If there is no attribute fn, there is no way for this sparky
                // to launch as it will never get scope. Enable sparky templates
                // with just an include by passing in blank scope.
                Sparky(template, { src: src }).push({});
            }
        });
    }
});

const config$1 = {
    simulatedEventDelay: 0.08,
    keyClass:   'key-device',
    mouseClass: 'mouse-device',
    touchClass: 'touch-device'
};

var list       = classes(document.documentElement);
var currentClass, timeStamp;

function updateClass(newClass) {
    // We are already in mouseClass state, nothing to do
    if (currentClass === newClass) { return; }
    list.remove(currentClass);
    list.add(newClass);
    currentClass = newClass;
}

function mousedown(e) {
    // If we are within simulatedEventDelay of a touchend event, ignore
    // mousedown as it's likely a simulated event. Reset timeStamp to
    // gaurantee that we only block one mousedown at most.
    if (e.timeStamp < timeStamp + config$1.simulatedEventDelay * 1000) { return; }
    timeStamp = undefined;
    updateClass(config$1.mouseClass);
}

function keydown(e) {
    // If key is not tab, enter or escape do nothing
    if ([9, 13, 27].indexOf(e.keyCode) === -1) { return; }
    updateClass(config$1.keyClass);
}

function touchend(e) {
    timeStamp = e.timeStamp;
    updateClass(config$1.touchClass);
}

document.addEventListener('mousedown', mousedown);
document.addEventListener('keydown', keydown);
document.addEventListener('touchend', touchend);

const lines = window.location.search
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
        'button[name]': overload(get$1('name'), {
            'create-line': function(node, e) {
                observer.push({
                    label: '.class',
                    data: [{
                        fontsize: 16
                    }, {}]
                });
            },

            'delete-line': function (node, e) {
                remove$1(observer, getScope(node));
            }
        })
    }
}));

/* Data */

const breakpoints = window.location.search
    &&
    // Breakpoints from the URL
    (new URLSearchParams(window.location.search))
    .get('breakpoints')
    .split(',')
    .map((n) => ({ x: parseInt(n, 10) }))

    ||
    // Default breakpints
    [{ x: 320 }, { x: 1440 }] ;

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

function updateUrlQuery(breakpoints, lines) {
    // Update URL bar without navigating
    window.history.pushState('', '', '?' +
        // Breakpionts
        'breakpoints=' + breakpoints.map(get$1('x')) + '&' +

        // Lines
        lines.map(function(line) {
            return line.label + '=' + line.data.map(get$1('fontsize')).join(',');
        }, '').join('&')
    );
}

function breakpointsAndLines(breakpoints, lines) {
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

            updateUrlQuery(breakpoints, lines);
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
}


mutations('.', breakpoints)
.combine(breakpointsAndLines, mutations('.', lines))
.each(console.log);

Sparky.fn('line-breakpoints', function(node) {
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

Sparky.fn('breakpoints-line', function(node) {
    return this.map(function(line) {
        const data = Observer({
            data:        line.data,
            breakpoints: breakpoints
        });

        function update() {
            data.px = breakpoints[1].c + line.data[1].m * breakpoints[1].n;
        }

        observe('m', update, line.data[1]);
        observe('c', update, breakpoints[1]);
        observe('n', update, breakpoints[1]);

        return data;
    });
});


/* Actions */

const observer$1 = Observer(breakpoints);

Sparky.fn('breakpoints-actions', delegate({
    'click': {
        'button[name]': overload(get$1('name'), {
            'add-breakpoint': function () {
                observer$1.push({
                    x: last(breakpoints).x + 480
                });
            },

            'remove-breakpoint': function () {
                observer$1.length--;
            }
        })
    }
}));

window.breakpoints = breakpoints;
