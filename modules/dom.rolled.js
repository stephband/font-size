// font-size 1.0.2 (Built 2020-07-20 17:24)

import { c as cache$1, S as Stream, o as overload, i as id, p as parseVal, t as toType, a as curry, n as noop, b as toArray, g as get, d as pipe, s as set, l as linear, e as nothing, f as choose } from './fn.rolled.js';

/**
ready(fn)
Calls `fn` on DOM content load, or if later than content load, immediately
(on the next tick).
*/

const ready = new Promise(function(accept, reject) {
	function handle(e) {
		document.removeEventListener('DOMContentLoaded', handle);
		window.removeEventListener('load', handle);
		accept(e);
	}

	document.addEventListener('DOMContentLoaded', handle);
	window.addEventListener('load', handle);
});

var ready$1 = ready.then.bind(ready);

function now() {
   // Return DOM time in seconds
   return window.performance.now() / 1000;
}

const assign      = Object.assign;
const CustomEvent = window.CustomEvent;

const defaults    = {
	// The event bubbles (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	bubbles: true,

	// The event may be cancelled (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	cancelable: true

	// Trigger listeners outside of a shadow root (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
	//composed: false
};

/**
Event(type, properties)

Creates a CustomEvent of type `type`.
Additionally, `properties` are assigned to the event object.
*/

function Event$1(type, options) {
	let settings;

	if (typeof type === 'object') {
		settings = assign({}, defaults, type);
		type = settings.type;
	}

	if (options && options.detail) {
		if (settings) {
			settings.detail = options.detail;
		}
		else {
			settings = assign({ detail: options.detail }, defaults);
		}
	}

	var event = new CustomEvent(type, settings || defaults);

	if (options) {
		delete options.detail;
		assign(event, options);
	}

	return event;
}

/**
prefix(string)
Returns a prefixed CSS property name where a prefix is required in the current
browser.
*/

const prefixes = ['Khtml','O','Moz','Webkit','ms'];

var node = document.createElement('div');
var cache = {};

function testPrefix(prop) {
    if (prop in node.style) { return prop; }

    var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    var l = prefixes.length;
    var prefixProp;

    while (l--) {
        prefixProp = prefixes[l] + upper;

        if (prefixProp in node.style) {
            return prefixProp;
        }
    }

    return false;
}

function prefix(prop){
    return cache[prop] || (cache[prop] = testPrefix(prop));
}

const define = Object.defineProperties;

/**
features

An object of feature detection results.

```
{
    inputEventsWhileDisabled: true, // false in FF, where disabled inputs don't trigger events
    template: true,                 // false in old browsers where template.content not found
    textareaPlaceholderSet: true,   // false in IE, where placeholder is also set on innerHTML
    transition: true,               // false in older browsers where transitions not supported
    fullscreen: true,               // false where fullscreen API not supported
    scrollBehavior: true,           // Whether scroll behavior CSS is supported
    events: {
        fullscreenchange: 'fullscreenchange',
        transitionend:    'transitionend'
    }
}
```
*/

var features = define({
    events: define({}, {
        fullscreenchange: {
            get: cache$1(function() {
                // TODO: untested event names
                return ('fullscreenElement' in document) ? 'fullscreenchange' :
                ('webkitFullscreenElement' in document) ? 'webkitfullscreenchange' :
                ('mozFullScreenElement' in document) ? 'mozfullscreenchange' :
                ('msFullscreenElement' in document) ? 'MSFullscreenChange' :
                'fullscreenchange' ;
            }),

            enumerable: true
        },

        transitionend: {
            // Infer transitionend event from CSS transition prefix

            get: cache$1(function() {
                var end = {
                    KhtmlTransition: false,
                    OTransition: 'oTransitionEnd',
                    MozTransition: 'transitionend',
                    WebkitTransition: 'webkitTransitionEnd',
                    msTransition: 'MSTransitionEnd',
                    transition: 'transitionend'
                };

                var prefixed = prefix('transition');
                return prefixed && end[prefixed];
            }),

            enumerable: true
        }
    })
}, {
    inputEventsWhileDisabled: {
        // FireFox won't dispatch any events on disabled inputs:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=329509

        get: cache$1(function() {
            var input     = document.createElement('input');
            var testEvent = Event('featuretest');
            var result    = false;

            document.body.appendChild(input);
            input.disabled = true;
            input.addEventListener('featuretest', function(e) { result = true; });
            input.dispatchEvent(testEvent);
            input.remove();

            return result;
        }),

        enumerable: true
    },

    template: {
        get: cache$1(function() {
            // Older browsers don't know about the content property of templates.
            return 'content' in document.createElement('template');
        }),

        enumerable: true
    },

    textareaPlaceholderSet: {
        // IE sets textarea innerHTML (but not value) to the placeholder
        // when setting the attribute and cloning and so on. The twats have
        // marked it "Won't fix":
        //
        // https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea

        get: cache$1(function() {
            var node = document.createElement('textarea');
            node.setAttribute('placeholder', '---');
            return node.innerHTML === '';
        }),

        enumerable: true
    },

    transition: {
        get: cache$1(function testTransition() {
            var prefixed = prefix('transition');
            return prefixed || false;
        }),

        enumerable: true
    },

    fullscreen: {
        get: cache$1(function testFullscreen() {
            var node = document.createElement('div');
            return !!(node.requestFullscreen ||
                node.webkitRequestFullscreen ||
                node.mozRequestFullScreen ||
                node.msRequestFullscreen);
        }),

        enumerable: true
    },

    scrollBehavior: {
        get: cache$1(function() {
            return 'scrollBehavior' in document.documentElement.style;
        })
    },

    scrollBarWidth: {
        get: cache$1(function() {
            // TODO
        })
    }
});

