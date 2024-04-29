// import { Types } from "../src/Types";
// import CommandParser, { Options } from "../src/command";

import { BaseArgType } from "../src/constructors";
import CommandParser, {Options, Types} from "../src/index";

let options = new Options({
    "add": {
        name: "add", // Human-readable names
        description: "add numbers together",
        head: "/",
        args: {
            "usingArray": { // arg type 1
            // only command that is type-matched will be used
                args: [
                    {
                        name: "arg1",
                        description: "arg1",
                        required: true,
                        type: Types.ARRAY(Types.NUMBER), // number[]
                    },
                ],
                catchAll: true, // if catchAll is enabled, the matched result will contain an array of additional args
                allowExcess: true // match failed is there are some additional args
            },
            // this command will be matched if "/test [1,2,3]"

            "usingNumbers": {
                args: [
                    Types.NUMBER, // equivalent to {type: Types.NUMBER}
                    Types.NUMBER,
                ],
                catchAll: true,
                allowExcess: true
            }
        },
    },
});

const parser = new CommandParser({
    commands: options,
    parserConfig: {
        strict: false
    }
});

let result = parser.parse("/add 1 3 5 7 9");
console.log(JSON.stringify(result, null, 4));
console.log("command name: " + result.name);
console.log("usingNumbers accepted: " + result.result?.["usingNumbers"]?.accepted);
console.log("added result: " + result.result?.["usingNumbers"]?.result?.parsed?.commandArgs
    .map((a: BaseArgType) => a.getValue())
    .reduce((a: number, b: number) => a + b, 0)
)

