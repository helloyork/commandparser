
import { z } from "zod";

import { ArgTypeConstructor, BaseArgType, BaseArgTypeConstructor, TYPES, ArgType as IArgType, ArgTypeConstructors } from "./constructors";
import { Types } from "./Types";

// =========================================================
// 
// 
// 
// =========================================================

export type ArgType = {
    construct: () => ArgTypeConstructors,
    constructor: ArgTypeConstructor,
};
export interface Arg {
    name: string;
    description?: string;
    required: boolean;
    type: ArgType;
    onRequestCompletion?: (value: any) => any;
}

export interface ArgOptions {
    args: Arg[];
    catchAll?: boolean;
    allowExcess?: boolean;
}
export interface CommandOptions {
    name: string;
    description: string;
    head?: string;
    args: ArgOptions[];
}

const ArgSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean(),
    type: z.instanceof(BaseArgType),
    onRequestCompletion: z.function().optional(),
});

const ArgOptionsSchema = z.object({
    args: z.array(ArgSchema),
    catchAll: z.boolean().optional(),
    allowExcess: z.boolean().optional(),
});

const CommandOptionsSchema = z.object({
    name: z.string(),
    description: z.string(),
    head: z.string().optional(),
    args: z.array(ArgOptionsSchema),
});

type CommandOptionConfig = { [key: string]: CommandOptions };

class Options {
    static Types = Types;
    commands: CommandOptionConfig;
    constructor(commands: CommandOptionConfig) {
        this.commands = commands;
        this.validateConfig();
    }
    validateConfig() {
        Object.keys(this.commands).forEach((key) => {
            CommandOptionsSchema.parse(this.commands[key]);
        });
        return this;
    }
}

class CommandParser {
    options: Options
    constructor(commands: CommandOptionConfig | Options) {
        if (commands instanceof Options) {
            this.options = commands;
        } else {
            this.options = new Options(commands);
        }
    }
}

