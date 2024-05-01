"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.TokenType = void 0;
var constructors_1 = require("../constructors");
var utils_1 = require("../utils");
var errors_1 = require("./errors");
var lexer_1 = require("./lexer");
var TokenType;
(function (TokenType) {
    TokenType["space"] = "space";
    TokenType["operator"] = "operator";
    TokenType["string"] = "string";
    TokenType["number"] = "number";
    TokenType["boolean"] = "boolean";
    TokenType["literal"] = "literal";
    TokenType["unknown"] = "unknown";
})(TokenType || (exports.TokenType = TokenType = {}));
var Parser = /** @class */ (function () {
    function Parser(commandOption, config) {
        if (config === void 0) { config = Parser.defaultConfig; }
        this.argOptions = {};
        this.constructors = {};
        this.lexers = [];
        this.registerConstructorMap(constructors_1.Constructors);
        this.registerLexers(lexer_1.Providers);
        this.commandOptions = commandOption;
        this.argOptions = commandOption.args;
        this.config = __assign(__assign({}, Parser.defaultConfig), config);
    }
    Parser.prototype.registerConstructorMap = function (constructos) {
        Object.assign(this.constructors, constructos);
        return this;
    };
    Parser.prototype.registerConstructor = function (name, constructor) {
        this.constructors[name] = constructor;
    };
    Parser.prototype.registerLexer = function (lexer) {
        this.lexers.push(lexer);
        return this;
    };
    Parser.prototype.registerLexers = function (lexers) {
        var _a;
        (_a = this.lexers).push.apply(_a, lexers);
        return this;
    };
    Parser.prototype.fullParse = function (input) {
        return this._parseCommand(this._lexer(input));
    };
    Parser.prototype._getName = function (token) {
        var name = (new constructors_1.Constructors.STRING()).convert(token, constructors_1.TYPES.STRING);
        return String(name);
    };
    Parser.prototype._acronymsToArg = function (input) {
        return __assign(__assign({}, (("name" in input) ? input : Parser.defaultArg)), { type: ("name" in input) ? input.type : input });
    };
    Parser.prototype._parseArg = function (tokens, expected) {
        var _name = tokens.shift(), _this = this;
        if (!_name) {
            throw new Error('No tokens provided');
        }
        var name = this._getName(_name);
        var current = 0, expectedArgs = expected.args, output = [], catchedAll = [];
        var state = {
            createCycleTracker: function () {
                return new utils_1.CycleTracker(_this.config.maxCycles);
            },
            getCurrentToken: function () {
                return tokens[current];
            },
            getToken: function (offset) {
                if (offset === void 0) { offset = 0; }
                return tokens[current + offset];
            },
            is: function (token) {
                var t = tokens[current];
                return (t === null || t === void 0 ? void 0 : t.type) === token.type && (t === null || t === void 0 ? void 0 : t.value) === token.value;
            },
            parseConfig: _this.config,
            __tokens: tokens,
        };
        var utils = {
            next: function (num) {
                if (num === void 0) { num = 1; }
                current += num;
                return utils;
            }
        };
        var _cycleTracker = state.createCycleTracker();
        while (expectedArgs.length) {
            _cycleTracker.next(function () { return console.log("Cycle limit exceeded: ".concat(tokens.slice(current - 5, current + 5), "\n current index: ").concat(current)); });
            var _arg = expectedArgs.shift();
            var arg = this._acronymsToArg(_arg);
            var constructor = arg.type;
            if (!state.getCurrentToken()) {
                if (arg.required)
                    throw new errors_1.ParseArgTypeError('Missing required argument', current, arg.name, arg.type.constructor.TYPE, 'undefined');
                break;
            }
            var type = constructor.construct().parse(state, utils, !!arg.required, arg.type.constructor.TYPE);
            output.push(type);
        }
        if (!expected.allowExcess && state.getCurrentToken()) {
            throw new errors_1.ParseSyntaxError('Excess tokens');
        }
        if (expected.catchAll) {
            while (state.getCurrentToken()) {
                catchedAll.push(state.getCurrentToken());
                utils.next();
            }
        }
        return {
            argOptions: expected,
            parsed: {
                commandName: name,
                commandArgs: output,
                catchedAll: catchedAll
            }
        };
    };
    Parser.prototype._parseCommand = function (tokens) {
        var _this_1 = this;
        var res = {};
        for (var _i = 0, _a = Object.entries(this.argOptions); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], arg = _b[1];
            try {
                res[name_1] = {
                    name: name_1,
                    accepted: true,
                    result: this._parseArg(__spreadArray([], tokens, true), __assign(__assign({}, arg), { args: __spreadArray([], arg.args.map(function (a) { return (__assign({}, _this_1._acronymsToArg(a))); }), true) }))
                };
            }
            catch (e) {
                if (this.config.logErrors)
                    console.error(e);
                res[name_1] = {
                    name: name_1,
                    accepted: false,
                    result: {
                        argOptions: arg,
                    }
                };
                continue;
            }
        }
        return res;
    };
    Parser.prototype._lexer = function (input) {
        var _this = this;
        var tokens = [], current = 0;
        var state = __assign({ validSpace: new RegExp(/\s/), validChar: new RegExp("[a-zA-Z0-9\u4e00-\u9fa5\u0100-\u017F_@]"), validIntegerOnly: new RegExp("[0-9]"), validNumberOnly: new RegExp("[0-9.]"), validLetterOnly: new RegExp("[a-zA-Z\u4e00-\u9fa5\u0100-\u017F_]"), getCurrent: function () {
                return current;
            }, getCurrentToken: function () {
                return input[current];
            }, getNextTokens: function (start, num) {
                if (start === void 0) { start = current; }
                if (num === void 0) { num = 1; }
                var tokens = [];
                for (var i = 0; i < num; i++) {
                    if (input[start + i])
                        tokens.push(input[start + i]);
                }
                return tokens;
            }, tracked: function (type, mes, i) {
                if (i === void 0) { i = current; }
                var message = "".concat(mes, "\nat index ").concat(i, ":\n").concat(input.slice(i - 10, i + 10), "\n").concat(i >= 10 ? ' '.repeat(10) : ' '.repeat(i), "^");
                return Reflect.construct(type, [message]);
            }, isNumber: function (start) {
                if (start === void 0) { start = current; }
                var i = start, decimalFound = false;
                while (i < input.length) {
                    if (Parser.operators.includes(input[i]) || state.validSpace.test(input[i]))
                        return true;
                    if (!this.validNumberOnly.test(input[i]))
                        return false;
                    if (input[i] === '.') {
                        if (decimalFound)
                            return false;
                        decimalFound = true;
                    }
                    i++;
                }
                return true;
            }, getNextNonContentChar: function (start) {
                if (start === void 0) { start = current; }
                var i = start;
                while (i < input.length) {
                    if (Parser.operators.includes(input[i]) || state.validSpace.test(input[i]) || input[i] === undefined)
                        return i;
                    i++;
                }
                return i;
            }, createCycleTracker: function () {
                return new utils_1.CycleTracker(_this.config.maxCycles);
            } }, (_this.config.overwrites || {}));
        var utils = {
            next: function (num) {
                if (num === void 0) { num = 1; }
                current += num;
                return utils;
            },
            createToken: function (_a, skip) {
                var type = _a.type, value = _a.value;
                if (skip === void 0) { skip = false; }
                if (!type)
                    throw new Error('Invalid token');
                tokens.push({ type: type, value: value });
                if (skip)
                    utils.next();
                return utils;
            },
            flowString: function (endString, maxLength) {
                if (maxLength === void 0) { maxLength = Infinity; }
                var value = [];
                while (current < input.length && value.length < maxLength) {
                    var char = state.getCurrentToken();
                    if (endString ? char === endString : (state.validSpace.test(char) || Parser.operators.includes(char))) {
                        return value.join("");
                    }
                    value.push(char);
                    utils.next();
                }
                if (endString)
                    throw state.tracked(errors_1.ParseError, 'Unexpected end of input');
                return value.join("");
            },
        };
        if (input.length && this.commandOptions.head) {
            var head = state.getNextTokens(0, this.commandOptions.head.length);
            if (head.join('') === this.commandOptions.head) {
                utils.next(this.commandOptions.head.length);
            }
        }
        var _cycleTracker = state.createCycleTracker();
        _: while (current < input.length) {
            _cycleTracker.next(function () { return console.log("Cycle limit exceeded: ".concat(input.slice(current - 10, current + 10), "\n current index: ").concat(current)); });
            var char = state.getCurrentToken();
            if (state.validSpace.test(char)) {
                utils.next();
                continue;
            }
            if (Parser.operators.includes(char)) {
                utils.createToken({ type: TokenType.operator, value: char })
                    .next();
                continue;
            }
            for (var _i = 0, _a = this.lexers; _i < _a.length; _i++) {
                var provider = _a[_i];
                if (provider.condition(state, utils) && provider.trigger(state, utils)) {
                    continue _;
                }
            }
            if (state.validChar.test(char)) {
                utils.createToken({
                    type: TokenType.literal,
                    value: utils.flowString()
                });
                continue;
            }
            throw state.tracked(errors_1.ParseError, "Unexpected token: ".concat(char));
        }
        return tokens;
    };
    Parser.prototype.help = function () {
        var _this_1 = this;
        var poly = Object.entries(this.commandOptions.args).map(function (_a) {
            var _ = _a[0], arg = _a[1];
            var _if = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return args.filter(function (_a) {
                    var c = _a[0], _v = _a[1];
                    return c;
                }).map(function (_a) {
                    var _c = _a[0], v = _a[1];
                    return v;
                });
            };
            var _insert = function (s, a) { return a.join(s); };
            var _toPerfix = function (perfix) { return [perfix.map(function (v) { return v[0]; }).join(""), perfix.map(function (v) { return v[1]; }).join("")]; };
            console.log(_this_1.commandOptions);
            var args = arg.args.map(function (a) {
                var arg = _this_1._acronymsToArg(a);
                var content = "".concat(arg.name, ": ").concat(arg.type.construct().toString());
                var perfix = _if([arg.required, ["<", ">"]], [!arg.required, ["[", "]"]]);
                return _insert(content, _toPerfix(perfix));
            }).join(' ');
            return _insert("".concat(_this_1.commandOptions.head || "/").concat(_this_1.commandOptions.name, " ").concat(args), _toPerfix(_if([arg.catchAll && arg.allowExcess, ["", " ..."]])));
        });
        return poly.join("\n");
    };
    Parser.operators = ['(', ')', '[', ']', '{', '}', ':', ','];
    Parser.defaultConfig = {
        maxCycles: 10000,
        overwrites: {},
        strict: false,
        logErrors: false,
    };
    Parser.defaultArg = {
        name: 'arg',
        required: true
    };
    return Parser;
}());
exports.Parser = Parser;
// let p = new Parser({
//     head: "/",
//     name: "test",
//     description: "test",
//     args: {
//         "a": {
//             args: [{
//                 name: "name",
//                 required: true,
//                 type: Types.STRING,
//             }, {
//                 name: "name2",
//                 required: true,
//                 type: Types.INT,
//             }, {
//                 name: "enum",
//                 required: true,
//                 type: Types.ENUM({
//                     a: "A",
//                     b: "B"
//                 })
//             }, {
//                 name: "dict",
//                 required: true,
//                 type: Types.DICT(Types.STRING, Types.STRING)
//             }, {
//                 name: "array",
//                 required: false,
//                 type: Types.ARRAY(Types.NUMBER, Types.STRING, Types.BOOLEAN)
//             }],
//             catchAll: true,
//             allowExcess: true,
//         },
//         "b": {
//             args: [{
//                 name: "name",
//                 required: true,
//                 type: Types.STRING,
//             }, {
//                 name: "name2",
//                 required: true,
//                 type: Types.STRING,
//             }],
//             catchAll: false,
//             allowExcess: false,
//         }
//     },
// }, {
//     logErrors: true,
//     strict: false
// });
// let t = `/test nameeee 123.3 A {"qwq": 123} [1,2,"3"]`;
// let r = p._parseCommand(p._lexer(t));
// console.log(
//     p._lexer(t),
//     JSON.stringify(r, null, 4),
// );
// console.log(p.help())
