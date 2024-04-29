
import { z } from "zod";

import { ArgTypeConstructor, BaseArgType, BaseArgTypeConstructor, TYPES, ArgType as IArgType, ArgTypeConstructors } from "./constructors";
import { Types } from "./Types";
import { CommandParsedResult, Parser, ParserConfig } from "./parser/parser";

export type ArgType = {
    construct: () => ArgTypeConstructors,
    constructor: ArgTypeConstructor,
};
export interface Arg {
    name: string;
    description?: string;
    required?: boolean;
    type: ArgType;
    onRequestCompletion?: (value: any) => any;
}

export interface ArgOptions {
    args: (Arg | ArgType)[];
    catchAll?: boolean;
    allowExcess?: boolean;
}
export interface CommandOptions {
    name: string;
    description: string;
    head?: string;
    args: {
        [key: string]: ArgOptions;
    };
}

export interface CommandResult {
    name: string | undefined;
    result: { [key: string]: CommandParsedResult } | undefined;
}

const ArgTypeSchema = z.object({
    construct: z.function(),
    constructor: z.function(),
});

const ArgSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    type: ArgTypeSchema,
    onRequestCompletion: z.function().optional(),
});

const ArgOptionsSchema = z.object({
    args: z.array(ArgSchema).or(z.array(ArgTypeSchema)),
    catchAll: z.boolean().optional(),
    allowExcess: z.boolean().optional(),
});

const CommandOptionsSchema = z.object({
    name: z.string(),
    description: z.string(),
    head: z.string().optional(),
    args: z.record(ArgOptionsSchema),
});

type CommandOptionConfig = { [key: string]: CommandOptions };

export class Options {
    static Types = Types;
    commands: CommandOptionConfig;
    typeSchema: z.ZodSchema;
    constructor(commands: CommandOptionConfig) {
        this.commands = commands;
        this.typeSchema = CommandOptionsSchema;
        this.validateConfig();
    }
    validateConfig() {
        Object.keys(this.commands).forEach((key) => {
            this.typeSchema.parse(this.commands[key]);
        });
        return this;
    }
}

export default class CommandParser {
    static __lib = { z, ArgTypeSchema, ArgSchema, ArgOptionsSchema, CommandOptionsSchema };
    options: Options;
    parsers: { [key: string]: Parser } = {};
    parserConfig: ParserConfig;
    constructor({
        commands,
        parserConfig
    }: {
        commands: CommandOptionConfig | Options,
        parserConfig?: ParserConfig
    }) {
        if (commands instanceof Options) {
            this.options = commands;
        } else {
            this.options = new Options(commands);
        }
        this.parserConfig = parserConfig || {};
        this._configParser();
    }
    private _configParser() {
        Object.keys(this.options.commands).forEach((key) => {
            this.parsers[key] = new Parser(this.options.commands[key], this.parserConfig);
        });
        return this;
    }
    parse(input: string): CommandResult {
        let [name, parser] = Object.entries(this.parsers).find(([key, parser]) => {
            return parser._getName(parser._lexer(input)[0]) === key
        }) || [];
        return {
            name,
            result: parser ? parser.fullParse(input) : undefined,
        }
    }
}

