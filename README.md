
# CommandParser

## Install

### using npm

> `npm install @helloyork/commandparser`

## How to use

import package

```javascript
const { Options, Types, default: CommandParser } = require("@helloyork/commandparser");
```

create a command parser

```javascript
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
    "test2": {
        // ... another command
    }
});

const parser = new CommandParser({
    commands: options,
    parserConfig: {
        strict: false // default false, if set to true, then failed parse when getting an invalid data type
    }
});
```

after that, use .parse(YOUR_TEXT) to start

```javascript
let result = parser.parse("/add [1, 3]");
// {
//     "name": "add",
//     "result": {
//         "usingArray": {
//             "name": "usingArray",
//             "accepted": true,
//             "result": {
//                 "argOptions": ...,
//                 "parsed": {
//                     "commandName": "add",
//                     "commandArgs": [
//                         {
//                             "name": "ARRAY",
//                             "childrenTypes": [
//                                 NumberArgType
//                             ],
//                             "value": [
//                                 NumberArgType,
//                                 NumberArgType
//                             ]
//                         }
//                     ]
//                 }
//             }
//         },
//         "usingNumbers": ...
//     }
// }
console.log("command name: " + result.name);
console.log("usingArray accepted: " + result.result?.["usingArray"]?.accepted);
console.log("added result: " + result.result?.["usingArray"]?.result?.parsed?.commandArgs[0]
    .getValue() // you need to get value from ArrayArgType, is returns ArgType[]
    .reduce((a, b) => a + b.getValue(), 0)) // get values from each arg

// command name: add
// usingArray accepted: true
// added result: 4




let result2 = parser.parse("/add 1 3");
// {
//     "name": "add",
//     "result": {
//         "usingArray": ...,
//         "usingNumbers": {
//             "name": "usingNumbers",
//             "accepted": true,
//             "result": {
//                 "argOptions": ...,
//                 "parsed": {
//                     "commandName": "add",
//                     "commandArgs": [
//                         {
//                             "name": "NUMBER",
//                             "value": 1
//                         },
//                         {
//                             "name": "NUMBER",
//                             "value": 3
//                         }
//                     ]
//                 }
//             }
//         }
//     }
// }
console.log(JSON.stringify(result2, null, 4));
console.log("command name: " + result2.name);
console.log("usingNumbers accepted: " + result2.result?.["usingNumbers"]?.accepted);
console.log("added result: " + result2.result?.["usingNumbers"]?.result?.parsed?.commandArgs
    .map((a) => a.getValue()) // get values from each arg
    .reduce((a, b) => a + b, 0) // add them together
);

// command name: add
// usingNumbers accepted: true
// added result: 4


```

or you can parse command for your bot project

```javascript

const { Options, Types, default: CommandParser } = require("commandparser");

let options = new Options({
    "add": {
        name: "add",
        description: "add numbers together",
        head: "/",
        args: {
            "usingArray": {
                args: [Types.ARRAY(Types.NUMBER)],
                catchAll: false,
                allowExcess: false
            },

            "usingNumbers": {
                args: [Types.NUMBER, Types.NUMBER],
                catchAll: true,
                allowExcess: true
            }
        },
    },
});

const parser = new CommandParser({
    commands: options,
});

const handlers = {
    "add": {
        "usingArray": (parsed) => {
            let sum = parsed.commandArgs[0]?.getValue().reduce((a, b) => a + b.getValue(), 0);
            return sum;
        },
        "usingNumbers": (parsed) => {
            let sum = parsed.commandArgs.reduce((a, b) => a + b.getValue(), 0);
            let catchedAllSum = parsed.catchedAll.reduce((a, b) => a + Number(b.value), 0);
            return sum + catchedAllSum;
        }
    }
};

function handle(input) {
    let result = parser.parse(input);
    let commandName = result.name;
    let firstAccepted = Object.keys(result.result).filter(k => result.result[k].accepted)[0];
    if (!firstAccepted) {
        console.log("No command found");
        return;
    }
    let commandHandler = handlers[commandName][firstAccepted];
    let commandArgs = result.result[firstAccepted].result.parsed;

    console.log(commandHandler(commandArgs));
}

handle("/add 1 3 5");
handle("/add [1, 3, 5]");
handle("/add 1 \"3\" 5");
handle("/add [1, \"3\", 5]");

```