const assign$1  = Object.assign;
const rspaces = /\s+/;

function prefixType(type) {
	return features.events[type] || type ;
}


// Handle event types

// DOM click events may be simulated on inputs when their labels are
// clicked. The tell-tale is they have the same timeStamp. Track click
// timeStamps.
var clickTimeStamp = 0;

window.addEventListener('click', function(e) {
	clickTimeStamp = e.timeStamp;
});

function listen(source, type) {
	if (type === 'click') {
		source.clickUpdate = function click(e) {
			// Ignore clicks with the same timeStamp as previous clicks –
			// they are likely simulated by the browser.
			if (e.timeStamp <= clickTimeStamp) { return; }
			source.update(e);
		};

		source.node.addEventListener(type, source.clickUpdate, source.options);
		return source;
	}

	source.node.addEventListener(type, source.update, source.options);
	return source;
}

function unlisten(source, type) {
	source.node.removeEventListener(type, type === 'click' ?
		source.clickUpdate :
		source.update
	);

	return source;
}

/**
events(type, node)

Returns a mappable stream of events heard on `node`:

    var stream = events('click', document.body);
    .map(get('target'))
    .each(function(node) {
        // Do something with nodes
    });

Stopping the stream removes the event listeners:

    stream.stop();
*/

function Source(notify, stop, type, options, node) {
	const types  = type.split(rspaces).map(prefixType);
	const buffer = [];

	function update(value) {
		buffer.push(value);
		notify();
	}

	this._stop   = stop;
	this.types   = types;
	this.node    = node;
	this.buffer  = buffer;
	this.update  = update;
	this.options = options;

	// Potential hard-to-find error here if type has repeats, ie 'click click'.
	// Lets assume nobody is dumb enough to do this, I dont want to have to
	// check for that every time.
	types.reduce(listen, this);
}

assign$1(Source.prototype, {
	shift: function shiftEvent() {
		const buffer = this.buffer;
		return buffer.shift();
	},

	stop: function stopEvent() {
		this.types.reduce(unlisten, this);
		this._stop(this.buffer.length);
	}
});

function events(type, node) {
	let options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	return new Stream(function(notify, stop) {
		return new Source(notify, stop, type, options, node)
	});
}

/**
style(property, node)

Returns the computed style `property` of `node`.

    style('transform', node);            // returns transform

If `property` is of the form `"property:name"`, a named aspect of the property
is returned.

    style('transform:rotate', node);     // returns rotation, as a number, in radians
    style('transform:scale', node);      // returns scale, as a number
    style('transform:translateX', node); // returns translation, as a number, in px
    style('transform:translateY', node); // returns translation, as a number, in px
*/

var rpx          = /px$/;
var styleParsers = {
	"transform:translateX": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[4]);
	},

	"transform:translateY": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[5]);
	},

	"transform:scale": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.sqrt(a * a + b * b);
	},

	"transform:rotate": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.atan2(b, a);
	}
};

function valuesFromCssFn(string) {
	return string.split('(')[1].split(')')[0].split(/\s*,\s*/);
}

function computedStyle(name, node) {
	return window.getComputedStyle ?
		window
		.getComputedStyle(node, null)
		.getPropertyValue(name) :
		0 ;
}

function style(name, node) {
    // If name corresponds to a custom property name in styleParsers...
    if (styleParsers[name]) { return styleParsers[name](node); }

    var value = computedStyle(name, node);

    // Pixel values are converted to number type
    return typeof value === 'string' && rpx.test(value) ?
        parseFloat(value) :
        value ;
}

// Units


/* Track document font size */

let fontSize;

function getFontSize() {
    return fontSize ||
        (fontSize = style("font-size", document.documentElement));
}

events('resize', window).each(() => fontSize = undefined);


/**
parseValue(value)`
Takes a string of the form '10rem', '100vw' or '100vh' and returns a number in pixels.
*/

