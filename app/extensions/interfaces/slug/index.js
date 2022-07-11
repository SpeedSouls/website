import { defineInterface } from '@directus/extensions-sdk';
import { defineComponent, useAttrs, inject, ref, computed, watch, resolveComponent, resolveDirective, openBlock, createBlock, createSlots, unref, withCtx, createCommentVNode, createElementVNode, toDisplayString, createElementBlock, withDirectives, createVNode, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

/* micromustache v8.0.3 */
/** @internal */
/** @internal */
// eslint-disable-next-line @typescript-eslint/unbound-method
var numberConstructor = (0).constructor;
/** @internal */
// eslint-disable-next-line @typescript-eslint/unbound-method
var isFinite = numberConstructor.isFinite;
/** @internal */
// eslint-disable-next-line @typescript-eslint/unbound-method
numberConstructor.isInteger;
/** @internal */
// eslint-disable-next-line @typescript-eslint/unbound-method
var isArray = [].constructor.isArray;
/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
function isObj(x) {
    return x !== null && typeof x === 'object';
}
/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
function isFn(x) {
    return typeof x === 'function';
}
/** @internal */
function isStr(x, minLength) {
    if (minLength === void 0) { minLength = 0; }
    return typeof x === 'string' && x.length >= minLength;
}
/** @internal */
function isNum(x) {
    return isFinite(x);
}
/** @internal */
function isArr(x) {
    return isArray(x);
}
/** @internal */
function isProp(x, propName) {
    return isObj(x) && propName in x;
}

/**
 * @internal
 * The number of different varNames that will be cached.
 * If a varName is cached, the actual parsing algorithm will not be called
 * which significantly improves performance.
 * However, this cache is size-limited to prevent degrading the user's software
 * over a period of time.
 * If the cache is full, we start removing older varNames one at a time.
 */
var cacheSize = 1000;
/** @internal */
var quoteChars = '\'"`';
/**
 * @internal
 */
var Cache = /** @class */ (function () {
    function Cache(size) {
        this.size = size;
        this.reset();
    }
    Cache.prototype.reset = function () {
        this.oldestIndex = 0;
        this.map = {};
        this.cachedKeys = new Array(this.size);
    };
    Cache.prototype.get = function (key) {
        return this.map[key];
    };
    Cache.prototype.set = function (key, value) {
        this.map[key] = value;
        var oldestKey = this.cachedKeys[this.oldestIndex];
        if (oldestKey !== undefined) {
            delete this.map[oldestKey];
        }
        this.cachedKeys[this.oldestIndex] = key;
        this.oldestIndex++;
        this.oldestIndex %= this.size;
    };
    return Cache;
}());
/** @internal */
var cache = new Cache(cacheSize);
/**
 * @internal
 * Removes the quotes from a string and returns it.
 * @param propName an string with quotations
 * @throws `SyntaxError` if the quotation symbols don't match or one is missing
 * @returns the input with its quotes removed
 */
function propBetweenBrackets(propName) {
    // in our algorithms key is always a string and never only a string of spaces
    var firstChar = propName.charAt(0);
    var lastChar = propName.substr(-1);
    if (quoteChars.includes(firstChar) || quoteChars.includes(lastChar)) {
        if (propName.length < 2 || firstChar !== lastChar) {
            throw new SyntaxError("Mismatching string quotation: \"" + propName + "\"");
        }
        return propName.substring(1, propName.length - 1);
    }
    if (propName.includes('[')) {
        throw new SyntaxError("Missing ] in varName \"" + propName + "\"");
    }
    // Normalize leading plus from numerical indices
    if (firstChar === '+') {
        return propName.substr(1);
    }
    return propName;
}
/** @internal */
function pushPropName(propNames, propName, preDot) {
    var pName = propName.trim();
    if (pName === '') {
        return propNames;
    }
    if (pName.startsWith('.')) {
        if (preDot) {
            pName = pName.substr(1).trim();
            if (pName === '') {
                return propNames;
            }
        }
        else {
            throw new SyntaxError("Unexpected . at the start of \"" + propName + "\"");
        }
    }
    else if (preDot) {
        throw new SyntaxError("Missing . at the start of \"" + propName + "\"");
    }
    if (pName.endsWith('.')) {
        throw new SyntaxError("Unexpected \".\" at the end of \"" + propName + "\"");
    }
    var propNameParts = pName.split('.');
    for (var _i = 0, propNameParts_1 = propNameParts; _i < propNameParts_1.length; _i++) {
        var propNamePart = propNameParts_1[_i];
        var trimmedPropName = propNamePart.trim();
        if (trimmedPropName === '') {
            throw new SyntaxError("Empty prop name when parsing \"" + propName + "\"");
        }
        propNames.push(trimmedPropName);
    }
    return propNames;
}
/**
 * Breaks a variable name to an array of strings that can be used to get a
 * particular value from an object
 * @param varName - the variable name as it occurs in the template.
 * For example `a["b"].c`
 * @throws `TypeError` if the varName is not a string
 * @throws `SyntaxError` if the varName syntax has a problem
 * @returns - an array of property names that can be used to get a particular
 * value.
 * For example `['a', 'b', 'c']`
 */
function toPath(varName) {
    if (!isStr(varName)) {
        throw new TypeError("Cannot parse path. Expected string. Got a " + typeof varName);
    }
    var openBracketIndex;
    var closeBracketIndex = 0;
    var beforeBracket;
    var propName;
    var preDot = false;
    var propNames = new Array(0);
    for (var currentIndex = 0; currentIndex < varName.length; currentIndex = closeBracketIndex) {
        openBracketIndex = varName.indexOf('[', currentIndex);
        if (openBracketIndex === -1) {
            break;
        }
        closeBracketIndex = varName.indexOf(']', openBracketIndex);
        if (closeBracketIndex === -1) {
            throw new SyntaxError("Missing ] in varName \"" + varName + "\"");
        }
        propName = varName.substring(openBracketIndex + 1, closeBracketIndex).trim();
        if (propName.length === 0) {
            throw new SyntaxError('Unexpected token ]');
        }
        closeBracketIndex++;
        beforeBracket = varName.substring(currentIndex, openBracketIndex);
        pushPropName(propNames, beforeBracket, preDot);
        propNames.push(propBetweenBrackets(propName));
        preDot = true;
    }
    var rest = varName.substring(closeBracketIndex);
    return pushPropName(propNames, rest, preDot);
}
/**
 * This is just a faster version of `toPath()`
 */
function toPathCached(varName) {
    var result = cache.get(varName);
    if (result === undefined) {
        result = toPath(varName);
        cache.set(varName, result);
    }
    return result;
}
toPath.cached = toPathCached;

/**
 * A useful utility function that is used internally to lookup a variable name as a path to a
 * property in an object. It can also be used in your custom resolver functions if needed.
 *
 * This is similar to [Lodash's `_.get()`](https://lodash.com/docs/#get)
 *
 * It has a few differences with plain JavaScript syntax:
 * - No support for keys that include `[` or `]`.
 * - No support for keys that include `'` or `"` or `.`.
 * @see https://github.com/userpixel/micromustache/wiki/Known-issues
 * If it cannot find a value in the specified path, it may return undefined or throw an error
 * depending on the value of the `propsExist` param.
 * @param scope an object to resolve value from
 * @param varNameOrPropNames the variable name string or an array of property names (as returned by
 * `toPath()`)
 * @throws `SyntaxError` if the varName string cannot be parsed
 * @throws `ReferenceError` if the scope does not contain the requested key and the `propsExist` is
 * set to a truthy value
 * @returns the value or undefined. If path or scope are undefined or scope is null the result is
 * always undefined.
 */
function get(scope, varNameOrPropNames, options) {
    if (options === void 0) { options = {}; }
    if (!isObj(options)) {
        throw new TypeError("get expects an object option. Got " + typeof options);
    }
    var _a = options.depth, depth = _a === void 0 ? 10 : _a;
    if (!isNum(depth) || depth <= 0) {
        throw new RangeError("Expected a positive number for depth. Got " + depth);
    }
    var propNames = Array.isArray(varNameOrPropNames)
        ? varNameOrPropNames
        : toPath.cached(varNameOrPropNames);
    var propNamesAsStr = function () { return propNames.join(' > '); };
    if (propNames.length > depth) {
        throw new ReferenceError("The path cannot be deeper than " + depth + " levels. Got \"" + propNamesAsStr() + "\"");
    }
    var currentScope = scope;
    for (var _i = 0, propNames_1 = propNames; _i < propNames_1.length; _i++) {
        var propName = propNames_1[_i];
        if (isProp(currentScope, propName)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            currentScope = currentScope[propName];
        }
        else if (options.propsExist) {
            throw new ReferenceError(propName + " is not defined in the scope at path: \"" + propNamesAsStr() + "\"");
        }
        else {
            return;
        }
    }
    return currentScope;
}

/**
 * This class does the heavy lifting of interpolation (putting the actual values
 * in the template).
 * This is created by the `.compile()` method and is used under the hood by
 * `.render()`, `renderFn()` and `renderFnAsync()` functions.
 */
var Renderer = /** @class */ (function () {
    /**
     * Creates a new Renderer instance. This is called internally by the compiler.
     * @param tokens - the result of the `.tokenize()` function
     * @param options - some options for customizing the rendering process
     * @throws `TypeError` if the token is invalid
     */
    function Renderer(tokens, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.tokens = tokens;
        this.options = options;
        /**
         * Replaces every {{varName}} inside the template with values from the scope
         * parameter.
         *
         * @param template The template containing one or more {{varName}} as
         * placeholders for values from the `scope` parameter.
         * @param scope An object containing values for variable names from the the
         * template. If it's omitted, we default to an empty object.
         */
        this.render = function (scope) {
            if (scope === void 0) { scope = {}; }
            var varNames = _this.tokens.varNames;
            var length = varNames.length;
            _this.cacheParsedPaths();
            var values = new Array(length);
            for (var i = 0; i < length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                values[i] = get(scope, _this.toPathCache[i], _this.options);
            }
            return _this.stringify(values);
        };
        /**
         * Same as [[render]] but accepts a resolver function which will be
         * responsible for returning a value for every varName.
         */
        this.renderFn = function (resolveFn, scope) {
            if (scope === void 0) { scope = {}; }
            var values = _this.resolveVarNames(resolveFn, scope);
            return _this.stringify(values);
        };
        /**
         * Same as [[render]] but accepts a resolver function which will be responsible
         * for returning promise that resolves to a value for every varName.
         */
        this.renderFnAsync = function (resolveFnAsync, scope) {
            if (scope === void 0) { scope = {}; }
            return Promise.all(_this.resolveVarNames(resolveFnAsync, scope)).then(function (values) {
                return _this.stringify(values);
            });
        };
        if (!isObj(tokens) ||
            !isArr(tokens.strings) ||
            !isArr(tokens.varNames) ||
            tokens.strings.length !== tokens.varNames.length + 1) {
            // This is most likely an internal error from tokenization algorithm
            throw new TypeError("Invalid tokens object");
        }
        if (!isObj(options)) {
            throw new TypeError("Options should be an object. Got a " + typeof options);
        }
        if (options.validateVarNames) {
            // trying to initialize toPathCache parses them which is also validation
            this.cacheParsedPaths();
        }
    }
    /**
     * This function is called internally for filling in the `toPathCache` cache.
     * If the `validateVarNames` option for the constructor is set to a truthy
     * value, this function is called immediately which leads to a validation as
     * well because it throws an error if it cannot parse variable names.
     */
    Renderer.prototype.cacheParsedPaths = function () {
        var varNames = this.tokens.varNames;
        if (this.toPathCache === undefined) {
            this.toPathCache = new Array(varNames.length);
            for (var i = 0; i < varNames.length; i++) {
                this.toPathCache[i] = toPath.cached(varNames[i]);
            }
        }
    };
    Renderer.prototype.resolveVarNames = function (resolveFn, scope) {
        if (scope === void 0) { scope = {}; }
        var varNames = this.tokens.varNames;
        if (!isFn(resolveFn)) {
            throw new TypeError("Expected a resolver function. Got " + String(resolveFn));
        }
        var length = varNames.length;
        var values = new Array(length);
        for (var i = 0; i < length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            values[i] = resolveFn.call(null, varNames[i], scope);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return values;
    };
    /**
     * Puts the resolved `values` into the rest of the template (`strings`) and
     * returns the final result that'll be returned from `render()`, `renderFn()`
     * and `renderFnAsync()` functions.
     */
    Renderer.prototype.stringify = function (values) {
        var strings = this.tokens.strings;
        var explicit = this.options.explicit;
        var length = values.length;
        var ret = '';
        for (var i = 0; i < length; i++) {
            ret += strings[i];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            var value = values[i];
            if (explicit || (value !== null && value !== undefined)) {
                ret += value;
            }
        }
        ret += strings[length];
        return ret;
    };
    return Renderer;
}());

/**
 * Parses a template and returns the tokens in an object.
 *
 * @throws `TypeError` if there's an issue with its inputs
 * @throws `SyntaxError` if there's an issue with the template
 *
 * @param template the template
 * @param openSym the string that marks the start of a variable name
 * @param closeSym the string that marks the start of a variable name
 * @returns the resulting tokens as an object that has strings and variable names
 */
function tokenize(template, options) {
    if (options === void 0) { options = {}; }
    if (!isStr(template)) {
        throw new TypeError("The template parameter must be a string. Got a " + typeof template);
    }
    if (!isObj(options)) {
        throw new TypeError("Options should be an object. Got a " + typeof options);
    }
    var _a = options.tags, tags = _a === void 0 ? ['{{', '}}'] : _a, _b = options.maxVarNameLength, maxVarNameLength = _b === void 0 ? 1000 : _b;
    if (!isArr(tags) || tags.length !== 2) {
        throw TypeError("tags should be an array of two elements. Got " + String(tags));
    }
    var openSym = tags[0], closeSym = tags[1];
    if (!isStr(openSym, 1) || !isStr(closeSym, 1) || openSym === closeSym) {
        throw new TypeError("The open and close symbols should be two distinct non-empty strings. Got \"" + openSym + "\" and \"" + closeSym + "\"");
    }
    if (!isNum(maxVarNameLength) || maxVarNameLength <= 0) {
        throw new Error("Expected a positive number for maxVarNameLength. Got " + maxVarNameLength);
    }
    var openSymLen = openSym.length;
    var closeSymLen = closeSym.length;
    var openIndex;
    var closeIndex = 0;
    var varName;
    var strings = [];
    var varNames = [];
    var currentIndex = 0;
    while (currentIndex < template.length) {
        openIndex = template.indexOf(openSym, currentIndex);
        if (openIndex === -1) {
            break;
        }
        var varNameStartIndex = openIndex + openSymLen;
        closeIndex = template
            .substr(varNameStartIndex, maxVarNameLength + closeSymLen)
            .indexOf(closeSym);
        if (closeIndex === -1) {
            throw new SyntaxError("Missing \"" + closeSym + "\" in the template for the \"" + openSym + "\" at position " + openIndex + " within " + maxVarNameLength + " characters");
        }
        closeIndex += varNameStartIndex;
        varName = template.substring(varNameStartIndex, closeIndex).trim();
        if (varName.length === 0) {
            throw new SyntaxError("Unexpected \"" + closeSym + "\" tag found at position " + openIndex);
        }
        if (varName.includes(openSym)) {
            throw new SyntaxError("Variable names cannot have \"" + openSym + "\". But at position " + openIndex + ". Got \"" + varName + "\"");
        }
        varNames.push(varName);
        closeIndex += closeSymLen;
        strings.push(template.substring(currentIndex, openIndex));
        currentIndex = closeIndex;
    }
    strings.push(template.substring(closeIndex));
    return { strings: strings, varNames: varNames };
}

/**
 * Compiles a template and returns an object with functions that render it.
 * Compilation makes repeated render calls more optimized by parsing the
 * template only once and reusing the results.
 * As a result, rendering gets 3-5x faster.
 * Caching is stored in the resulting object, so if you free up all the
 * references to that object, the caches will be garbage collected.
 *
 * @param template same as the template parameter to .render()
 * @param options some options for customizing the compilation
 * @throws `TypeError` if the template is not a string
 * @throws `TypeError` if the options is set but is not an object
 * @throws any error that [[tokenize]] or [[Renderer.constructor]] may throw
 * @returns a [[Renderer]] object which has render methods
 */
function compile(template, options) {
    if (options === void 0) { options = {}; }
    var tokens = tokenize(template, options);
    return new Renderer(tokens, options);
}

/**
 * Replaces every {{varName}} inside the template with values from the scope
 * parameter.
 * @warning **When dealing with user input, always make sure to validate it.**
 * @param template The template containing one or more {{varName}} as
 * placeholders for values from the `scope` parameter.
 * @param scope An object containing values for variable names from the the
 * template. If it's omitted, we default to an empty object.
 * Since functions are objects in javascript, the `scope` can technically be a
 * function too but it won't be called. It'll be treated as an object and its
 * properties will be used for the lookup.
 * @param options same options as the [[compile]] function
 * @throws any error that [[compile]] or [[Renderer.render]] may throw
 * @returns Template where its variable names replaced with
 * corresponding values.
 */
function render(template, scope, options) {
    var renderer = compile(template, options);
    return renderer.render(scope);
}

function escapeStringRegexp(string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return string
		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
		.replace(/-/g, '\\x2d');
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

/** Used to compose unicode character classes. */
var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0';

/** Used to compose unicode capture groups. */
var rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']';

/**
 * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
 * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
 */
var reComboMark = RegExp(rsCombo, 'g');

/** Used to map Latin Unicode letters to basic Latin letters. */
var deburredLetters = {
  // Latin-1 Supplement block.
  '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
  '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
  '\xc7': 'C',  '\xe7': 'c',
  '\xd0': 'D',  '\xf0': 'd',
  '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
  '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
  '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
  '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
  '\xd1': 'N',  '\xf1': 'n',
  '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
  '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
  '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
  '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
  '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
  '\xc6': 'Ae', '\xe6': 'ae',
  '\xde': 'Th', '\xfe': 'th',
  '\xdf': 'ss',
  // Latin Extended-A block.
  '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
  '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
  '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
  '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
  '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
  '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
  '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
  '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
  '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
  '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
  '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
  '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
  '\u0134': 'J',  '\u0135': 'j',
  '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
  '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
  '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
  '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
  '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
  '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
  '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
  '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
  '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
  '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
  '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
  '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
  '\u0163': 't',  '\u0165': 't', '\u0167': 't',
  '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
  '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
  '\u0174': 'W',  '\u0175': 'w',
  '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
  '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
  '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
  '\u0132': 'IJ', '\u0133': 'ij',
  '\u0152': 'Oe', '\u0153': 'oe',
  '\u0149': "'n", '\u017f': 'ss'
};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * The base implementation of `_.propertyOf` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyOf(object) {
  return function(key) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
 * letters to basic Latin letters.
 *
 * @private
 * @param {string} letter The matched letter to deburr.
 * @returns {string} Returns the deburred letter.
 */
var deburrLetter = basePropertyOf(deburredLetters);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Deburrs `string` by converting
 * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
 * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
 * letters to basic Latin letters and removing
 * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to deburr.
 * @returns {string} Returns the deburred string.
 * @example
 *
 * _.deburr('déjà vu');
 * // => 'deja vu'
 */
function deburr(string) {
  string = toString(string);
  return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
}

var lodash_deburr = deburr;

const replacements = [
	// German umlauts
	['ß', 'ss'],
	['ẞ', 'Ss'],
	['ä', 'ae'],
	['Ä', 'Ae'],
	['ö', 'oe'],
	['Ö', 'Oe'],
	['ü', 'ue'],
	['Ü', 'Ue'],

	// Latin
	['À', 'A'],
	['Á', 'A'],
	['Â', 'A'],
	['Ã', 'A'],
	['Ä', 'Ae'],
	['Å', 'A'],
	['Æ', 'AE'],
	['Ç', 'C'],
	['È', 'E'],
	['É', 'E'],
	['Ê', 'E'],
	['Ë', 'E'],
	['Ì', 'I'],
	['Í', 'I'],
	['Î', 'I'],
	['Ï', 'I'],
	['Ð', 'D'],
	['Ñ', 'N'],
	['Ò', 'O'],
	['Ó', 'O'],
	['Ô', 'O'],
	['Õ', 'O'],
	['Ö', 'Oe'],
	['Ő', 'O'],
	['Ø', 'O'],
	['Ù', 'U'],
	['Ú', 'U'],
	['Û', 'U'],
	['Ü', 'Ue'],
	['Ű', 'U'],
	['Ý', 'Y'],
	['Þ', 'TH'],
	['ß', 'ss'],
	['à', 'a'],
	['á', 'a'],
	['â', 'a'],
	['ã', 'a'],
	['ä', 'ae'],
	['å', 'a'],
	['æ', 'ae'],
	['ç', 'c'],
	['è', 'e'],
	['é', 'e'],
	['ê', 'e'],
	['ë', 'e'],
	['ì', 'i'],
	['í', 'i'],
	['î', 'i'],
	['ï', 'i'],
	['ð', 'd'],
	['ñ', 'n'],
	['ò', 'o'],
	['ó', 'o'],
	['ô', 'o'],
	['õ', 'o'],
	['ö', 'oe'],
	['ő', 'o'],
	['ø', 'o'],
	['ù', 'u'],
	['ú', 'u'],
	['û', 'u'],
	['ü', 'ue'],
	['ű', 'u'],
	['ý', 'y'],
	['þ', 'th'],
	['ÿ', 'y'],
	['ẞ', 'SS'],

	// Vietnamese
	['à', 'a'],
	['À', 'A'],
	['á', 'a'],
	['Á', 'A'],
	['â', 'a'],
	['Â', 'A'],
	['ã', 'a'],
	['Ã', 'A'],
	['è', 'e'],
	['È', 'E'],
	['é', 'e'],
	['É', 'E'],
	['ê', 'e'],
	['Ê', 'E'],
	['ì', 'i'],
	['Ì', 'I'],
	['í', 'i'],
	['Í', 'I'],
	['ò', 'o'],
	['Ò', 'O'],
	['ó', 'o'],
	['Ó', 'O'],
	['ô', 'o'],
	['Ô', 'O'],
	['õ', 'o'],
	['Õ', 'O'],
	['ù', 'u'],
	['Ù', 'U'],
	['ú', 'u'],
	['Ú', 'U'],
	['ý', 'y'],
	['Ý', 'Y'],
	['ă', 'a'],
	['Ă', 'A'],
	['Đ', 'D'],
	['đ', 'd'],
	['ĩ', 'i'],
	['Ĩ', 'I'],
	['ũ', 'u'],
	['Ũ', 'U'],
	['ơ', 'o'],
	['Ơ', 'O'],
	['ư', 'u'],
	['Ư', 'U'],
	['ạ', 'a'],
	['Ạ', 'A'],
	['ả', 'a'],
	['Ả', 'A'],
	['ấ', 'a'],
	['Ấ', 'A'],
	['ầ', 'a'],
	['Ầ', 'A'],
	['ẩ', 'a'],
	['Ẩ', 'A'],
	['ẫ', 'a'],
	['Ẫ', 'A'],
	['ậ', 'a'],
	['Ậ', 'A'],
	['ắ', 'a'],
	['Ắ', 'A'],
	['ằ', 'a'],
	['Ằ', 'A'],
	['ẳ', 'a'],
	['Ẳ', 'A'],
	['ẵ', 'a'],
	['Ẵ', 'A'],
	['ặ', 'a'],
	['Ặ', 'A'],
	['ẹ', 'e'],
	['Ẹ', 'E'],
	['ẻ', 'e'],
	['Ẻ', 'E'],
	['ẽ', 'e'],
	['Ẽ', 'E'],
	['ế', 'e'],
	['Ế', 'E'],
	['ề', 'e'],
	['Ề', 'E'],
	['ể', 'e'],
	['Ể', 'E'],
	['ễ', 'e'],
	['Ễ', 'E'],
	['ệ', 'e'],
	['Ệ', 'E'],
	['ỉ', 'i'],
	['Ỉ', 'I'],
	['ị', 'i'],
	['Ị', 'I'],
	['ọ', 'o'],
	['Ọ', 'O'],
	['ỏ', 'o'],
	['Ỏ', 'O'],
	['ố', 'o'],
	['Ố', 'O'],
	['ồ', 'o'],
	['Ồ', 'O'],
	['ổ', 'o'],
	['Ổ', 'O'],
	['ỗ', 'o'],
	['Ỗ', 'O'],
	['ộ', 'o'],
	['Ộ', 'O'],
	['ớ', 'o'],
	['Ớ', 'O'],
	['ờ', 'o'],
	['Ờ', 'O'],
	['ở', 'o'],
	['Ở', 'O'],
	['ỡ', 'o'],
	['Ỡ', 'O'],
	['ợ', 'o'],
	['Ợ', 'O'],
	['ụ', 'u'],
	['Ụ', 'U'],
	['ủ', 'u'],
	['Ủ', 'U'],
	['ứ', 'u'],
	['Ứ', 'U'],
	['ừ', 'u'],
	['Ừ', 'U'],
	['ử', 'u'],
	['Ử', 'U'],
	['ữ', 'u'],
	['Ữ', 'U'],
	['ự', 'u'],
	['Ự', 'U'],
	['ỳ', 'y'],
	['Ỳ', 'Y'],
	['ỵ', 'y'],
	['Ỵ', 'Y'],
	['ỷ', 'y'],
	['Ỷ', 'Y'],
	['ỹ', 'y'],
	['Ỹ', 'Y'],

	// Arabic
	['ء', 'e'],
	['آ', 'a'],
	['أ', 'a'],
	['ؤ', 'w'],
	['إ', 'i'],
	['ئ', 'y'],
	['ا', 'a'],
	['ب', 'b'],
	['ة', 't'],
	['ت', 't'],
	['ث', 'th'],
	['ج', 'j'],
	['ح', 'h'],
	['خ', 'kh'],
	['د', 'd'],
	['ذ', 'dh'],
	['ر', 'r'],
	['ز', 'z'],
	['س', 's'],
	['ش', 'sh'],
	['ص', 's'],
	['ض', 'd'],
	['ط', 't'],
	['ظ', 'z'],
	['ع', 'e'],
	['غ', 'gh'],
	['ـ', '_'],
	['ف', 'f'],
	['ق', 'q'],
	['ك', 'k'],
	['ل', 'l'],
	['م', 'm'],
	['ن', 'n'],
	['ه', 'h'],
	['و', 'w'],
	['ى', 'a'],
	['ي', 'y'],
	['َ‎', 'a'],
	['ُ', 'u'],
	['ِ‎', 'i'],
	['٠', '0'],
	['١', '1'],
	['٢', '2'],
	['٣', '3'],
	['٤', '4'],
	['٥', '5'],
	['٦', '6'],
	['٧', '7'],
	['٨', '8'],
	['٩', '9'],

	// Persian / Farsi
	['چ', 'ch'],
	['ک', 'k'],
	['گ', 'g'],
	['پ', 'p'],
	['ژ', 'zh'],
	['ی', 'y'],
	['۰', '0'],
	['۱', '1'],
	['۲', '2'],
	['۳', '3'],
	['۴', '4'],
	['۵', '5'],
	['۶', '6'],
	['۷', '7'],
	['۸', '8'],
	['۹', '9'],

	// Pashto
	['ټ', 'p'],
	['ځ', 'z'],
	['څ', 'c'],
	['ډ', 'd'],
	['ﺫ', 'd'],
	['ﺭ', 'r'],
	['ړ', 'r'],
	['ﺯ', 'z'],
	['ږ', 'g'],
	['ښ', 'x'],
	['ګ', 'g'],
	['ڼ', 'n'],
	['ۀ', 'e'],
	['ې', 'e'],
	['ۍ', 'ai'],

	// Urdu
	['ٹ', 't'],
	['ڈ', 'd'],
	['ڑ', 'r'],
	['ں', 'n'],
	['ہ', 'h'],
	['ھ', 'h'],
	['ے', 'e'],

	// Russian
	['А', 'A'],
	['а', 'a'],
	['Б', 'B'],
	['б', 'b'],
	['В', 'V'],
	['в', 'v'],
	['Г', 'G'],
	['г', 'g'],
	['Д', 'D'],
	['д', 'd'],
	['ъе', 'ye'],
	['Ъе', 'Ye'],
	['ъЕ', 'yE'],
	['ЪЕ', 'YE'],
	['Е', 'E'],
	['е', 'e'],
	['Ё', 'Yo'],
	['ё', 'yo'],
	['Ж', 'Zh'],
	['ж', 'zh'],
	['З', 'Z'],
	['з', 'z'],
	['И', 'I'],
	['и', 'i'],
	['ый', 'iy'],
	['Ый', 'Iy'],
	['ЫЙ', 'IY'],
	['ыЙ', 'iY'],
	['Й', 'Y'],
	['й', 'y'],
	['К', 'K'],
	['к', 'k'],
	['Л', 'L'],
	['л', 'l'],
	['М', 'M'],
	['м', 'm'],
	['Н', 'N'],
	['н', 'n'],
	['О', 'O'],
	['о', 'o'],
	['П', 'P'],
	['п', 'p'],
	['Р', 'R'],
	['р', 'r'],
	['С', 'S'],
	['с', 's'],
	['Т', 'T'],
	['т', 't'],
	['У', 'U'],
	['у', 'u'],
	['Ф', 'F'],
	['ф', 'f'],
	['Х', 'Kh'],
	['х', 'kh'],
	['Ц', 'Ts'],
	['ц', 'ts'],
	['Ч', 'Ch'],
	['ч', 'ch'],
	['Ш', 'Sh'],
	['ш', 'sh'],
	['Щ', 'Sch'],
	['щ', 'sch'],
	['Ъ', ''],
	['ъ', ''],
	['Ы', 'Y'],
	['ы', 'y'],
	['Ь', ''],
	['ь', ''],
	['Э', 'E'],
	['э', 'e'],
	['Ю', 'Yu'],
	['ю', 'yu'],
	['Я', 'Ya'],
	['я', 'ya'],

	// Romanian
	['ă', 'a'],
	['Ă', 'A'],
	['ș', 's'],
	['Ș', 'S'],
	['ț', 't'],
	['Ț', 'T'],
	['ţ', 't'],
	['Ţ', 'T'],

	// Turkish
	['ş', 's'],
	['Ş', 'S'],
	['ç', 'c'],
	['Ç', 'C'],
	['ğ', 'g'],
	['Ğ', 'G'],
	['ı', 'i'],
	['İ', 'I'],

	// Armenian
	['ա', 'a'],
	['Ա', 'A'],
	['բ', 'b'],
	['Բ', 'B'],
	['գ', 'g'],
	['Գ', 'G'],
	['դ', 'd'],
	['Դ', 'D'],
	['ե', 'ye'],
	['Ե', 'Ye'],
	['զ', 'z'],
	['Զ', 'Z'],
	['է', 'e'],
	['Է', 'E'],
	['ը', 'y'],
	['Ը', 'Y'],
	['թ', 't'],
	['Թ', 'T'],
	['ժ', 'zh'],
	['Ժ', 'Zh'],
	['ի', 'i'],
	['Ի', 'I'],
	['լ', 'l'],
	['Լ', 'L'],
	['խ', 'kh'],
	['Խ', 'Kh'],
	['ծ', 'ts'],
	['Ծ', 'Ts'],
	['կ', 'k'],
	['Կ', 'K'],
	['հ', 'h'],
	['Հ', 'H'],
	['ձ', 'dz'],
	['Ձ', 'Dz'],
	['ղ', 'gh'],
	['Ղ', 'Gh'],
	['ճ', 'tch'],
	['Ճ', 'Tch'],
	['մ', 'm'],
	['Մ', 'M'],
	['յ', 'y'],
	['Յ', 'Y'],
	['ն', 'n'],
	['Ն', 'N'],
	['շ', 'sh'],
	['Շ', 'Sh'],
	['ո', 'vo'],
	['Ո', 'Vo'],
	['չ', 'ch'],
	['Չ', 'Ch'],
	['պ', 'p'],
	['Պ', 'P'],
	['ջ', 'j'],
	['Ջ', 'J'],
	['ռ', 'r'],
	['Ռ', 'R'],
	['ս', 's'],
	['Ս', 'S'],
	['վ', 'v'],
	['Վ', 'V'],
	['տ', 't'],
	['Տ', 'T'],
	['ր', 'r'],
	['Ր', 'R'],
	['ց', 'c'],
	['Ց', 'C'],
	['ու', 'u'],
	['ՈՒ', 'U'],
	['Ու', 'U'],
	['փ', 'p'],
	['Փ', 'P'],
	['ք', 'q'],
	['Ք', 'Q'],
	['օ', 'o'],
	['Օ', 'O'],
	['ֆ', 'f'],
	['Ֆ', 'F'],
	['և', 'yev'],

	// Georgian
	['ა', 'a'],
	['ბ', 'b'],
	['გ', 'g'],
	['დ', 'd'],
	['ე', 'e'],
	['ვ', 'v'],
	['ზ', 'z'],
	['თ', 't'],
	['ი', 'i'],
	['კ', 'k'],
	['ლ', 'l'],
	['მ', 'm'],
	['ნ', 'n'],
	['ო', 'o'],
	['პ', 'p'],
	['ჟ', 'zh'],
	['რ', 'r'],
	['ს', 's'],
	['ტ', 't'],
	['უ', 'u'],
	['ფ', 'ph'],
	['ქ', 'q'],
	['ღ', 'gh'],
	['ყ', 'k'],
	['შ', 'sh'],
	['ჩ', 'ch'],
	['ც', 'ts'],
	['ძ', 'dz'],
	['წ', 'ts'],
	['ჭ', 'tch'],
	['ხ', 'kh'],
	['ჯ', 'j'],
	['ჰ', 'h'],

	// Czech
	['č', 'c'],
	['ď', 'd'],
	['ě', 'e'],
	['ň', 'n'],
	['ř', 'r'],
	['š', 's'],
	['ť', 't'],
	['ů', 'u'],
	['ž', 'z'],
	['Č', 'C'],
	['Ď', 'D'],
	['Ě', 'E'],
	['Ň', 'N'],
	['Ř', 'R'],
	['Š', 'S'],
	['Ť', 'T'],
	['Ů', 'U'],
	['Ž', 'Z'],

	// Dhivehi
	['ހ', 'h'],
	['ށ', 'sh'],
	['ނ', 'n'],
	['ރ', 'r'],
	['ބ', 'b'],
	['ޅ', 'lh'],
	['ކ', 'k'],
	['އ', 'a'],
	['ވ', 'v'],
	['މ', 'm'],
	['ފ', 'f'],
	['ދ', 'dh'],
	['ތ', 'th'],
	['ލ', 'l'],
	['ގ', 'g'],
	['ޏ', 'gn'],
	['ސ', 's'],
	['ޑ', 'd'],
	['ޒ', 'z'],
	['ޓ', 't'],
	['ޔ', 'y'],
	['ޕ', 'p'],
	['ޖ', 'j'],
	['ޗ', 'ch'],
	['ޘ', 'tt'],
	['ޙ', 'hh'],
	['ޚ', 'kh'],
	['ޛ', 'th'],
	['ޜ', 'z'],
	['ޝ', 'sh'],
	['ޞ', 's'],
	['ޟ', 'd'],
	['ޠ', 't'],
	['ޡ', 'z'],
	['ޢ', 'a'],
	['ޣ', 'gh'],
	['ޤ', 'q'],
	['ޥ', 'w'],
	['ަ', 'a'],
	['ާ', 'aa'],
	['ި', 'i'],
	['ީ', 'ee'],
	['ު', 'u'],
	['ޫ', 'oo'],
	['ެ', 'e'],
	['ޭ', 'ey'],
	['ޮ', 'o'],
	['ޯ', 'oa'],
	['ް', ''],

	// Greek
	['α', 'a'],
	['β', 'v'],
	['γ', 'g'],
	['δ', 'd'],
	['ε', 'e'],
	['ζ', 'z'],
	['η', 'i'],
	['θ', 'th'],
	['ι', 'i'],
	['κ', 'k'],
	['λ', 'l'],
	['μ', 'm'],
	['ν', 'n'],
	['ξ', 'ks'],
	['ο', 'o'],
	['π', 'p'],
	['ρ', 'r'],
	['σ', 's'],
	['τ', 't'],
	['υ', 'y'],
	['φ', 'f'],
	['χ', 'x'],
	['ψ', 'ps'],
	['ω', 'o'],
	['ά', 'a'],
	['έ', 'e'],
	['ί', 'i'],
	['ό', 'o'],
	['ύ', 'y'],
	['ή', 'i'],
	['ώ', 'o'],
	['ς', 's'],
	['ϊ', 'i'],
	['ΰ', 'y'],
	['ϋ', 'y'],
	['ΐ', 'i'],
	['Α', 'A'],
	['Β', 'B'],
	['Γ', 'G'],
	['Δ', 'D'],
	['Ε', 'E'],
	['Ζ', 'Z'],
	['Η', 'I'],
	['Θ', 'TH'],
	['Ι', 'I'],
	['Κ', 'K'],
	['Λ', 'L'],
	['Μ', 'M'],
	['Ν', 'N'],
	['Ξ', 'KS'],
	['Ο', 'O'],
	['Π', 'P'],
	['Ρ', 'R'],
	['Σ', 'S'],
	['Τ', 'T'],
	['Υ', 'Y'],
	['Φ', 'F'],
	['Χ', 'X'],
	['Ψ', 'PS'],
	['Ω', 'O'],
	['Ά', 'A'],
	['Έ', 'E'],
	['Ί', 'I'],
	['Ό', 'O'],
	['Ύ', 'Y'],
	['Ή', 'I'],
	['Ώ', 'O'],
	['Ϊ', 'I'],
	['Ϋ', 'Y'],

	// Disabled as it conflicts with German and Latin.
	// Hungarian
	// ['ä', 'a'],
	// ['Ä', 'A'],
	// ['ö', 'o'],
	// ['Ö', 'O'],
	// ['ü', 'u'],
	// ['Ü', 'U'],
	// ['ű', 'u'],
	// ['Ű', 'U'],

	// Latvian
	['ā', 'a'],
	['ē', 'e'],
	['ģ', 'g'],
	['ī', 'i'],
	['ķ', 'k'],
	['ļ', 'l'],
	['ņ', 'n'],
	['ū', 'u'],
	['Ā', 'A'],
	['Ē', 'E'],
	['Ģ', 'G'],
	['Ī', 'I'],
	['Ķ', 'K'],
	['Ļ', 'L'],
	['Ņ', 'N'],
	['Ū', 'U'],
	['č', 'c'],
	['š', 's'],
	['ž', 'z'],
	['Č', 'C'],
	['Š', 'S'],
	['Ž', 'Z'],

	// Lithuanian
	['ą', 'a'],
	['č', 'c'],
	['ę', 'e'],
	['ė', 'e'],
	['į', 'i'],
	['š', 's'],
	['ų', 'u'],
	['ū', 'u'],
	['ž', 'z'],
	['Ą', 'A'],
	['Č', 'C'],
	['Ę', 'E'],
	['Ė', 'E'],
	['Į', 'I'],
	['Š', 'S'],
	['Ų', 'U'],
	['Ū', 'U'],

	// Macedonian
	['Ќ', 'Kj'],
	['ќ', 'kj'],
	['Љ', 'Lj'],
	['љ', 'lj'],
	['Њ', 'Nj'],
	['њ', 'nj'],
	['Тс', 'Ts'],
	['тс', 'ts'],

	// Polish
	['ą', 'a'],
	['ć', 'c'],
	['ę', 'e'],
	['ł', 'l'],
	['ń', 'n'],
	['ś', 's'],
	['ź', 'z'],
	['ż', 'z'],
	['Ą', 'A'],
	['Ć', 'C'],
	['Ę', 'E'],
	['Ł', 'L'],
	['Ń', 'N'],
	['Ś', 'S'],
	['Ź', 'Z'],
	['Ż', 'Z'],

	// Disabled as it conflicts with Vietnamese.
	// Serbian
	// ['љ', 'lj'],
	// ['њ', 'nj'],
	// ['Љ', 'Lj'],
	// ['Њ', 'Nj'],
	// ['đ', 'dj'],
	// ['Đ', 'Dj'],
	// ['ђ', 'dj'],
	// ['ј', 'j'],
	// ['ћ', 'c'],
	// ['џ', 'dz'],
	// ['Ђ', 'Dj'],
	// ['Ј', 'j'],
	// ['Ћ', 'C'],
	// ['Џ', 'Dz'],

	// Disabled as it conflicts with German and Latin.
	// Slovak
	// ['ä', 'a'],
	// ['Ä', 'A'],
	// ['ľ', 'l'],
	// ['ĺ', 'l'],
	// ['ŕ', 'r'],
	// ['Ľ', 'L'],
	// ['Ĺ', 'L'],
	// ['Ŕ', 'R'],

	// Disabled as it conflicts with German and Latin.
	// Swedish
	// ['å', 'o'],
	// ['Å', 'o'],
	// ['ä', 'a'],
	// ['Ä', 'A'],
	// ['ë', 'e'],
	// ['Ë', 'E'],
	// ['ö', 'o'],
	// ['Ö', 'O'],

	// Ukrainian
	['Є', 'Ye'],
	['І', 'I'],
	['Ї', 'Yi'],
	['Ґ', 'G'],
	['є', 'ye'],
	['і', 'i'],
	['ї', 'yi'],
	['ґ', 'g'],

	// Dutch
	['Ĳ', 'IJ'],
	['ĳ', 'ij'],

	// Danish
	// ['Æ', 'Ae'],
	// ['Ø', 'Oe'],
	// ['Å', 'Aa'],
	// ['æ', 'ae'],
	// ['ø', 'oe'],
	// ['å', 'aa']

	// Currencies
	['¢', 'c'],
	['¥', 'Y'],
	['߿', 'b'],
	['৳', 't'],
	['૱', 'Bo'],
	['฿', 'B'],
	['₠', 'CE'],
	['₡', 'C'],
	['₢', 'Cr'],
	['₣', 'F'],
	['₥', 'm'],
	['₦', 'N'],
	['₧', 'Pt'],
	['₨', 'Rs'],
	['₩', 'W'],
	['₫', 's'],
	['€', 'E'],
	['₭', 'K'],
	['₮', 'T'],
	['₯', 'Dp'],
	['₰', 'S'],
	['₱', 'P'],
	['₲', 'G'],
	['₳', 'A'],
	['₴', 'S'],
	['₵', 'C'],
	['₶', 'tt'],
	['₷', 'S'],
	['₸', 'T'],
	['₹', 'R'],
	['₺', 'L'],
	['₽', 'P'],
	['₿', 'B'],
	['﹩', '$'],
	['￠', 'c'],
	['￥', 'Y'],
	['￦', 'W'],

	// Latin
	['𝐀', 'A'],
	['𝐁', 'B'],
	['𝐂', 'C'],
	['𝐃', 'D'],
	['𝐄', 'E'],
	['𝐅', 'F'],
	['𝐆', 'G'],
	['𝐇', 'H'],
	['𝐈', 'I'],
	['𝐉', 'J'],
	['𝐊', 'K'],
	['𝐋', 'L'],
	['𝐌', 'M'],
	['𝐍', 'N'],
	['𝐎', 'O'],
	['𝐏', 'P'],
	['𝐐', 'Q'],
	['𝐑', 'R'],
	['𝐒', 'S'],
	['𝐓', 'T'],
	['𝐔', 'U'],
	['𝐕', 'V'],
	['𝐖', 'W'],
	['𝐗', 'X'],
	['𝐘', 'Y'],
	['𝐙', 'Z'],
	['𝐚', 'a'],
	['𝐛', 'b'],
	['𝐜', 'c'],
	['𝐝', 'd'],
	['𝐞', 'e'],
	['𝐟', 'f'],
	['𝐠', 'g'],
	['𝐡', 'h'],
	['𝐢', 'i'],
	['𝐣', 'j'],
	['𝐤', 'k'],
	['𝐥', 'l'],
	['𝐦', 'm'],
	['𝐧', 'n'],
	['𝐨', 'o'],
	['𝐩', 'p'],
	['𝐪', 'q'],
	['𝐫', 'r'],
	['𝐬', 's'],
	['𝐭', 't'],
	['𝐮', 'u'],
	['𝐯', 'v'],
	['𝐰', 'w'],
	['𝐱', 'x'],
	['𝐲', 'y'],
	['𝐳', 'z'],
	['𝐴', 'A'],
	['𝐵', 'B'],
	['𝐶', 'C'],
	['𝐷', 'D'],
	['𝐸', 'E'],
	['𝐹', 'F'],
	['𝐺', 'G'],
	['𝐻', 'H'],
	['𝐼', 'I'],
	['𝐽', 'J'],
	['𝐾', 'K'],
	['𝐿', 'L'],
	['𝑀', 'M'],
	['𝑁', 'N'],
	['𝑂', 'O'],
	['𝑃', 'P'],
	['𝑄', 'Q'],
	['𝑅', 'R'],
	['𝑆', 'S'],
	['𝑇', 'T'],
	['𝑈', 'U'],
	['𝑉', 'V'],
	['𝑊', 'W'],
	['𝑋', 'X'],
	['𝑌', 'Y'],
	['𝑍', 'Z'],
	['𝑎', 'a'],
	['𝑏', 'b'],
	['𝑐', 'c'],
	['𝑑', 'd'],
	['𝑒', 'e'],
	['𝑓', 'f'],
	['𝑔', 'g'],
	['𝑖', 'i'],
	['𝑗', 'j'],
	['𝑘', 'k'],
	['𝑙', 'l'],
	['𝑚', 'm'],
	['𝑛', 'n'],
	['𝑜', 'o'],
	['𝑝', 'p'],
	['𝑞', 'q'],
	['𝑟', 'r'],
	['𝑠', 's'],
	['𝑡', 't'],
	['𝑢', 'u'],
	['𝑣', 'v'],
	['𝑤', 'w'],
	['𝑥', 'x'],
	['𝑦', 'y'],
	['𝑧', 'z'],
	['𝑨', 'A'],
	['𝑩', 'B'],
	['𝑪', 'C'],
	['𝑫', 'D'],
	['𝑬', 'E'],
	['𝑭', 'F'],
	['𝑮', 'G'],
	['𝑯', 'H'],
	['𝑰', 'I'],
	['𝑱', 'J'],
	['𝑲', 'K'],
	['𝑳', 'L'],
	['𝑴', 'M'],
	['𝑵', 'N'],
	['𝑶', 'O'],
	['𝑷', 'P'],
	['𝑸', 'Q'],
	['𝑹', 'R'],
	['𝑺', 'S'],
	['𝑻', 'T'],
	['𝑼', 'U'],
	['𝑽', 'V'],
	['𝑾', 'W'],
	['𝑿', 'X'],
	['𝒀', 'Y'],
	['𝒁', 'Z'],
	['𝒂', 'a'],
	['𝒃', 'b'],
	['𝒄', 'c'],
	['𝒅', 'd'],
	['𝒆', 'e'],
	['𝒇', 'f'],
	['𝒈', 'g'],
	['𝒉', 'h'],
	['𝒊', 'i'],
	['𝒋', 'j'],
	['𝒌', 'k'],
	['𝒍', 'l'],
	['𝒎', 'm'],
	['𝒏', 'n'],
	['𝒐', 'o'],
	['𝒑', 'p'],
	['𝒒', 'q'],
	['𝒓', 'r'],
	['𝒔', 's'],
	['𝒕', 't'],
	['𝒖', 'u'],
	['𝒗', 'v'],
	['𝒘', 'w'],
	['𝒙', 'x'],
	['𝒚', 'y'],
	['𝒛', 'z'],
	['𝒜', 'A'],
	['𝒞', 'C'],
	['𝒟', 'D'],
	['𝒢', 'g'],
	['𝒥', 'J'],
	['𝒦', 'K'],
	['𝒩', 'N'],
	['𝒪', 'O'],
	['𝒫', 'P'],
	['𝒬', 'Q'],
	['𝒮', 'S'],
	['𝒯', 'T'],
	['𝒰', 'U'],
	['𝒱', 'V'],
	['𝒲', 'W'],
	['𝒳', 'X'],
	['𝒴', 'Y'],
	['𝒵', 'Z'],
	['𝒶', 'a'],
	['𝒷', 'b'],
	['𝒸', 'c'],
	['𝒹', 'd'],
	['𝒻', 'f'],
	['𝒽', 'h'],
	['𝒾', 'i'],
	['𝒿', 'j'],
	['𝓀', 'h'],
	['𝓁', 'l'],
	['𝓂', 'm'],
	['𝓃', 'n'],
	['𝓅', 'p'],
	['𝓆', 'q'],
	['𝓇', 'r'],
	['𝓈', 's'],
	['𝓉', 't'],
	['𝓊', 'u'],
	['𝓋', 'v'],
	['𝓌', 'w'],
	['𝓍', 'x'],
	['𝓎', 'y'],
	['𝓏', 'z'],
	['𝓐', 'A'],
	['𝓑', 'B'],
	['𝓒', 'C'],
	['𝓓', 'D'],
	['𝓔', 'E'],
	['𝓕', 'F'],
	['𝓖', 'G'],
	['𝓗', 'H'],
	['𝓘', 'I'],
	['𝓙', 'J'],
	['𝓚', 'K'],
	['𝓛', 'L'],
	['𝓜', 'M'],
	['𝓝', 'N'],
	['𝓞', 'O'],
	['𝓟', 'P'],
	['𝓠', 'Q'],
	['𝓡', 'R'],
	['𝓢', 'S'],
	['𝓣', 'T'],
	['𝓤', 'U'],
	['𝓥', 'V'],
	['𝓦', 'W'],
	['𝓧', 'X'],
	['𝓨', 'Y'],
	['𝓩', 'Z'],
	['𝓪', 'a'],
	['𝓫', 'b'],
	['𝓬', 'c'],
	['𝓭', 'd'],
	['𝓮', 'e'],
	['𝓯', 'f'],
	['𝓰', 'g'],
	['𝓱', 'h'],
	['𝓲', 'i'],
	['𝓳', 'j'],
	['𝓴', 'k'],
	['𝓵', 'l'],
	['𝓶', 'm'],
	['𝓷', 'n'],
	['𝓸', 'o'],
	['𝓹', 'p'],
	['𝓺', 'q'],
	['𝓻', 'r'],
	['𝓼', 's'],
	['𝓽', 't'],
	['𝓾', 'u'],
	['𝓿', 'v'],
	['𝔀', 'w'],
	['𝔁', 'x'],
	['𝔂', 'y'],
	['𝔃', 'z'],
	['𝔄', 'A'],
	['𝔅', 'B'],
	['𝔇', 'D'],
	['𝔈', 'E'],
	['𝔉', 'F'],
	['𝔊', 'G'],
	['𝔍', 'J'],
	['𝔎', 'K'],
	['𝔏', 'L'],
	['𝔐', 'M'],
	['𝔑', 'N'],
	['𝔒', 'O'],
	['𝔓', 'P'],
	['𝔔', 'Q'],
	['𝔖', 'S'],
	['𝔗', 'T'],
	['𝔘', 'U'],
	['𝔙', 'V'],
	['𝔚', 'W'],
	['𝔛', 'X'],
	['𝔜', 'Y'],
	['𝔞', 'a'],
	['𝔟', 'b'],
	['𝔠', 'c'],
	['𝔡', 'd'],
	['𝔢', 'e'],
	['𝔣', 'f'],
	['𝔤', 'g'],
	['𝔥', 'h'],
	['𝔦', 'i'],
	['𝔧', 'j'],
	['𝔨', 'k'],
	['𝔩', 'l'],
	['𝔪', 'm'],
	['𝔫', 'n'],
	['𝔬', 'o'],
	['𝔭', 'p'],
	['𝔮', 'q'],
	['𝔯', 'r'],
	['𝔰', 's'],
	['𝔱', 't'],
	['𝔲', 'u'],
	['𝔳', 'v'],
	['𝔴', 'w'],
	['𝔵', 'x'],
	['𝔶', 'y'],
	['𝔷', 'z'],
	['𝔸', 'A'],
	['𝔹', 'B'],
	['𝔻', 'D'],
	['𝔼', 'E'],
	['𝔽', 'F'],
	['𝔾', 'G'],
	['𝕀', 'I'],
	['𝕁', 'J'],
	['𝕂', 'K'],
	['𝕃', 'L'],
	['𝕄', 'M'],
	['𝕆', 'N'],
	['𝕊', 'S'],
	['𝕋', 'T'],
	['𝕌', 'U'],
	['𝕍', 'V'],
	['𝕎', 'W'],
	['𝕏', 'X'],
	['𝕐', 'Y'],
	['𝕒', 'a'],
	['𝕓', 'b'],
	['𝕔', 'c'],
	['𝕕', 'd'],
	['𝕖', 'e'],
	['𝕗', 'f'],
	['𝕘', 'g'],
	['𝕙', 'h'],
	['𝕚', 'i'],
	['𝕛', 'j'],
	['𝕜', 'k'],
	['𝕝', 'l'],
	['𝕞', 'm'],
	['𝕟', 'n'],
	['𝕠', 'o'],
	['𝕡', 'p'],
	['𝕢', 'q'],
	['𝕣', 'r'],
	['𝕤', 's'],
	['𝕥', 't'],
	['𝕦', 'u'],
	['𝕧', 'v'],
	['𝕨', 'w'],
	['𝕩', 'x'],
	['𝕪', 'y'],
	['𝕫', 'z'],
	['𝕬', 'A'],
	['𝕭', 'B'],
	['𝕮', 'C'],
	['𝕯', 'D'],
	['𝕰', 'E'],
	['𝕱', 'F'],
	['𝕲', 'G'],
	['𝕳', 'H'],
	['𝕴', 'I'],
	['𝕵', 'J'],
	['𝕶', 'K'],
	['𝕷', 'L'],
	['𝕸', 'M'],
	['𝕹', 'N'],
	['𝕺', 'O'],
	['𝕻', 'P'],
	['𝕼', 'Q'],
	['𝕽', 'R'],
	['𝕾', 'S'],
	['𝕿', 'T'],
	['𝖀', 'U'],
	['𝖁', 'V'],
	['𝖂', 'W'],
	['𝖃', 'X'],
	['𝖄', 'Y'],
	['𝖅', 'Z'],
	['𝖆', 'a'],
	['𝖇', 'b'],
	['𝖈', 'c'],
	['𝖉', 'd'],
	['𝖊', 'e'],
	['𝖋', 'f'],
	['𝖌', 'g'],
	['𝖍', 'h'],
	['𝖎', 'i'],
	['𝖏', 'j'],
	['𝖐', 'k'],
	['𝖑', 'l'],
	['𝖒', 'm'],
	['𝖓', 'n'],
	['𝖔', 'o'],
	['𝖕', 'p'],
	['𝖖', 'q'],
	['𝖗', 'r'],
	['𝖘', 's'],
	['𝖙', 't'],
	['𝖚', 'u'],
	['𝖛', 'v'],
	['𝖜', 'w'],
	['𝖝', 'x'],
	['𝖞', 'y'],
	['𝖟', 'z'],
	['𝖠', 'A'],
	['𝖡', 'B'],
	['𝖢', 'C'],
	['𝖣', 'D'],
	['𝖤', 'E'],
	['𝖥', 'F'],
	['𝖦', 'G'],
	['𝖧', 'H'],
	['𝖨', 'I'],
	['𝖩', 'J'],
	['𝖪', 'K'],
	['𝖫', 'L'],
	['𝖬', 'M'],
	['𝖭', 'N'],
	['𝖮', 'O'],
	['𝖯', 'P'],
	['𝖰', 'Q'],
	['𝖱', 'R'],
	['𝖲', 'S'],
	['𝖳', 'T'],
	['𝖴', 'U'],
	['𝖵', 'V'],
	['𝖶', 'W'],
	['𝖷', 'X'],
	['𝖸', 'Y'],
	['𝖹', 'Z'],
	['𝖺', 'a'],
	['𝖻', 'b'],
	['𝖼', 'c'],
	['𝖽', 'd'],
	['𝖾', 'e'],
	['𝖿', 'f'],
	['𝗀', 'g'],
	['𝗁', 'h'],
	['𝗂', 'i'],
	['𝗃', 'j'],
	['𝗄', 'k'],
	['𝗅', 'l'],
	['𝗆', 'm'],
	['𝗇', 'n'],
	['𝗈', 'o'],
	['𝗉', 'p'],
	['𝗊', 'q'],
	['𝗋', 'r'],
	['𝗌', 's'],
	['𝗍', 't'],
	['𝗎', 'u'],
	['𝗏', 'v'],
	['𝗐', 'w'],
	['𝗑', 'x'],
	['𝗒', 'y'],
	['𝗓', 'z'],
	['𝗔', 'A'],
	['𝗕', 'B'],
	['𝗖', 'C'],
	['𝗗', 'D'],
	['𝗘', 'E'],
	['𝗙', 'F'],
	['𝗚', 'G'],
	['𝗛', 'H'],
	['𝗜', 'I'],
	['𝗝', 'J'],
	['𝗞', 'K'],
	['𝗟', 'L'],
	['𝗠', 'M'],
	['𝗡', 'N'],
	['𝗢', 'O'],
	['𝗣', 'P'],
	['𝗤', 'Q'],
	['𝗥', 'R'],
	['𝗦', 'S'],
	['𝗧', 'T'],
	['𝗨', 'U'],
	['𝗩', 'V'],
	['𝗪', 'W'],
	['𝗫', 'X'],
	['𝗬', 'Y'],
	['𝗭', 'Z'],
	['𝗮', 'a'],
	['𝗯', 'b'],
	['𝗰', 'c'],
	['𝗱', 'd'],
	['𝗲', 'e'],
	['𝗳', 'f'],
	['𝗴', 'g'],
	['𝗵', 'h'],
	['𝗶', 'i'],
	['𝗷', 'j'],
	['𝗸', 'k'],
	['𝗹', 'l'],
	['𝗺', 'm'],
	['𝗻', 'n'],
	['𝗼', 'o'],
	['𝗽', 'p'],
	['𝗾', 'q'],
	['𝗿', 'r'],
	['𝘀', 's'],
	['𝘁', 't'],
	['𝘂', 'u'],
	['𝘃', 'v'],
	['𝘄', 'w'],
	['𝘅', 'x'],
	['𝘆', 'y'],
	['𝘇', 'z'],
	['𝘈', 'A'],
	['𝘉', 'B'],
	['𝘊', 'C'],
	['𝘋', 'D'],
	['𝘌', 'E'],
	['𝘍', 'F'],
	['𝘎', 'G'],
	['𝘏', 'H'],
	['𝘐', 'I'],
	['𝘑', 'J'],
	['𝘒', 'K'],
	['𝘓', 'L'],
	['𝘔', 'M'],
	['𝘕', 'N'],
	['𝘖', 'O'],
	['𝘗', 'P'],
	['𝘘', 'Q'],
	['𝘙', 'R'],
	['𝘚', 'S'],
	['𝘛', 'T'],
	['𝘜', 'U'],
	['𝘝', 'V'],
	['𝘞', 'W'],
	['𝘟', 'X'],
	['𝘠', 'Y'],
	['𝘡', 'Z'],
	['𝘢', 'a'],
	['𝘣', 'b'],
	['𝘤', 'c'],
	['𝘥', 'd'],
	['𝘦', 'e'],
	['𝘧', 'f'],
	['𝘨', 'g'],
	['𝘩', 'h'],
	['𝘪', 'i'],
	['𝘫', 'j'],
	['𝘬', 'k'],
	['𝘭', 'l'],
	['𝘮', 'm'],
	['𝘯', 'n'],
	['𝘰', 'o'],
	['𝘱', 'p'],
	['𝘲', 'q'],
	['𝘳', 'r'],
	['𝘴', 's'],
	['𝘵', 't'],
	['𝘶', 'u'],
	['𝘷', 'v'],
	['𝘸', 'w'],
	['𝘹', 'x'],
	['𝘺', 'y'],
	['𝘻', 'z'],
	['𝘼', 'A'],
	['𝘽', 'B'],
	['𝘾', 'C'],
	['𝘿', 'D'],
	['𝙀', 'E'],
	['𝙁', 'F'],
	['𝙂', 'G'],
	['𝙃', 'H'],
	['𝙄', 'I'],
	['𝙅', 'J'],
	['𝙆', 'K'],
	['𝙇', 'L'],
	['𝙈', 'M'],
	['𝙉', 'N'],
	['𝙊', 'O'],
	['𝙋', 'P'],
	['𝙌', 'Q'],
	['𝙍', 'R'],
	['𝙎', 'S'],
	['𝙏', 'T'],
	['𝙐', 'U'],
	['𝙑', 'V'],
	['𝙒', 'W'],
	['𝙓', 'X'],
	['𝙔', 'Y'],
	['𝙕', 'Z'],
	['𝙖', 'a'],
	['𝙗', 'b'],
	['𝙘', 'c'],
	['𝙙', 'd'],
	['𝙚', 'e'],
	['𝙛', 'f'],
	['𝙜', 'g'],
	['𝙝', 'h'],
	['𝙞', 'i'],
	['𝙟', 'j'],
	['𝙠', 'k'],
	['𝙡', 'l'],
	['𝙢', 'm'],
	['𝙣', 'n'],
	['𝙤', 'o'],
	['𝙥', 'p'],
	['𝙦', 'q'],
	['𝙧', 'r'],
	['𝙨', 's'],
	['𝙩', 't'],
	['𝙪', 'u'],
	['𝙫', 'v'],
	['𝙬', 'w'],
	['𝙭', 'x'],
	['𝙮', 'y'],
	['𝙯', 'z'],
	['𝙰', 'A'],
	['𝙱', 'B'],
	['𝙲', 'C'],
	['𝙳', 'D'],
	['𝙴', 'E'],
	['𝙵', 'F'],
	['𝙶', 'G'],
	['𝙷', 'H'],
	['𝙸', 'I'],
	['𝙹', 'J'],
	['𝙺', 'K'],
	['𝙻', 'L'],
	['𝙼', 'M'],
	['𝙽', 'N'],
	['𝙾', 'O'],
	['𝙿', 'P'],
	['𝚀', 'Q'],
	['𝚁', 'R'],
	['𝚂', 'S'],
	['𝚃', 'T'],
	['𝚄', 'U'],
	['𝚅', 'V'],
	['𝚆', 'W'],
	['𝚇', 'X'],
	['𝚈', 'Y'],
	['𝚉', 'Z'],
	['𝚊', 'a'],
	['𝚋', 'b'],
	['𝚌', 'c'],
	['𝚍', 'd'],
	['𝚎', 'e'],
	['𝚏', 'f'],
	['𝚐', 'g'],
	['𝚑', 'h'],
	['𝚒', 'i'],
	['𝚓', 'j'],
	['𝚔', 'k'],
	['𝚕', 'l'],
	['𝚖', 'm'],
	['𝚗', 'n'],
	['𝚘', 'o'],
	['𝚙', 'p'],
	['𝚚', 'q'],
	['𝚛', 'r'],
	['𝚜', 's'],
	['𝚝', 't'],
	['𝚞', 'u'],
	['𝚟', 'v'],
	['𝚠', 'w'],
	['𝚡', 'x'],
	['𝚢', 'y'],
	['𝚣', 'z'],

	// Dotless letters
	['𝚤', 'l'],
	['𝚥', 'j'],

	// Greek
	['𝛢', 'A'],
	['𝛣', 'B'],
	['𝛤', 'G'],
	['𝛥', 'D'],
	['𝛦', 'E'],
	['𝛧', 'Z'],
	['𝛨', 'I'],
	['𝛩', 'TH'],
	['𝛪', 'I'],
	['𝛫', 'K'],
	['𝛬', 'L'],
	['𝛭', 'M'],
	['𝛮', 'N'],
	['𝛯', 'KS'],
	['𝛰', 'O'],
	['𝛱', 'P'],
	['𝛲', 'R'],
	['𝛳', 'TH'],
	['𝛴', 'S'],
	['𝛵', 'T'],
	['𝛶', 'Y'],
	['𝛷', 'F'],
	['𝛸', 'x'],
	['𝛹', 'PS'],
	['𝛺', 'O'],
	['𝛻', 'D'],
	['𝛼', 'a'],
	['𝛽', 'b'],
	['𝛾', 'g'],
	['𝛿', 'd'],
	['𝜀', 'e'],
	['𝜁', 'z'],
	['𝜂', 'i'],
	['𝜃', 'th'],
	['𝜄', 'i'],
	['𝜅', 'k'],
	['𝜆', 'l'],
	['𝜇', 'm'],
	['𝜈', 'n'],
	['𝜉', 'ks'],
	['𝜊', 'o'],
	['𝜋', 'p'],
	['𝜌', 'r'],
	['𝜍', 's'],
	['𝜎', 's'],
	['𝜏', 't'],
	['𝜐', 'y'],
	['𝜑', 'f'],
	['𝜒', 'x'],
	['𝜓', 'ps'],
	['𝜔', 'o'],
	['𝜕', 'd'],
	['𝜖', 'E'],
	['𝜗', 'TH'],
	['𝜘', 'K'],
	['𝜙', 'f'],
	['𝜚', 'r'],
	['𝜛', 'p'],
	['𝜜', 'A'],
	['𝜝', 'V'],
	['𝜞', 'G'],
	['𝜟', 'D'],
	['𝜠', 'E'],
	['𝜡', 'Z'],
	['𝜢', 'I'],
	['𝜣', 'TH'],
	['𝜤', 'I'],
	['𝜥', 'K'],
	['𝜦', 'L'],
	['𝜧', 'M'],
	['𝜨', 'N'],
	['𝜩', 'KS'],
	['𝜪', 'O'],
	['𝜫', 'P'],
	['𝜬', 'S'],
	['𝜭', 'TH'],
	['𝜮', 'S'],
	['𝜯', 'T'],
	['𝜰', 'Y'],
	['𝜱', 'F'],
	['𝜲', 'X'],
	['𝜳', 'PS'],
	['𝜴', 'O'],
	['𝜵', 'D'],
	['𝜶', 'a'],
	['𝜷', 'v'],
	['𝜸', 'g'],
	['𝜹', 'd'],
	['𝜺', 'e'],
	['𝜻', 'z'],
	['𝜼', 'i'],
	['𝜽', 'th'],
	['𝜾', 'i'],
	['𝜿', 'k'],
	['𝝀', 'l'],
	['𝝁', 'm'],
	['𝝂', 'n'],
	['𝝃', 'ks'],
	['𝝄', 'o'],
	['𝝅', 'p'],
	['𝝆', 'r'],
	['𝝇', 's'],
	['𝝈', 's'],
	['𝝉', 't'],
	['𝝊', 'y'],
	['𝝋', 'f'],
	['𝝌', 'x'],
	['𝝍', 'ps'],
	['𝝎', 'o'],
	['𝝏', 'a'],
	['𝝐', 'e'],
	['𝝑', 'i'],
	['𝝒', 'k'],
	['𝝓', 'f'],
	['𝝔', 'r'],
	['𝝕', 'p'],
	['𝝖', 'A'],
	['𝝗', 'B'],
	['𝝘', 'G'],
	['𝝙', 'D'],
	['𝝚', 'E'],
	['𝝛', 'Z'],
	['𝝜', 'I'],
	['𝝝', 'TH'],
	['𝝞', 'I'],
	['𝝟', 'K'],
	['𝝠', 'L'],
	['𝝡', 'M'],
	['𝝢', 'N'],
	['𝝣', 'KS'],
	['𝝤', 'O'],
	['𝝥', 'P'],
	['𝝦', 'R'],
	['𝝧', 'TH'],
	['𝝨', 'S'],
	['𝝩', 'T'],
	['𝝪', 'Y'],
	['𝝫', 'F'],
	['𝝬', 'X'],
	['𝝭', 'PS'],
	['𝝮', 'O'],
	['𝝯', 'D'],
	['𝝰', 'a'],
	['𝝱', 'v'],
	['𝝲', 'g'],
	['𝝳', 'd'],
	['𝝴', 'e'],
	['𝝵', 'z'],
	['𝝶', 'i'],
	['𝝷', 'th'],
	['𝝸', 'i'],
	['𝝹', 'k'],
	['𝝺', 'l'],
	['𝝻', 'm'],
	['𝝼', 'n'],
	['𝝽', 'ks'],
	['𝝾', 'o'],
	['𝝿', 'p'],
	['𝞀', 'r'],
	['𝞁', 's'],
	['𝞂', 's'],
	['𝞃', 't'],
	['𝞄', 'y'],
	['𝞅', 'f'],
	['𝞆', 'x'],
	['𝞇', 'ps'],
	['𝞈', 'o'],
	['𝞉', 'a'],
	['𝞊', 'e'],
	['𝞋', 'i'],
	['𝞌', 'k'],
	['𝞍', 'f'],
	['𝞎', 'r'],
	['𝞏', 'p'],
	['𝞐', 'A'],
	['𝞑', 'V'],
	['𝞒', 'G'],
	['𝞓', 'D'],
	['𝞔', 'E'],
	['𝞕', 'Z'],
	['𝞖', 'I'],
	['𝞗', 'TH'],
	['𝞘', 'I'],
	['𝞙', 'K'],
	['𝞚', 'L'],
	['𝞛', 'M'],
	['𝞜', 'N'],
	['𝞝', 'KS'],
	['𝞞', 'O'],
	['𝞟', 'P'],
	['𝞠', 'S'],
	['𝞡', 'TH'],
	['𝞢', 'S'],
	['𝞣', 'T'],
	['𝞤', 'Y'],
	['𝞥', 'F'],
	['𝞦', 'X'],
	['𝞧', 'PS'],
	['𝞨', 'O'],
	['𝞩', 'D'],
	['𝞪', 'av'],
	['𝞫', 'g'],
	['𝞬', 'd'],
	['𝞭', 'e'],
	['𝞮', 'z'],
	['𝞯', 'i'],
	['𝞰', 'i'],
	['𝞱', 'th'],
	['𝞲', 'i'],
	['𝞳', 'k'],
	['𝞴', 'l'],
	['𝞵', 'm'],
	['𝞶', 'n'],
	['𝞷', 'ks'],
	['𝞸', 'o'],
	['𝞹', 'p'],
	['𝞺', 'r'],
	['𝞻', 's'],
	['𝞼', 's'],
	['𝞽', 't'],
	['𝞾', 'y'],
	['𝞿', 'f'],
	['𝟀', 'x'],
	['𝟁', 'ps'],
	['𝟂', 'o'],
	['𝟃', 'a'],
	['𝟄', 'e'],
	['𝟅', 'i'],
	['𝟆', 'k'],
	['𝟇', 'f'],
	['𝟈', 'r'],
	['𝟉', 'p'],
	['𝟊', 'F'],
	['𝟋', 'f'],
	['⒜', '(a)'],
	['⒝', '(b)'],
	['⒞', '(c)'],
	['⒟', '(d)'],
	['⒠', '(e)'],
	['⒡', '(f)'],
	['⒢', '(g)'],
	['⒣', '(h)'],
	['⒤', '(i)'],
	['⒥', '(j)'],
	['⒦', '(k)'],
	['⒧', '(l)'],
	['⒨', '(m)'],
	['⒩', '(n)'],
	['⒪', '(o)'],
	['⒫', '(p)'],
	['⒬', '(q)'],
	['⒭', '(r)'],
	['⒮', '(s)'],
	['⒯', '(t)'],
	['⒰', '(u)'],
	['⒱', '(v)'],
	['⒲', '(w)'],
	['⒳', '(x)'],
	['⒴', '(y)'],
	['⒵', '(z)'],
	['Ⓐ', '(A)'],
	['Ⓑ', '(B)'],
	['Ⓒ', '(C)'],
	['Ⓓ', '(D)'],
	['Ⓔ', '(E)'],
	['Ⓕ', '(F)'],
	['Ⓖ', '(G)'],
	['Ⓗ', '(H)'],
	['Ⓘ', '(I)'],
	['Ⓙ', '(J)'],
	['Ⓚ', '(K)'],
	['Ⓛ', '(L)'],
	['Ⓝ', '(N)'],
	['Ⓞ', '(O)'],
	['Ⓟ', '(P)'],
	['Ⓠ', '(Q)'],
	['Ⓡ', '(R)'],
	['Ⓢ', '(S)'],
	['Ⓣ', '(T)'],
	['Ⓤ', '(U)'],
	['Ⓥ', '(V)'],
	['Ⓦ', '(W)'],
	['Ⓧ', '(X)'],
	['Ⓨ', '(Y)'],
	['Ⓩ', '(Z)'],
	['ⓐ', '(a)'],
	['ⓑ', '(b)'],
	['ⓒ', '(b)'],
	['ⓓ', '(c)'],
	['ⓔ', '(e)'],
	['ⓕ', '(f)'],
	['ⓖ', '(g)'],
	['ⓗ', '(h)'],
	['ⓘ', '(i)'],
	['ⓙ', '(j)'],
	['ⓚ', '(k)'],
	['ⓛ', '(l)'],
	['ⓜ', '(m)'],
	['ⓝ', '(n)'],
	['ⓞ', '(o)'],
	['ⓟ', '(p)'],
	['ⓠ', '(q)'],
	['ⓡ', '(r)'],
	['ⓢ', '(s)'],
	['ⓣ', '(t)'],
	['ⓤ', '(u)'],
	['ⓥ', '(v)'],
	['ⓦ', '(w)'],
	['ⓧ', '(x)'],
	['ⓨ', '(y)'],
	['ⓩ', '(z)'],

	// Maltese
	['Ċ', 'C'],
	['ċ', 'c'],
	['Ġ', 'G'],
	['ġ', 'g'],
	['Ħ', 'H'],
	['ħ', 'h'],
	['Ż', 'Z'],
	['ż', 'z'],

	// Numbers
	['𝟎', '0'],
	['𝟏', '1'],
	['𝟐', '2'],
	['𝟑', '3'],
	['𝟒', '4'],
	['𝟓', '5'],
	['𝟔', '6'],
	['𝟕', '7'],
	['𝟖', '8'],
	['𝟗', '9'],
	['𝟘', '0'],
	['𝟙', '1'],
	['𝟚', '2'],
	['𝟛', '3'],
	['𝟜', '4'],
	['𝟝', '5'],
	['𝟞', '6'],
	['𝟟', '7'],
	['𝟠', '8'],
	['𝟡', '9'],
	['𝟢', '0'],
	['𝟣', '1'],
	['𝟤', '2'],
	['𝟥', '3'],
	['𝟦', '4'],
	['𝟧', '5'],
	['𝟨', '6'],
	['𝟩', '7'],
	['𝟪', '8'],
	['𝟫', '9'],
	['𝟬', '0'],
	['𝟭', '1'],
	['𝟮', '2'],
	['𝟯', '3'],
	['𝟰', '4'],
	['𝟱', '5'],
	['𝟲', '6'],
	['𝟳', '7'],
	['𝟴', '8'],
	['𝟵', '9'],
	['𝟶', '0'],
	['𝟷', '1'],
	['𝟸', '2'],
	['𝟹', '3'],
	['𝟺', '4'],
	['𝟻', '5'],
	['𝟼', '6'],
	['𝟽', '7'],
	['𝟾', '8'],
	['𝟿', '9'],
	['①', '1'],
	['②', '2'],
	['③', '3'],
	['④', '4'],
	['⑤', '5'],
	['⑥', '6'],
	['⑦', '7'],
	['⑧', '8'],
	['⑨', '9'],
	['⑩', '10'],
	['⑪', '11'],
	['⑫', '12'],
	['⑬', '13'],
	['⑭', '14'],
	['⑮', '15'],
	['⑯', '16'],
	['⑰', '17'],
	['⑱', '18'],
	['⑲', '19'],
	['⑳', '20'],
	['⑴', '1'],
	['⑵', '2'],
	['⑶', '3'],
	['⑷', '4'],
	['⑸', '5'],
	['⑹', '6'],
	['⑺', '7'],
	['⑻', '8'],
	['⑼', '9'],
	['⑽', '10'],
	['⑾', '11'],
	['⑿', '12'],
	['⒀', '13'],
	['⒁', '14'],
	['⒂', '15'],
	['⒃', '16'],
	['⒄', '17'],
	['⒅', '18'],
	['⒆', '19'],
	['⒇', '20'],
	['⒈', '1.'],
	['⒉', '2.'],
	['⒊', '3.'],
	['⒋', '4.'],
	['⒌', '5.'],
	['⒍', '6.'],
	['⒎', '7.'],
	['⒏', '8.'],
	['⒐', '9.'],
	['⒑', '10.'],
	['⒒', '11.'],
	['⒓', '12.'],
	['⒔', '13.'],
	['⒕', '14.'],
	['⒖', '15.'],
	['⒗', '16.'],
	['⒘', '17.'],
	['⒙', '18.'],
	['⒚', '19.'],
	['⒛', '20.'],
	['⓪', '0'],
	['⓫', '11'],
	['⓬', '12'],
	['⓭', '13'],
	['⓮', '14'],
	['⓯', '15'],
	['⓰', '16'],
	['⓱', '17'],
	['⓲', '18'],
	['⓳', '19'],
	['⓴', '20'],
	['⓵', '1'],
	['⓶', '2'],
	['⓷', '3'],
	['⓸', '4'],
	['⓹', '5'],
	['⓺', '6'],
	['⓻', '7'],
	['⓼', '8'],
	['⓽', '9'],
	['⓾', '10'],
	['⓿', '0'],

	// Punctuation
	['🙰', '&'],
	['🙱', '&'],
	['🙲', '&'],
	['🙳', '&'],
	['🙴', '&'],
	['🙵', '&'],
	['🙶', '"'],
	['🙷', '"'],
	['🙸', '"'],
	['‽', '?!'],
	['🙹', '?!'],
	['🙺', '?!'],
	['🙻', '?!'],
	['🙼', '/'],
	['🙽', '\\'],

	// Alchemy
	['🜇', 'AR'],
	['🜈', 'V'],
	['🜉', 'V'],
	['🜆', 'VR'],
	['🜅', 'VF'],
	['🜩', '2'],
	['🜪', '5'],
	['🝡', 'f'],
	['🝢', 'W'],
	['🝣', 'U'],
	['🝧', 'V'],
	['🝨', 'T'],
	['🝪', 'V'],
	['🝫', 'MB'],
	['🝬', 'VB'],
	['🝲', '3B'],
	['🝳', '3B'],

	// Emojis
	['💯', '100'],
	['🔙', 'BACK'],
	['🔚', 'END'],
	['🔛', 'ON!'],
	['🔜', 'SOON'],
	['🔝', 'TOP'],
	['🔞', '18'],
	['🔤', 'abc'],
	['🔠', 'ABCD'],
	['🔡', 'abcd'],
	['🔢', '1234'],
	['🔣', 'T&@%'],
	['#️⃣', '#'],
	['*️⃣', '*'],
	['0️⃣', '0'],
	['1️⃣', '1'],
	['2️⃣', '2'],
	['3️⃣', '3'],
	['4️⃣', '4'],
	['5️⃣', '5'],
	['6️⃣', '6'],
	['7️⃣', '7'],
	['8️⃣', '8'],
	['9️⃣', '9'],
	['🔟', '10'],
	['🅰️', 'A'],
	['🅱️', 'B'],
	['🆎', 'AB'],
	['🆑', 'CL'],
	['🅾️', 'O'],
	['🅿', 'P'],
	['🆘', 'SOS'],
	['🅲', 'C'],
	['🅳', 'D'],
	['🅴', 'E'],
	['🅵', 'F'],
	['🅶', 'G'],
	['🅷', 'H'],
	['🅸', 'I'],
	['🅹', 'J'],
	['🅺', 'K'],
	['🅻', 'L'],
	['🅼', 'M'],
	['🅽', 'N'],
	['🆀', 'Q'],
	['🆁', 'R'],
	['🆂', 'S'],
	['🆃', 'T'],
	['🆄', 'U'],
	['🆅', 'V'],
	['🆆', 'W'],
	['🆇', 'X'],
	['🆈', 'Y'],
	['🆉', 'Z']
];

const doCustomReplacements = (string, replacements) => {
	for (const [key, value] of replacements) {
		// TODO: Use `String#replaceAll()` when targeting Node.js 16.
		string = string.replace(new RegExp(escapeStringRegexp(key), 'g'), value);
	}

	return string;
};

function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options
	};

	const customReplacements = new Map([
		...replacements,
		...options.customReplacements
	]);

	string = string.normalize();
	string = doCustomReplacements(string, customReplacements);
	string = lodash_deburr(string);

	return string;
}

const overridableReplacements = [
	['&', ' and '],
	['🦄', ' unicorn '],
	['♥', ' love ']
];

const decamelize = string => {
	return string
		// Separate capitalized words.
		.replace(/([A-Z]{2,})(\d+)/g, '$1 $2')
		.replace(/([a-z\d]+)([A-Z]{2,})/g, '$1 $2')

		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2');
};

const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replace(new RegExp(`${escapedSeparator}{2,}`, 'g'), separator)
		.replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, 'g'), '');
};

