"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Providers = void 0;
var errors_1 = require("./errors");
var parser_1 = require("./parser");
var StringProvider = {
    name: 'StringProvider',
    condition: function (state, _utils) {
        return state.getCurrentToken() === "\"";
    },
    trigger: function (_state, utils) {
        utils.next();
        utils.createToken({
            type: parser_1.TokenType.string,
            value: utils.flowString("\"")
        });
        utils.next();
        return true;
    }
};
var NumberProvider = {
    name: 'NumberProvider',
    condition: function (state, _utils) {
        return state.validNumberOnly.test(state.getCurrentToken()) && state.isNumber();
    },
    trigger: function (state, utils) {
        var char = state.getCurrentToken(), value = [];
        var decimalFound = false;
        while (char && new RegExp(/\d/).test(char) || char === '.') {
            if (char === '.') {
                if (decimalFound) {
                    throw state.tracked(errors_1.ParseError, 'Mixed Content: Unexpected decimal point');
                }
                decimalFound = true;
            }
            value.push(char);
            utils.next();
            char = state.getCurrentToken();
        }
        utils.createToken({ type: parser_1.TokenType.number, value: parseFloat(value.join('')) });
        return true;
    }
};
var BooleanProvider = {
    name: 'BooleanProvider',
    condition: function (state, _utils) {
        var char = state.getCurrentToken();
        return char === 't' || char === 'f';
    },
    trigger: function (state, utils) {
        var nextOp = state.getNextNonContentChar();
        var distance = nextOp - state.getCurrent();
        var v = state.getNextTokens(state.getCurrent(), distance).join('');
        if (v !== 'true' && v !== 'false')
            return false;
        utils.createToken({ type: parser_1.TokenType.boolean, value: v === 'true' })
            .next(distance);
        return true;
    }
};
exports.Providers = [
    StringProvider,
    NumberProvider,
    BooleanProvider
];