const parseValue = overload(toType, {
    'number': id,

    'string': parseVal({
        em: function(n) {
            return getFontSize() * n;
        },

        px: function(n) {
            return n;
        },

        rem: function(n) {
            return getFontSize() * n;
        },

        vw: function(n) {
            return window.innerWidth * n / 100;
        },

        vh: function(n) {
            return window.innerHeight * n / 100;
        }
    })
});


/**
toRem(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25rem'.
*/

function toRem(n) {
    return (parseValue(n) / getFontSize())
        // Chrome needs min 7 digit precision for accurate rendering
        .toFixed(8)
        // Remove trailing 0s
        .replace(/\.?0*$/, '')
        // Postfix
        + 'rem';
}


/**
toVw(value)
Takes number in pixels and returns a string of the form '10vw'.
*/

function toVw(n) {
    return (100 * parseValue(n) / window.innerWidth) + 'vw';
}


/**
toVh(value)
Takes number in pixels and returns a string of the form '10vh'.
*/

function toVh(n) {
    return (100 * parseValue(n) / window.innerHeight) + 'vh';
}

const rules = [];

const types = overload(toType, {
    'number':   id,
    'string':   parseValue,
    'function': function(fn) { return fn(); }
});

const tests = {
    minWidth: function(value)  { return width >= types(value); },
    maxWidth: function(value)  { return width <  types(value); },
    minHeight: function(value) { return height >= types(value); },
    maxHeight: function(value) { return height <  types(value); },
    minScrollTop: function(value) { return scrollTop >= types(value); },
    maxScrollTop: function(value) { return scrollTop <  types(value); },
    minScrollBottom: function(value) { return (scrollHeight - height - scrollTop) >= types(value); },
    maxScrollBottom: function(value) { return (scrollHeight - height - scrollTop) <  types(value); }
};

let width = window.innerWidth;
let height = window.innerHeight;
let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
let scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

function test(query) {
    var keys = Object.keys(query);
    var n = keys.length;
    var key;

    if (keys.length === 0) { return false; }

    while (n--) {
        key = keys[n];
        if (!tests[key](query[key])) { return false; }
    }

    return true;
}

function update(e) {
    var l = rules.length;
    var rule;

    // Run exiting rules
    while (l--) {
        rule = rules[l];

        if (rule.state && !test(rule.query)) {
            rule.state = false;
            rule.exit && rule.exit(e);
        }
    }

    l = rules.length;

    // Run entering rules
    while (l--) {
        rule = rules[l];

        if (!rule.state && test(rule.query)) {
            rule.state = true;
            rule.enter && rule.enter(e);
        }
    }
}

function scroll(e) {
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    update(e);
}

function resize(e) {
    width = window.innerWidth;
    height = window.innerHeight;
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    update(e);
}

window.addEventListener('scroll', scroll);
window.addEventListener('resize', resize);

ready$1(update);
document.addEventListener('DOMContentLoaded', update);

/**
assign(node, properties)

Assigns each property of `properties` to `node`, as a property where that
property exists in `node`, otherwise as an attribute.

If `properties` has a property `'children'` it must be an array of nodes;
they are appended to 'node'.

The property `'html'` is treated as an alias of `'innerHTML'`. The property
`'tag'` is treated as an alias of `'tagName'` (which is ignored, as
`node.tagName` is read-only). The property `'is'` is also ignored.
*/

const assignProperty = overload(id, {
	// Ignore read-only properties or attributes
	is: noop,
	tag: noop,

	html: function(name, node, content) {
		node.innerHTML = content;
	},

	children: function(name, node, content) {
		// Empty the node and append children
		node.innerHTML = '';
		content.forEach((child) => { node.appendChild(child); });
	},

	// SVG points property must be set as string attribute - SVG elements
	// have a read-only API exposed at .points
	points: setAttribute,

	default: function(name, node, content) {
		if (name in node) {
			node[name] = content;
		}
		else {
			node.setAttribute(name, content);
		}
	}
});

function setAttribute(name, node, content) {
	node.setAttribute(name, content);
}

function assign$2(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		assignProperty(names[n], node, attributes[names[n]]);
	}

	return node;
}

var assign$3 = curry(assign$2, true);

const svgNamespace = 'http://www.w3.org/2000/svg';
const div = document.createElement('div');


// Constructors

const construct = overload(id, {
    comment: function(tag, text) {
        return document.createComment(text || '');
    },

    fragment: function(tag, html) {
        var fragment = document.createDocumentFragment();

        if (html) {
            div.innerHTML = html;
            const nodes = div.childNodes;
            while (nodes[0]) {
                fragment.appendChild(nodes[0]);
            }
        }

        return fragment;
    },

    text: function (tag, text) {
        return document.createTextNode(text || '');
    },

    circle:   constructSVG,
    ellipse:  constructSVG,
    g:        constructSVG,
    glyph:    constructSVG,
    image:    constructSVG,
    line:     constructSVG,
    rect:     constructSVG,
    use:      constructSVG,
    path:     constructSVG,
    pattern:  constructSVG,
    polygon:  constructSVG,
    polyline: constructSVG,
    svg:      constructSVG,
    default:  constructHTML
});

