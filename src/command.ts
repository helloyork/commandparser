
import { z } from "zod";

import { BaseArgType } from "./constructors";



interface Arg {
    name: string;
    description?: string;
    required: boolean;
    type: BaseArgType;
    onRequestCompletion?: (value: any) => any;
}

export interface ArgOptions {
    args: Arg[];
    catchAll?: boolean;
    allowExcess?: boolean;
}
interface CommandOptions {
    name: string;
    description: string;
    args: ArgOptions;
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
    args: ArgOptionsSchema,
});


class CommandParser {
    config: CommandOptions[] = [];
    constructor(commands: CommandOptions[]) {
        commands.forEach(this.validateConfig);
        this.config = commands;
    }
    validateConfig(c: CommandOptions) {
        CommandOptionsSchema.parse(c);
    }
}

