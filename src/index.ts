
/**
 * @todo add prediction  
 * @todo custom data types
 */

import { Types } from "./Types";
import CommandParser, { Options } from "./command";

let options = new Options({
    "test": {
        name: "test",
        description: "test command",
        head: "/",
        args: {
            "arg1": {
                args: [
                    {
                        name: "arg1",
                        description: "arg1",
                        required: true,
                        type: Types.STRING,
                    }
                ],
                catchAll: true,
                allowExcess: true
            },
            "arg2": {
                args: [
                    Types.NUMBER,
                    Types.STRING
                ],
                catchAll: true,
                allowExcess: true
            }
        },
    }
});

const p = new CommandParser({
    commands: options,
    parserConfig: {
        logErrors: true
    }
});

console.log(p.parse(
    "/test 2 1 2 3 4 5 6 7 8 9 10",
))