function constructSVG(tag, html) {
    var node = document.createElementNS(svgNamespace, tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

function constructHTML(tag, html) {
    var node = document.createElement(tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}


/**
create(tag, content)

Constructs and returns a new DOM node.

- If `tag` is `"text"` a text node is created.
- If `tag` is `"fragment"` a fragment is created.
- If `tag` is `"comment"` a comment is created.
- If `tag` is any other string the element `<tag></tag>` is created.
- Where `tag` is an object, it must have a `"tag"` or `"tagName"` property.
A node is created according to the above rules for tag strings, and other
properties of the object are assigned with dom's `assign(node, object)` function.

If `content` is a string it is set as text content on a text or comment node,
or as inner HTML on an element or fragment. It may also be an object of
properties which are assigned with dom's `assign(node, properties)` function.
*/

function toTypes() {
    return Array.prototype.map.call(arguments, toType).join(' ');
}

function validateTag(tag) {
    if (typeof tag !== 'string') {
        throw new Error('create(object, content) object must have string property .tag or .tagName');
    }
}

var create = overload(toTypes, {
    'string string': construct,

    'string object': function(tag, content) {
        return assign$3(construct(tag, ''), content);
    },

    'object string': function(properties, text) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        // Warning: text is set before properties, but text should override
        // html or innerHTML property, ie, be set after.
        return assign$3(construct(tag, text), properties);
    },

    'object object': function(properties, content) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        return assign$3(assign$3(construct(tag, ''), properties), content);
    },

    default: function() {
        throw new Error('create(tag, content) does not accept argument types "' + Array.prototype.map.apply(arguments, toType).join(' ') + '"');
    }
});

const DEBUG = window.DEBUG === true;

const assign$4 = Object.assign;

const constructors = {
    'a':        HTMLAnchorElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'template': HTMLTemplateElement
};

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form:              { get: function() { return this[$internals].form; }},
    labels:            { get: function() { return this[$internals].labels; }},
    validity:          { get: function() { return this[$internals].validity; }},
    validationMessage: { get: function() { return this[$internals].validationMessage; }},
    willValidate:      { get: function() { return this[$internals].willValidate; }},
    checkValidity:     { value: function() { return this[$internals].checkValidity(); }},
    reportValidity:    { value: function() { return this[$internals].reportValidity(); }}
};

const onceEvent = {
    once: true
};

function getElementConstructor(tag) {
        // Return a constructor from the known list of tag names – not all tags
        // have constructor names that match their tags
    return constructors[tag]
        // Or assemble the tag name in the form "HTMLTagElement" and return
        // that property of the window object
        || window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element']
        || (() => {
            throw new Error('Constructor not found for tag "' + tag + '"');
        })();
}

function getTemplateById(id) {
    const template = document.getElementById(id);

    if (!template || !template.content) {
        throw new Error('Template id="' + id + '" not found in document');
    }

    return template;
}

function getTemplate(template) {
    if (!template) { return; }

    return typeof template === 'string' ?
        // If template is an #id search for <template id="id">
        template[0] === '#' ? getTemplateById(template.slice(1)) :
        // It must be a string of HTML
        template :
    template.content ?
        // It must be a template node
        template :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.template not a template node, id or string');
        }() ;
}

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function createShadow(template, elem, options) {
    if (!template) { return; }

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode: options.mode || 'closed',
        delegatesFocus: true
    });

    elem[$shadow] = shadow;

    // If template is a string
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }

    if (options.load) {
        elem._initialLoad = true;
    }

    return shadow;
}

function attachInternals(elem) {
    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        return elem.attachInternals();
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    const hidden = create('input', { type: 'hidden', name: elem.name });

    // Polyfill internals object setFormValue
    hidden.setFormValue = function(value) {
        this.value = value;
    };

    return hidden;
}

function appendInternalsCallback() {
    // If we have simulated form internals, append the hidden input now
    if (this[$internals] && !this.attachInternals) {
        this.appendChild(this[$internals]);
    }
}

function primeAttributes(elem) {
    elem._initialAttributes = {};
    elem._n = 0;
}

function advanceAttributes(elem, attributes, handlers) {
    const values = elem._initialAttributes;

    while(elem._n < attributes.length && values[attributes[elem._n]] !== undefined) {
        //console.log('ADVANCE ATTR', attributes[elem._n]);
        handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        ++elem._n;
    }
}

function flushAttributes(elem, attributes, handlers) {
    if (!elem._initialAttributes) { return; }

    const values = elem._initialAttributes;

    while(elem._n < attributes.length) {
        //console.log('FLUSH ATTR', attributes[elem._n]);
        if (values[attributes[elem._n]] !== undefined) {
            handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        }
        ++elem._n;
    }

    delete elem._initialAttributes;
    delete elem._n;
}