function slugify(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		separator: '-',
		lowercase: true,
		decamelize: true,
		customReplacements: [],
		preserveLeadingUnderscore: false,
		preserveTrailingDash: false,
		...options
	};

	const shouldPrependUnderscore = options.preserveLeadingUnderscore && string.startsWith('_');
	const shouldAppendDash = options.preserveTrailingDash && string.endsWith('-');

	const customReplacements = new Map([
		...overridableReplacements,
		...options.customReplacements
	]);

	string = transliterate(string, {customReplacements});

	if (options.decamelize) {
		string = decamelize(string);
	}

	let patternSlug = /[^a-zA-Z\d]+/g;

	if (options.lowercase) {
		string = string.toLowerCase();
		patternSlug = /[^a-z\d]+/g;
	}

	string = string.replace(patternSlug, options.separator);
	string = string.replace(/\\/g, '');
	if (options.separator) {
		string = removeMootSeparators(string, options.separator);
	}

	if (shouldPrependUnderscore) {
		string = `_${string}`;
	}

	if (shouldAppendDash) {
		string = `${string}-`;
	}

	return string;
}

const _hoisted_1 = { class: "prefixsuffix" };
const _hoisted_2 = { class: "prefixsuffix" };
const _hoisted_3 = {
    key: 1,
    class: "link-preview-mode"
};
const _hoisted_4 = ["href"];
var script = /*#__PURE__*/ defineComponent({
    __name: 'interface',
    props: {
        primaryKey: { type: [Number, String], required: true },
        field: { type: String, required: true },
        value: { type: String, required: true },
        disabled: { type: Boolean, required: false, default: false },
        placeholder: { type: [String, null], required: true, default: null },
        template: { type: String, required: true, default: '' },
        prefix: { type: String, required: false, default: '' },
        suffix: { type: String, required: false, default: '' },
        iconLeft: { type: [String, null], required: true, default: null },
        length: { type: Number, required: false },
        autofocus: { type: Boolean, required: false, default: false },
        update: { type: Array, required: false, default: () => ['create'] }
    },
    emits: ['input'],
    setup(__props, { emit }) {
        const props = __props;
        const attrs = useAttrs();
        const { t } = useI18n();
        const values = inject('values', ref({}));
        const isEditing = ref(props.autofocus);
        const isTouched = ref(false);
        const cachedValueBeforeEdit = ref(props.value);
        const trim = ref(true);
        const renderedPrefix = computed(() => render(props.prefix || '', values.value));
        const renderedSuffix = computed(() => render(props.suffix || '', values.value));
        const presentedLink = computed(() => {
            var _a;
            return renderedPrefix.value +
                (props.value || props.placeholder || ((_a = attrs['field-data']) === null || _a === void 0 ? void 0 : _a.meta.field)) +
                renderedSuffix.value;
        });
        const isDiffer = computed(() => {
            const transformed = transform(render(props.template, values.value));
            if (transformed === (props.value || ''))
                return false;
            return transformed !== (props.value || '').replace(/-\d+$/, '');
        });
        watch(values, (values) => {
            // Reject manual touching.
            if (isEditing.value || isTouched.value)
                return;
            // According the update policy.
            if (!(props.primaryKey !== '+'
                ? props.update.includes('update')
                : props.update.includes('create')))
                return;
            // Avoid self update.
            if (values[props.field] &&
                (values[props.field] || '') !== (props.value || ''))
                return;
            emitter(values);
        });
        function onKeyPress(event) {
            if (event.key === 'Escape') {
                // Temporary disable triming to avoid overwriting of the model value by the blur event inside v-input.
                trim.value = false;
                isTouched.value = false;
                emit('input', cachedValueBeforeEdit.value);
                nextTick(() => {
                    disableEdit();
                    trim.value = true;
                });
            }
            else if (event.key === 'Enter') {
                disableEdit();
            }
        }
        function onChange(value) {
            if (props.disabled)
                return;
            if (props.value === value)
                return;
            isTouched.value = Boolean(value && value.trim());
            // Emit exact value.
            emit('input', transform(value || ''));
        }
        window.slugify = slugify;
        function transform(value) {
            return value
                .split('/')
                .map((segment) => slugify(segment, { separator: '-', preserveTrailingDash: true }).slice(0, props.length))
                .join('/');
        }
        function setByCurrentState() {
            isTouched.value = false;
            emitter(values.value);
        }
        function emitter(values) {
            const newValue = transform(render(props.template, values));
            if (newValue === (props.value || ''))
                return;
            emit('input', newValue);
        }
        function enableEdit() {
            cachedValueBeforeEdit.value = props.value;
            isEditing.value = true;
        }
        function disableEdit() {
            isEditing.value = false;
        }
        return (_ctx, _cache) => {
            const _component_v_icon = resolveComponent("v-icon");
            const _component_v_input = resolveComponent("v-input");
            const _component_v_button = resolveComponent("v-button");
            const _directive_tooltip = resolveDirective("tooltip");
            return (isEditing.value && !__props.disabled)
                ? (openBlock(), createBlock(_component_v_input, {
                    key: 0,
                    autofocus: true,
                    "model-value": __props.value,
                    placeholder: __props.placeholder,
                    trim: trim.value,
                    "onUpdate:modelValue": onChange,
                    onBlur: disableEdit,
                    onKeydown: onKeyPress
                }, createSlots({ _: 2 /* DYNAMIC */ }, [
                    (__props.iconLeft || unref(renderedPrefix))
                        ? {
                            name: "prepend",
                            fn: withCtx(() => [
                                (__props.iconLeft)
                                    ? (openBlock(), createBlock(_component_v_icon, {
                                        key: 0,
                                        name: __props.iconLeft
                                    }, null, 8 /* PROPS */, ["name"]))
                                    : createCommentVNode("v-if", true),
                                createElementVNode("span", _hoisted_1, toDisplayString(unref(renderedPrefix)), 1 /* TEXT */)
                            ])
                        }
                        : undefined,
                    (unref(renderedSuffix))
                        ? {
                            name: "append",
                            fn: withCtx(() => [
                                createElementVNode("span", _hoisted_2, toDisplayString(unref(renderedSuffix)), 1 /* TEXT */)
                            ])
                        }
                        : undefined
                ]), 1032 /* PROPS, DYNAMIC_SLOTS */, ["model-value", "placeholder", "trim"]))
                : (openBlock(), createElementBlock("div", _hoisted_3, [
                    (__props.iconLeft)
                        ? (openBlock(), createBlock(_component_v_icon, {
                            key: 0,
                            name: __props.iconLeft,
                            class: "icon-left"
                        }, null, 8 /* PROPS */, ["name"]))
                        : createCommentVNode("v-if", true),
                    (__props.value && __props.prefix)
                        ? (openBlock(), createElementBlock("a", {
                            key: 1,
                            target: "_blank",
                            class: "link",
                            href: unref(presentedLink)
                        }, toDisplayString(unref(presentedLink)), 9 /* TEXT, PROPS */, _hoisted_4))
                        : (openBlock(), createElementBlock("span", {
                            key: 2,
                            class: "link",
                            onClick: _cache[0] || (_cache[0] = ($event) => (!__props.disabled && enableEdit))
                        }, toDisplayString(unref(presentedLink)), 1 /* TEXT */)),
                    (!__props.disabled)
                        ? withDirectives((openBlock(), createBlock(_component_v_button, {
                            key: 3,
                            "x-small": "",
                            secondary: "",
                            icon: "",
                            class: "action-button",
                            onClick: enableEdit
                        }, {
                            default: withCtx(() => [
                                createVNode(_component_v_icon, { name: "edit" })
                            ]),
                            _: 1 /* STABLE */
                        })), [
                            [_directive_tooltip, unref(t)('edit')]
                        ])
                        : createCommentVNode("v-if", true),
                    (unref(isDiffer) && !isTouched.value)
                        ? withDirectives((openBlock(), createBlock(_component_v_button, {
                            key: 4,
                            "x-small": "",
                            secondary: "",
                            icon: "",
                            class: "action-button",
                            onClick: setByCurrentState
                        }, {
                            default: withCtx(() => [
                                createVNode(_component_v_icon, { name: "auto_fix_high" })
                            ]),
                            _: 1 /* STABLE */
                        })), [
                            [_directive_tooltip, unref(t)('auto_generate')]
                        ])
                        : createCommentVNode("v-if", true)
                ]));
        };
    }
});

