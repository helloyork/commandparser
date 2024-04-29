"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
var zod_1 = require("zod");
var Types_1 = require("./Types");
var parser_1 = require("./parser/parser");
var ArgTypeSchema = zod_1.z.object({
    construct: zod_1.z.function(),
    constructor: zod_1.z.function(),
});
var ArgSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    required: zod_1.z.boolean().optional(),
    type: ArgTypeSchema,
    onRequestCompletion: zod_1.z.function().optional(),
});
var ArgOptionsSchema = zod_1.z.object({
    args: zod_1.z.array(ArgSchema).or(zod_1.z.array(ArgTypeSchema)),
    catchAll: zod_1.z.boolean().optional(),
    allowExcess: zod_1.z.boolean().optional(),
});
var CommandOptionsSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    head: zod_1.z.string().optional(),
    args: zod_1.z.record(ArgOptionsSchema),
});
var Options = /** @class */ (function () {
    function Options(commands) {
        this.commands = commands;
        this.typeSchema = CommandOptionsSchema;
        this.validateConfig();
    }
    Options.prototype.validateConfig = function () {
        var _this = this;
        Object.keys(this.commands).forEach(function (key) {
            _this.typeSchema.parse(_this.commands[key]);
        });
        return this;
    };
    Options.Types = Types_1.Types;
    return Options;
}());
exports.Options = Options;
var CommandParser = /** @class */ (function () {
    function CommandParser(_a) {
        var commands = _a.commands, parserConfig = _a.parserConfig;
        this.parsers = {};
        if (commands instanceof Options) {
            this.options = commands;
        }
        else {
            this.options = new Options(commands);
        }
        this.parserConfig = parserConfig || {};
        this._configParser();
    }
    CommandParser.prototype._configParser = function () {
        var _this = this;
        Object.keys(this.options.commands).forEach(function (key) {
            _this.parsers[key] = new parser_1.Parser(_this.options.commands[key], _this.parserConfig);
        });
        return this;
    };
    CommandParser.prototype.parse = function (input) {
        var _a = Object.entries(this.parsers).find(function (_a) {
            var key = _a[0], parser = _a[1];
            return parser._getName(parser._lexer(input)[0]) === key;
        }) || [], name = _a[0], parser = _a[1];
        return {
            name: name,
            result: parser ? parser.fullParse(input) : undefined,
        };
    };
    CommandParser.__lib = { z: zod_1.z, ArgTypeSchema: ArgTypeSchema, ArgSchema: ArgSchema, ArgOptionsSchema: ArgOptionsSchema, CommandOptionsSchema: CommandOptionsSchema };
    return CommandParser;
}());
exports.default = CommandParser;