function element(name, options) {
    // Get the element constructor from options.extends, or the
    // base HTMLElement constructor
    const constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

    let template;

    function Element() {
        // Get a template node or HTML string from options.template
        template = template || getTemplate(options.template);

        // Construct an instance from Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = createShadow(template, elem, options);

        if (Element.formAssociated) {
            // Get access to the internal form control API
            elem[$internals] = attachInternals(elem);
        }

        options.construct && options.construct.call(null, elem, shadow);

        // Preserve initialisation order of attribute initialisation by
        // queueing them
        if (options.attributes) {
            primeAttributes(elem);

            // Wait a tick to flush attributes
            Promise.resolve(1).then(function() {
                flushAttributes(elem, Element.observedAttributes, options);
            });
        }

        // At this point, if properties have already been set before the
        // element was upgraded, they exist on the elem itself, where we have
        // just upgraded it's protytype to define those properties those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype
        //    Object.defineProperties(elem, properties);
        //
        // 2. Take a great deal of care not to set properties before an element
        //    is upgraded. I can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy you have to do this, though.
        options.properties
        && Object.keys(options.properties).reduce(transferProperty, elem);

        return elem;
    }


    // Properties
    //
    // Must be defined before attributeChangedCallback, but I cannot figure out
    // why. Where one of the properties is `value`, the element is set up as a
    // form element.

    if (options.properties && options.properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;

        Element.prototype = Object.create(constructor.prototype, assign$4({}, formProperties, options.properties, {
            value: {
                get: options.properties.value.get,
                set: function() {
                    // After setting value
                    options.properties.value.set.apply(this, arguments);

                    // Copy it to internal form state
                    this[$internals].setFormValue('' + this.value);
                }
            }
        })) ;
    }
    else {
        Element.prototype = Object.create(constructor.prototype, options.properties || {}) ;
    }


    // Attributes

    if (options.attributes) {
        Element.observedAttributes = Object.keys(options.attributes);

        Element.prototype.attributeChangedCallback = function(name, old, value) {
            if (!this._initialAttributes) {
                return options.attributes[name].call(this, value);
            }

            // Keep a record of attribute values to be applied in
            // observedAttributes order
            this._initialAttributes[name] = value;
            advanceAttributes(this, Element.observedAttributes, options.attributes);
        };
    }


    // Lifecycle

    Element.prototype.connectedCallback = function() {
        const elem   = this;
        const shadow = elem[$shadow];

        // Initialise any attributes that appeared out of order
        if (elem._initialAttributes) {
            flushAttributes(elem, Element.observedAttributes, options.attributes);
        }

        if (Element.formAssociated) {
            appendInternalsCallback.call(elem);
        }

        // If this is the first connect and there is an options.load fn,
        // _initialLoad is true
        if (elem._initialLoad) {
            const links = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (links.length) {
                let count  = 0;
                let n      = links.length;

                const load = function load(e) {
                    if (++count >= links.length) {
                        // Delete _initialLoad. If the element is removed
                        // and added to the DOM again, stylesheets do not load
                        // again
                        delete elem._initialLoad;
                        if (options.load) {
                            options.load.call(elem, elem, shadow);
                        }
                    }
                };

                // Todo: But do we pick these load events up if the stylesheet is cached??
                while (n--) {
                    links[n].addEventListener('load', load, onceEvent);
                }

                if (options.connect) {
                    options.connect.call(null, elem, shadow);
                }
            }
            else {
                if (options.connect) {
                    options.connect.call(null, elem, shadow);
                }

                if (options.load) {
                    options.load.call(null, elem, shadow);
                }
            }
        }
        else if (options.connect) {
            options.connect.call(null, elem, shadow);
        }

        if (DEBUG) {
            console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', elem);
        }
    };

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            return options.disconnect.call(null, this, this[$shadow]);
        };
    }

    if (Element.formAssociated) {
        if (options.enable || options.disable) {
            Element.prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    options.disable && options.disable.call(null, this, this[$shadow]) :
                    options.enable && options.enable.call(null, this, this[$shadow]) ;
            };
        }

        if (options.reset) {
            Element.prototype.formResetCallback = function() {
                return options.reset.call(null, this, this[$shadow]);
            };
        }

        if (options.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                return options.restore.call(null, this, this[$shadow]);
            };
        }
    }


    // Define element

    window.customElements.define(name, Element, options);
    return Element;
}

/**
escape(string)
Escapes `string` for setting safely as HTML.
*/

var pre  = document.createElement('pre');
var text = document.createTextNode('');

pre.appendChild(text);

function escape(value) {
	text.textContent = value;
	return pre.innerHTML;
}

var mimetypes = {
    xml: 'application/xml',
    html: 'text/html',
    svg: 'image/svg+xml'
};

