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
exports.ParseRuntimeError = exports.ParseArgTypeError = exports.ParseSyntaxError = exports.ParseError = void 0;
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ParseError';
        return _this;
    }
    return ParseError;
}(Error));
exports.ParseError = ParseError;
var ParseSyntaxError = /** @class */ (function (_super) {
    __extends(ParseSyntaxError, _super);
    function ParseSyntaxError(message, line, column) {
        var _this = this;
        var m = [];
        if (line !== undefined)
            m.push("at line ".concat(line));
        if (column !== undefined)
            m.push("column ".concat(column));
        _this = _super.call(this, "".concat(message, "\n    ") + m.join("\n    ") + '\n') || this;
        _this.line = line;
        _this.column = column;
        _this.name = 'ParseSyntaxError';
        _this.line = line;
        _this.column = column;
        return _this;
    }
    return ParseSyntaxError;
}(ParseError));
exports.ParseSyntaxError = ParseSyntaxError;
var ParseArgTypeError = /** @class */ (function (_super) {
    __extends(ParseArgTypeError, _super);
    function ParseArgTypeError(message, position, argName, expectedType, actualType) {
        var _this = this;
        var m = [];
        if (position !== undefined)
            m.push("at position ".concat(position));
        if (argName)
            m.push("for argument ".concat(argName));
        if (expectedType)
            m.push("expected ".concat(expectedType));
        if (actualType)
            m.push("got ".concat(actualType));
        _this = _super.call(this, "".concat(message, "\n    ") + m.join("\n    ") + '\n') || this;
        _this.position = position;
        _this.argName = argName;
        _this.expectedType = expectedType;
        _this.actualType = actualType;
        _this.name = 'ParseArgTypeError';
        _this.position = position;
        _this.argName = argName;
        _this.expectedType = expectedType;
        _this.actualType = actualType;
        return _this;
    }
    return ParseArgTypeError;
}(ParseError));
exports.ParseArgTypeError = ParseArgTypeError;
var ParseRuntimeError = /** @class */ (function (_super) {
    __extends(ParseRuntimeError, _super);
    function ParseRuntimeError(message, cause) {
        var _this = this;
        var m = [];
        if (cause)
            m.push("caused by ".concat(cause));
        _this = _super.call(this, "".concat(message, "\n    ") + m.join("\n    ") + '\n') || this;
        _this.cause = cause;
        _this.name = 'ParseRuntimeError';
        _this.cause = cause;
        return _this;
    }
    return ParseRuntimeError;
}(ParseError));
exports.ParseRuntimeError = ParseRuntimeError;
