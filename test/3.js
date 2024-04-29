
const { Options, Types, default: CommandParser } = require("../src/index");

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