function parse(type, string) {
    if (!string) { return; }

    var mimetype = mimetypes[type.toLowerCase()];
    var xml;

    // Cludged from jQuery source...
    try {
        xml = (new window.DOMParser()).parseFromString(string, mimetype);
    }
    catch (e) {
        return;
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid " + type.toUpperCase() + ": " + string);
    }

    return xml;
}

/**
parseHTML(string)
Returns an HTML document parsed from `string`, or undefined.
*/

function parseHTML(string) {
    return parse('html', string);
}

// Types

/**
isFragmentNode(node)

Returns `true` if `node` is a fragment.
*/

function isFragmentNode(node) {
	return node.nodeType === 11;
}

function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}

curry(attribute, true);

function contains(child, node) {
	return node.contains ?
		node.contains(child) :
	child.parentNode ?
		child.parentNode === node || contains(child.parentNode, node) :
	false ;
}

curry(contains, true);

/**
tag(node)

Returns the tag name of `node`, in lowercase.

```
const li = create('li', 'Salt and vinegar');
tag(li);   // 'li'
```
*/

function tag(node) {
	return node.tagName && node.tagName.toLowerCase();
}

function matches(selector, node) {
	return node.matches ? node.matches(selector) :
		node.matchesSelector ? node.matchesSelector(selector) :
		node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
		node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
		node.msMatchesSelector ? node.msMatchesSelector(selector) :
		node.oMatchesSelector ? node.oMatchesSelector(selector) :
		// Dumb fall back to simple tag name matching. Nigh-on useless.
		tag(node) === selector ;
}

var matches$1 = curry(matches, true);

function closest(selector, node) {
	var root = arguments[2];

	if (!node || node === document || node === root || node.nodeType === 11) { return; }

	// SVG <use> elements store their DOM reference in
	// .correspondingUseElement.
	node = node.correspondingUseElement || node ;

	return matches$1(selector, node) ?
		 node :
		 closest(selector, node.parentNode, root) ;
}

var closest$1 = curry(closest, true);

function find(selector, node) {
	return node.querySelector(selector);
}

curry(find, true);

function select(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

var select$1 = curry(select, true);

/**
append(target, node)

Appends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.append) {
    throw new Error('A polyfill for Element.append() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append)');
}

function append(target, node) {
    target.append(node);
    return target.lastChild;
}

var append$1 = curry(append, true);

/**
prepend(target, node)

Prepends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.prepend) {
    throw new Error('A polyfill for Element.prepend() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend)');
}

function prepend(target, node) {
    target.prepend(node);
    return target.firstChild;
}

curry(prepend, true);

/** DOM Mutation */

/**
remove(node)

Removes `node` from the DOM.
*/

function remove(node) {
	if (node.remove) {
		node.remove();
	}
	else {
		console.warn('deprecated: remove() no longer removes lists of nodes.');
		node.parentNode && node.parentNode.removeChild(node);
	}

	return node;
}

/**
before(target, node)

Inserts `node` before target.
*/

function before(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target);
	return node;
}

/**
after(target, node)

Inserts `node` after `target`.
*/

function after(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
	return node;
}

/**
replace(target, node)

Swaps `target` for `node`.
*/

function replace(target, node) {
	before(target, node);
	remove(target);
	return node;
}

const classes = get('classList');

/**
addClass(class, node)
Adds `'class'` to the classList of `node`.
*/

function addClass(string, node) {
	classes(node).add(string);
}

/**
removeClass(class, node)
Removes `'class'` from the classList of `node`.
*/

function removeClass(string, node) {
	classes(node).remove(string);
}

function requestFrame(n, fn) {
	// Requst frames until n is 0, then call fn
	(function frame(t) {
		return n-- ?
			requestAnimationFrame(frame) :
			fn(t);
	})();
}

function frameClass(string, node) {
	var list = classes(node);
	list.add(string);

	// Chrome (at least) requires 2 frames - I guess in the first, the
	// change is painted so we have to wait for the second to undo
	requestFrame(2, () => list.remove(string));
}

/**
rect(node)

Returns a `DOMRect` object describing the draw rectangle of `node`.
(If `node` is `window` a preudo-DOMRect object is returned).
*/

function windowBox() {
	return {
		left:   0,
		top:    0,
		right:  window.innerWidth,
		bottom: window.innerHeight,
		width:  window.innerWidth,
		height: window.innerHeight
	};
}

function rect(node) {
	return node === window ?
		windowBox() :
		node.getClientRects()[0] ;
}

function offset(node1, node2) {
	var box1 = rect(node1);
	var box2 = rect(node2);
	return [box2.left - box1.left, box2.top - box1.top];
}

if (!NodeList.prototype.forEach) {
    console.warn('A polyfill for NodeList.forEach() is needed (https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach)');
}

// DOM Fragments and Templates

function fragmentFromChildren(node) {
	var fragment = create('fragment');

	while (node.firstChild) {
		append$1(fragment, node.firstChild);
	}

	return fragment;
}


/**
fragmentFromHTML(string)
Returns a DOM fragment of the parsed html `string`.
*/

