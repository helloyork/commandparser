"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
var constructors_1 = require("./constructors");
exports.Types = {
    STRING: {
        constructor: constructors_1.Constructors.STRING,
        construct: function () { return new constructors_1.Constructors.STRING(); }
    },
    NUMBER: {
        constructor: constructors_1.Constructors.NUMBER,
        construct: function () { return new constructors_1.Constructors.NUMBER(); }
    },
    FLOAT: {
        constructor: constructors_1.Constructors.FLOAT,
        construct: function () { return new constructors_1.Constructors.FLOAT(); }
    },
    INT: {
        constructor: constructors_1.Constructors.INT,
        construct: function () { return new constructors_1.Constructors.INT(); }
    },
    BOOLEAN: {
        constructor: constructors_1.Constructors.BOOLEAN,
        construct: function () { return new constructors_1.Constructors.BOOLEAN(); }
    },
    DICT: function (keyType, valueType) {
        return {
            constructor: constructors_1.Constructors.DICT,
            construct: function () { return new constructors_1.Constructors.DICT(keyType.construct(), valueType.construct()); }
        };
    },
    ARRAY: function () {
        var valueType = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            valueType[_i] = arguments[_i];
        }
        return {
            constructor: constructors_1.Constructors.ARRAY,
            construct: function () { return new constructors_1.Constructors.ARRAY(valueType.map(function (v) { return v.construct(); })); }
        };
    },
    ENUM: function (value) {
        return {
            constructor: constructors_1.Constructors.ENUM,
            construct: function () { return new constructors_1.Constructors.ENUM(value); }
        };
    }
};