var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

var css = "\n.prefixsuffix[data-v-64969d30] {\n\tcolor: var(--foreground-subdued);\n}\n.link-preview-mode[data-v-64969d30] {\n\tdisplay: flex;\n\talign-items: center;\n\tmin-height: var(--input-height);\n}\n.icon-left[data-v-64969d30] {\n\tmargin-right: 8px;\n}\n.action-button[data-v-64969d30] {\n\tmargin-left: 8px;\n}\n.link[data-v-64969d30] {\n\tcolor: var(--foreground-subdued);\n\ttext-decoration: underline;\n\tword-break: break-word;\n}\na.link[data-v-64969d30] {\n\tcolor: var(--primary);\n}\na.link[data-v-64969d30]:focus-visible,\na.link[data-v-64969d30]:hover {\n\tcolor: var(--primary-75);\n}\n";
n(css,{});

script.__scopeId = "data-v-64969d30";
script.__file = "src/interface.vue";

var index = defineInterface({
    id: 'slug',
    name: 'Slug',
    icon: 'box',
    description: 'Slug',
    types: ['string'],
    component: script,
    options: ({ collection }) => [
        {
            field: 'placeholder',
            name: '$t:placeholder',
            meta: {
                width: 'full',
                interface: 'input',
                options: {
                    placeholder: '$t:enter_a_placeholder',
                },
            },
        },
        {
            field: 'template',
            type: 'string',
            name: '$t:template',
            meta: {
                width: 'full',
                interface: 'system-display-template',
                required: true,
                options: {
                    collectionName: collection,
                    font: 'monospace',
                    placeholder: '{{ title }}-{{ id }}',
                },
            },
        },
        {
            field: 'prefix',
            type: 'string',
            name: '$t:prefix',
            meta: {
                width: 'full',
                interface: 'system-display-template',
                required: true,
                options: {
                    collectionName: collection,
                    font: 'monospace',
                    placeholder: 'http://example.com/',
                },
            },
        },
    ],
});

export { index as default };