function fragmentFromHTML(html, contextTag) {
    if (contextTag) {
        const node = document.createElement(contextTag);
        node.innerHTML = html;
        return fragmentFromChildren(node);
    }

    return document
    .createRange()
    .createContextualFragment(html);
}

// trigger('type', node)

function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event$1(type, properties);
	node.dispatchEvent(event);
    return node;
}

function delegate(selector, fn) {
	// Create an event handler that looks up the ancestor tree
	// to find selector.
	return function handler(e) {
		var node = closest$1(selector, e.target, e.currentTarget);
		if (!node) { return; }
		e.delegateTarget = node;
		fn(e, node);
		e.delegateTarget = undefined;
	};
}

const keyStrings = {
	8:  'backspace',
	9:  'tab',
	13: 'enter',
	16: 'shift',
	17: 'ctrl',
	18: 'alt',
	27: 'escape',
	32: 'space',
	33: 'pageup',
	34: 'pagedown',
	35: 'pageright',
	36: 'pageleft',
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down',
	46: 'delete',
	48: '0',
	49: '1',
	50: '2',
	51: '3',
	52: '4',
	53: '5',
	54: '6',
	55: '7',
	56: '8',
	57: '9',
	65: 'a',
	66: 'b',
	67: 'c',
	68: 'd',
	69: 'e',
	70: 'f',
	71: 'g',
	72: 'h',
	73: 'i',
	74: 'j',
	75: 'k',
	76: 'l',
	77: 'm',
	78: 'n',
	79: 'o',
	80: 'p',
	81: 'q',
	82: 'r',
	83: 's',
	84: 't',
	85: 'u',
	86: 'v',
	87: 'w',
	88: 'x',
	89: 'y',
	90: 'z',
	// Mac Chrome left CMD
	91: 'cmd',
	// Mac Chrome right CMD
	93: 'cmd',
	186: ';',
	187: '=',
	188: ',',
	189: '-',
	190: '.',
	191: '/',
	219: '[',
	220: '\\',
	221: ']',
	222: '\'',
	// Mac FF
	224: 'cmd'
};

const keyCodes = Object.entries(keyStrings).reduce(function(object, entry) {
	object[entry[1]] = parseInt(entry[0], 10);
	return object;
}, {});

/**
transition(duration, fn)

Calls `fn` on each animation frame until `duration` seconds has elapsed. `fn`
is passed a single argument `progress`, a number that ramps from `0` to `1` over
the duration of the transition. Returns a function that cancels the transition.

```
transition(3, function(progress) {
    // Called every frame for 3 seconds
});
```
*/

const performance           = window.performance;
const requestAnimationFrame$1 = window.requestAnimationFrame;
const cancelAnimationFrame  = window.cancelAnimationFrame;

function transition(duration, fn) {
	var t0 = performance.now();

	function frame(t1) {
		// Progress from 0-1
		var progress = (t1 - t0) / (duration * 1000);

		if (progress < 1) {
			if (progress > 0) {
				fn(progress);
			}
			id = requestAnimationFrame$1(frame);
		}
		else {
			fn(1);
		}
	}

	var id = requestAnimationFrame$1(frame);

	return function cancel() {
		cancelAnimationFrame(id);
	};
}

function animate(duration, transform, name, object, value) {
	// denormaliseLinear is not curried! Wrap it.
    const startValue = object[name];
	return transition(
		duration,
		pipe(transform, (v) => linear(startValue, value, v), set(name, object))
	);
}

const define$1 = Object.defineProperties;

define$1({
    left: 0
}, {
    right:  { get: function() { return window.innerWidth; }, enumerable: true, configurable: true },
    top:    { get: function() { return style('padding-top', document.body); }, enumerable: true, configurable: true },
    bottom: { get: function() { return window.innerHeight; }, enumerable: true, configurable: true }
});

const assign$5 = Object.assign;

/*
config

```{
    headers:    fn(data),    // Must return an object with properties to add to the header
    body:       fn(data),    // Must return an object to send as data
    onresponse: function(response)
}```
*/

const config = {
    // Takes data, returns headers
    headers: function(data) { return {}; },

    // Takes data (can be FormData object or plain object), returns data
    body: id,

    // Takes response, returns response
    onresponse: function(response) {
        // If redirected, navigate the browser away from here. Can get
        // annoying when receiving 404s, maybe not a good default...
        if (response.redirected) {
            window.location = response.url;
            return;
        }

        return response;
    }
};

