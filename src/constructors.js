"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constructors = exports.BaseArgTypeConstructor = exports.TYPES = void 0;
var errors_1 = require("./parser/errors");
var parser_1 = require("./parser/parser");
var TYPES;
(function (TYPES) {
    TYPES["STRING"] = "STRING";
    TYPES["NUMBER"] = "NUMBER";
    TYPES["FLOAT"] = "FLOAT";
    TYPES["INT"] = "INT";
    TYPES["BOOLEAN"] = "BOOLEAN";
    TYPES["DICT"] = "DICT";
    TYPES["ARRAY"] = "ARRAY";
    TYPES["SET"] = "SET";
    TYPES["ENUM"] = "ENUM";
    TYPES["_BASE"] = "base";
    TYPES["_WITH_KEY_VALUE"] = "withKeyValueType";
    TYPES["_WITH_CHILD_TYPE"] = "withChildType";
})(TYPES || (exports.TYPES = TYPES = {}));
/* Base Arg Type */
var BaseArgTypeConstructor = /** @class */ (function () {
    function BaseArgTypeConstructor() {
        this.name = BaseArgTypeConstructor.TYPE;
    }
    BaseArgTypeConstructor.prototype.getName = function () {
        return this.name;
    };
    BaseArgTypeConstructor.prototype.parse = function (state, utils, required, type) {
        var token = state.getCurrentToken();
        if (!token && required)
            throw new errors_1.ParseSyntaxError('Unexpected end of input');
        if (Array.isArray(type)) {
            for (var _i = 0, type_1 = type; _i < type_1.length; _i++) {
                var t = type_1[_i];
                try {
                    this.setValue(this.convert(token, t));
                    return this;
                }
                catch (e) {
                    if (state.parseConfig.logErrors)
                        console.error(e);
                    continue;
                }
            }
        }
        else
            this.setValue(this.convert(token, type));
        utils.next();
        return this;
    };
    BaseArgTypeConstructor.prototype.convert = function (value, type) {
        switch (type) {
            case TYPES.STRING:
                return String(value.value);
            case TYPES.NUMBER:
                return Number(value.value);
            case TYPES.FLOAT:
                return parseFloat(String(value.value));
            case TYPES.INT:
                return parseInt(String(value.value));
            case TYPES.BOOLEAN:
                return value.value === 'true';
            default:
                throw new errors_1.ParseArgTypeError("Invalid type: ".concat(type));
        }
    };
    BaseArgTypeConstructor.prototype.validate = function (value) {
        return true;
    };
    BaseArgTypeConstructor.prototype.toData = function () {
        return this.convert({
            type: parser_1.TokenType.unknown,
            value: this.getValue()
        }, this.getName());
    };
    BaseArgTypeConstructor.prototype.setValue = function (value) {
        if (!this.validate(value))
            throw new errors_1.ParseArgTypeError("Invalid value: ".concat(value, ", expected: ").concat(this.name));
        this.value = value;
    };
    BaseArgTypeConstructor.prototype.getValue = function () {
        return this.value;
    };
    BaseArgTypeConstructor.prototype.clone = function () {
        var clone = new this.constructor();
        clone.value = this.value;
        return clone;
    };
    BaseArgTypeConstructor.prototype.format = function () {
        this.setValue(this.convert({ value: this.getValue(), type: parser_1.TokenType.unknown }, this.name));
        return this;
    };
    BaseArgTypeConstructor.prototype.toString = function () {
        return this.name;
    };
    BaseArgTypeConstructor.TYPE = TYPES._BASE;
    return BaseArgTypeConstructor;
}());
exports.BaseArgTypeConstructor = BaseArgTypeConstructor;
var StringArgTypeConstructor = /** @class */ (function (_super) {
    __extends(StringArgTypeConstructor, _super);
    function StringArgTypeConstructor() {
        var _this = _super.call(this) || this;
        _this.name = StringArgTypeConstructor.TYPE;
        return _this;
    }
    StringArgTypeConstructor.prototype.validate = function (value, strict) {
        return value === String(value);
    };
    StringArgTypeConstructor.TYPE = TYPES.STRING;
    return StringArgTypeConstructor;
}(BaseArgTypeConstructor));
var NumberArgTypeConstructor = /** @class */ (function (_super) {
    __extends(NumberArgTypeConstructor, _super);
    function NumberArgTypeConstructor() {
        var _this = _super.call(this) || this;
        _this.name = NumberArgTypeConstructor.TYPE;
        return _this;
    }
    NumberArgTypeConstructor.prototype.validate = function (value, strict) {
        return strict ? typeof value === "number" : !isNaN(value);
    };
    NumberArgTypeConstructor.prototype.convert = function (value, type) {
        switch (type) {
            case TYPES.NUMBER:
                if (!this.validate(value.value))
                    throw new errors_1.ParseArgTypeError("Invalid value: ".concat(value.value), undefined, undefined, TYPES.NUMBER);
                return Number(value.value);
            default:
                return _super.prototype.convert.call(this, value, type);
        }
    };
    NumberArgTypeConstructor.TYPE = TYPES.NUMBER;
    return NumberArgTypeConstructor;
}(BaseArgTypeConstructor));
var FloatArgTypeConstructor = /** @class */ (function (_super) {
    __extends(FloatArgTypeConstructor, _super);
    function FloatArgTypeConstructor() {
        var _this = _super.call(this) || this;
        _this.name = FloatArgTypeConstructor.TYPE;
        return _this;
    }
    FloatArgTypeConstructor.prototype.validate = function (value, strict) {
        return strict ? typeof value === 'number' : !isNaN(value);
    };
    FloatArgTypeConstructor.TYPE = TYPES.FLOAT;
    return FloatArgTypeConstructor;
}(BaseArgTypeConstructor));
var IntArgTypeConstructor = /** @class */ (function (_super) {
    __extends(IntArgTypeConstructor, _super);
    function IntArgTypeConstructor() {
        var _this = _super.call(this) || this;
        _this.name = IntArgTypeConstructor.TYPE;
        return _this;
    }
    IntArgTypeConstructor.prototype.validate = function (value, strict) {
        return strict ? typeof value === 'number' && Number.isInteger(value) : !isNaN(value);
    };
    IntArgTypeConstructor.prototype.convert = function (value, type) {
        switch (type) {
            case TYPES.INT:
                if (!this.validate(value.value))
                    throw new errors_1.ParseArgTypeError("Invalid value: ".concat(value.value), undefined, undefined, TYPES.INT);
                return parseInt(value.value.toString());
            default:
                return _super.prototype.convert.call(this, value, type);
        }
    };
    IntArgTypeConstructor.TYPE = TYPES.INT;
    return IntArgTypeConstructor;
}(BaseArgTypeConstructor));
var BooleanArgTypeConstructor = /** @class */ (function (_super) {
    __extends(BooleanArgTypeConstructor, _super);
    function BooleanArgTypeConstructor() {
        var _this = _super.call(this) || this;
        _this.name = BooleanArgTypeConstructor.TYPE;
        return _this;
    }
    BooleanArgTypeConstructor.prototype.validate = function (value, strict) {
        return strict ? value === true || value === false : typeof value === 'boolean';
    };
    BooleanArgTypeConstructor.prototype.convert = function (value, type) {
        return Boolean(value.value);
    };
    BooleanArgTypeConstructor.TYPE = TYPES.BOOLEAN;
    return BooleanArgTypeConstructor;
}(BaseArgTypeConstructor));
/* k-v type */
var WithKeyValueTypeConstructor = /** @class */ (function (_super) {
    __extends(WithKeyValueTypeConstructor, _super);
    function WithKeyValueTypeConstructor(keyTypes, valueTypes) {
        var _this = _super.call(this) || this;
        _this.keyTypes = keyTypes;
        _this.valueTypes = valueTypes;
        _this.name = WithKeyValueTypeConstructor.TYPE;
        return _this;
    }
    WithKeyValueTypeConstructor.prototype.validate = function (value) {
        var _this = this;
        return typeof value === 'object' && value !== null && Object.keys(value).every(function (k) { return (_this.keyTypes.validate(k) && _this.valueTypes.validate(value[k])); });
    };
    WithKeyValueTypeConstructor.prototype.clone = function () {
        var clone = new this.constructor(this.keyTypes, this.valueTypes);
        clone.value = this.value;
        return clone;
    };
    WithKeyValueTypeConstructor.prototype.toString = function () {
        return "".concat(this.keyTypes.toString(), " => ").concat(this.valueTypes.toString());
    };
    WithKeyValueTypeConstructor.TYPE = TYPES._WITH_KEY_VALUE;
    return WithKeyValueTypeConstructor;
}(BaseArgTypeConstructor));
var DictArgTypeConstructor = /** @class */ (function (_super) {
    __extends(DictArgTypeConstructor, _super);
    function DictArgTypeConstructor(keyTypes, valueTypes) {
        var _this = _super.call(this, keyTypes, valueTypes) || this;
        _this.value = new Map();
        _this.name = DictArgTypeConstructor.TYPE;
        return _this;
    }
    DictArgTypeConstructor.prototype.parse = function (state, utils, required, type) {
        var _a, _b, _c, _d, _e;
        var token = state.getCurrentToken();
        if (!token || token.type !== parser_1.TokenType.operator || token.value !== '{')
            throw new errors_1.ParseSyntaxError('Expected {');
        var dict = new Map();
        var cycle = state.createCycleTracker();
        utils.next();
        while (!state.is({ type: parser_1.TokenType.operator, value: '}' })) {
            cycle.next(function () { throw new errors_1.ParseRuntimeError('Cycle limit exceeded'); });
            if (!state.getCurrentToken())
                throw new errors_1.ParseSyntaxError('Unexpected end of input');
            if (((_a = state.getCurrentToken()) === null || _a === void 0 ? void 0 : _a.type) === parser_1.TokenType.operator)
                throw new errors_1.ParseSyntaxError('Unexpected operator: ' + ((_b = state.getCurrentToken()) === null || _b === void 0 ? void 0 : _b.value));
            var key = this.keyTypes.clone().parse(state, utils, true, this.keyTypes.name).format();
            var token_1 = state.getCurrentToken();
            if (!state.is({ type: parser_1.TokenType.operator, value: ':' }))
                throw new errors_1.ParseSyntaxError('Expected ":", but got: ' + (token_1 || {}).value);
            utils.next();
            if (((_c = state.getCurrentToken()) === null || _c === void 0 ? void 0 : _c.type) === parser_1.TokenType.operator)
                throw new errors_1.ParseSyntaxError('Unexpected operator: ' + ((_d = state.getCurrentToken()) === null || _d === void 0 ? void 0 : _d.value));
            var value = this.valueTypes.clone().parse(state, utils, true, this.valueTypes.name).format();
            dict.set(key, value);
            if (state.is({ type: parser_1.TokenType.operator, value: ',' })) {
                utils.next();
                continue;
            }
            else if (state.is({ type: parser_1.TokenType.operator, value: '}' })) {
                break;
            }
            else {
                throw new errors_1.ParseSyntaxError('Expected "," or "}", but got: ' + ((_e = state.getCurrentToken()) === null || _e === void 0 ? void 0 : _e.value));
            }
        }
        utils.next();
        this.setValue(dict);
        return this;
    };
    DictArgTypeConstructor.prototype.validate = function (value) {
        return Object.getPrototypeOf.call(null, value) === Map.prototype;
    };
    DictArgTypeConstructor.TYPE = TYPES.DICT;
    return DictArgTypeConstructor;
}(WithKeyValueTypeConstructor));
// @TODO
// MixedDictArgTypeConstructor
/* with child type */
var WithChildTypeConstructor = /** @class */ (function (_super) {
    __extends(WithChildTypeConstructor, _super);
    function WithChildTypeConstructor(childrenTypes) {
        var _this = _super.call(this) || this;
        _this.childrenTypes = childrenTypes;
        _this.name = WithChildTypeConstructor.TYPE;
        return _this;
    }
    WithChildTypeConstructor.prototype.clone = function () {
        var clone = new this.constructor(this.childrenTypes);
        clone.value = this.value;
        return clone;
    };
    WithChildTypeConstructor.prototype.toString = function () {
        return "".concat(this.getName(), "<").concat(this.childrenTypes.toString(), ">");
    };
    WithChildTypeConstructor.TYPE = TYPES._WITH_CHILD_TYPE;
    return WithChildTypeConstructor;
}(BaseArgTypeConstructor));
var ArrayArgTypeConstructor = /** @class */ (function (_super) {
    __extends(ArrayArgTypeConstructor, _super);
    function ArrayArgTypeConstructor(childrenTypes) {
        var _this = _super.call(this, childrenTypes) || this;
        _this.value = [];
        _this.name = ArrayArgTypeConstructor.TYPE;
        return _this;
    }
    ArrayArgTypeConstructor.prototype.parse = function (state, utils, required, type) {
        var _a, _b, _c;
        if (!state.is({ type: parser_1.TokenType.operator, value: '[' }))
            throw new Error('Expected "["');
        utils.next();
        var output = [];
        var cycle = state.createCycleTracker();
        if (state.is({ type: parser_1.TokenType.operator, value: ']' })) {
            utils.next();
            this.setValue(output);
            return this;
        }
        while (!state.is({ type: parser_1.TokenType.operator, value: ']' })) {
            cycle.next(function () { throw new errors_1.ParseRuntimeError('Cycle limit exceeded'); });
            if (!state.getCurrentToken())
                throw new errors_1.ParseSyntaxError('Unexpected end of input');
            if (((_a = state.getCurrentToken()) === null || _a === void 0 ? void 0 : _a.type) === parser_1.TokenType.operator)
                throw new errors_1.ParseSyntaxError('Unexpected operator: ' + ((_b = state.getCurrentToken()) === null || _b === void 0 ? void 0 : _b.value));
            var vToken = state.getCurrentToken();
            if (!vToken)
                throw new errors_1.ParseSyntaxError('Unexpected end of input');
            var value = void 0;
            if (state.parseConfig.strict) {
                for (var _i = 0, _d = this.childrenTypes; _i < _d.length; _i++) {
                    var t = _d[_i];
                    if (t.validate(vToken.value, true)) {
                        try {
                            value = t.clone().parse(state, utils, true, t.name).format();
                            break;
                        }
                        catch (e) {
                            if (state.parseConfig.logErrors)
                                console.error(e);
                            continue;
                        }
                    }
                }
            }
            if (!value) {
                for (var _e = 0, _f = this.childrenTypes; _e < _f.length; _e++) {
                    var t = _f[_e];
                    try {
                        value = t.clone().parse(state, utils, true, t.name).format();
                        break;
                    }
                    catch (e) {
                        if (state.parseConfig.logErrors)
                            console.error(e);
                        continue;
                    }
                }
            }
            if (!value)
                throw new errors_1.ParseSyntaxError('Invalid value: ' + vToken.value);
            output.push(value);
            if (state.is({ type: parser_1.TokenType.operator, value: ',' })) {
                utils.next();
                continue;
            }
            else if (state.is({ type: parser_1.TokenType.operator, value: ']' })) {
                utils.next();
                break;
            }
            else {
                throw new errors_1.ParseSyntaxError('Expected "," or "]", but got: ' + ((_c = state.getCurrentToken()) === null || _c === void 0 ? void 0 : _c.value));
            }
        }
        this.setValue(output);
        return this;
    };
    ArrayArgTypeConstructor.prototype.validate = function (value) {
        return Array.isArray(value);
    };
    ArrayArgTypeConstructor.prototype.toString = function () {
        return "".concat(this.name, "<(").concat(this.childrenTypes.join("|"), ")>[]");
    };
    ArrayArgTypeConstructor.prototype.map = function (callbackfn) {
        return this.getValue().map(callbackfn);
    };
    ArrayArgTypeConstructor.TYPE = TYPES.ARRAY;
    return ArrayArgTypeConstructor;
}(WithChildTypeConstructor));
/* Enum Type */
var EnumArgTypeConstructor = /** @class */ (function (_super) {
    __extends(EnumArgTypeConstructor, _super);
    function EnumArgTypeConstructor(values) {
        var _this = _super.call(this) || this;
        _this.enums = values;
        _this.name = EnumArgTypeConstructor.TYPE;
        return _this;
    }
    EnumArgTypeConstructor.prototype.validate = function (value) {
        var _a = (Object.entries(this.enums).filter(function (_a) {
            var _ = _a[0], v = _a[1];
            return v === value.value;
        })[0] || [void 0, void 0]), k = _a[0], _ = _a[1];
        return k !== void 0;
    };
    EnumArgTypeConstructor.prototype.setValue = function (value) {
        if (!this.validate({
            value: value
        }))
            throw new errors_1.ParseSyntaxError("Invalid value: ".concat(value.value));
        this.value = value;
    };
    EnumArgTypeConstructor.prototype.convert = function (value, type) {
        switch (type) {
            case TYPES.ENUM:
                if (!this.validate(value))
                    throw new errors_1.ParseArgTypeError("Invalid value: ".concat(value.value));
                return value.value;
            default:
                return _super.prototype.convert.call(this, value, type);
        }
    };
    EnumArgTypeConstructor.prototype.toString = function () {
        return "Enum<".concat(Object.values(this.enums).join("|"), ">");
    };
    EnumArgTypeConstructor.TYPE = TYPES.ENUM;
    return EnumArgTypeConstructor;
}(BaseArgTypeConstructor));
exports.Constructors = {
    /* Base Arg Type */
    STRING: StringArgTypeConstructor,
    NUMBER: NumberArgTypeConstructor,
    FLOAT: FloatArgTypeConstructor,
    INT: IntArgTypeConstructor,
    BOOLEAN: BooleanArgTypeConstructor,
    /* With Key Value Type */
    DICT: DictArgTypeConstructor,
    /* With Child Type */
    ARRAY: ArrayArgTypeConstructor,
    /* Enum Type */
    ENUM: EnumArgTypeConstructor,
};