const createHeaders = choose({
    'application/x-www-form-urlencoded': function(headers) {
        return assign$5(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'application/json': function(headers) {
        return assign$5(headers, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'multipart/form-data': function(headers) {
        return assign$5(headers, {
            "Content-Type": 'multipart/form-data',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'audio/wav': function(headers) {
        return assign$5(headers, {
            "Content-Type": 'audio/wav',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'default': function(headers) {
        return assign$5(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    }
});

const createBody = choose({
    'application/json': function(data) {
        return data.get ?
            formDataToJSON(data) :
            JSON.stringify(data);
    },

    'application/x-www-form-urlencoded': function(data) {
        return data.get ?
            formDataToQuery(data) :
            dataToQuery(data) ;
    },

    'multipart/form-data': function(data) {
        // Mmmmmhmmm?
        return data.get ?
            data :
            dataToFormData() ;
    }
});

function formDataToJSON(formData) {
    return JSON.stringify(
        // formData.entries() is an iterator, not an array
        Array
        .from(formData.entries())
        .reduce(function(output, entry) {
            output[entry[0]] = entry[1];
            return output;
        }, {})
    );
}

function formDataToQuery(data) {
    return new URLSearchParams(data).toString();
}

function dataToQuery(data) {
    return Object.keys(data).reduce((params, key) => {
        params.append(key, data[key]);
        return params;
    }, new URLSearchParams());
}

function dataToFormData(data) {
    throw new Error('TODO: dataToFormData(data)');
}

function urlFromData(url, data) {
    // Form data
    return data instanceof FormData ?
        url + '?' + formDataToQuery(data) :
        url + '?' + dataToQuery(data) ;
}

function createOptions(method, data, head, controller) {
    const contentType = typeof head === 'string' ?
        head :
        head['Content-Type'] ;

    const headers = createHeaders(contentType, assign$5(
        config.headers && data ? config.headers(data) : {},
        typeof head === 'string' ? nothing : head
    ));

    const options = {
        method:  method,
        headers: headers,
        credentials: 'same-origin',
        signal: controller && controller.signal
    };

    if (method !== 'GET') {
        options.body = createBody(contentType, config.body ? config.body(data) : data);
    }

    return options;
}

const responders = {
    'text/html': respondText,
    'application/json': respondJSON,
    'multipart/form-data': respondForm,
    'application/x-www-form-urlencoded': respondForm,
    'audio': respondBlob,
    'audio/wav': respondBlob,
    'audio/m4a': respondBlob
};

function respondBlob(response) {
    return response.blob();
}

function respondJSON(response) {
    return response.json();
}

function respondForm(response) {
    return response.formData();
}

function respondText(response) {
    return response.text();
}

function respond(response) {
    if (config.onresponse) {
        response = config.onresponse(response);
    }

    if (!response.ok) {
        throw new Error(response.statusText + '');
    }

    // Get mimetype from Content-Type, remembering to hoik off any
    // parameters first
    const mimetype = response.headers
    .get('Content-Type')
    .replace(/\;.*$/, '');

    return responders[mimetype](response);
}


/**
request(type, url, data, mimetype | headers)

Uses `fetch()` to send a request to `url`. Where `type` is `"GET"`, `data` is
serialised and appended to the URL, otherwise it is sent as a request body.
The 4th parameter may be a content type string or a headers object (in which
case it must have a `'Content-Type'` property).
**/

function request(type = 'GET', url, data, mimetype = 'application/json') {
    if (url.startsWith('application/') || url.startsWith('multipart/') || url.startsWith('text/') || url.startsWith('audio/')) {
        console.trace('request(type, url, data, mimetype) parameter order has changed. You passed (type, mimetype, url, data).');
        url      = arguments[1];
        data     = arguments[2];
        mimetype = arguments[3];
    }

    const method = type.toUpperCase();

    // If this is a GET and there is data, append data to the URL query string
    if (method === 'GET' && data) {
        url = urlFromData(url, data);
    }

    // param[4] is an optional abort controller
    return fetch(url, createOptions(method, data, mimetype, arguments[4]))
    .then(respond);
}

/**
requestGet(url)
A shortcut for `request('get', 'application/json', url)`
**/

function requestGet(url) {
    return request('GET', url);
}

if (window.console && window.console.log) {
    window.console.log('%cdom%c         – https://stephen.band/dom', 'color: #3a8ab0; font-weight: 600;', 'color: inherit; font-weight: 400;');
}
const before$1  = curry(before, true);
const after$1   = curry(after, true);
const replace$1 = curry(replace, true);
const addClass$1    = curry(addClass, true);
const removeClass$1 = curry(removeClass, true);
const frameClass$1  = curry(frameClass, true);
const offset$1 = curry(offset, true);
const style$1 = curry(style, true);
const events$1 = curry(events, true);
const trigger$1 = curry(trigger, true);
const delegate$1 = curry(delegate, true);
const animate$1 = curry(animate, true);
const transition$1 = curry(transition, true);

export { parseValue as a, toVw as b, toVh as c, classes as d, escape as e, tag as f, trigger$1 as g, fragmentFromChildren as h, isFragmentNode as i, create as j, before$1 as k, fragmentFromHTML as l, remove as m, now as n, requestGet as o, parseHTML as p, events$1 as q, request as r, select$1 as s, toRem as t, element as u };
