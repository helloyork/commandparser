import { Types } from "../Types";
import { ArgOptions, CommandOptions } from "../command";
import { ArgTypeConstructorMap, BaseArgType, Constructors, TYPES } from "../constructors";
import { CycleTracker } from "../utils";
import { ParseError } from "./errors";

export enum TokenType {
    space = 'space',
    operator = 'operator',
    string = 'string',
    number = 'number',
    boolean = 'boolean',
    literal = 'literal',
    unknown = 'unknown',
}
type TokenValue = {
    'space': string;
    'operator': string;
    'string': string;
    'number': number;
    'boolean': boolean;
    'literal': string;
    'unknown': string;
}
export type Token<T extends TokenType> = {
    type: T;
    value: TokenValue[T];
}

enum NodeType {
    root = 'root',
    command = 'command',
    arg = 'arg',
}

interface ParserConfig {
    maxCycles: number;
    overwrites: {
        [key: string]: string;
    }
}


class Parser {
    static operators = ['(', ')', '[', ']', '{', '}', ':', ','];
    static defaultConfig: ParserConfig = {
        maxCycles: 10000,
        overwrites: {}
    }
    commandOptions: CommandOptions;
    argOptions: ArgOptions[];
    constructors: Partial<ArgTypeConstructorMap> = {};
    config: ParserConfig;
    constructor(commandOption: CommandOptions, config: Partial<ParserConfig> = Parser.defaultConfig) {
        this.registerConstructors(Constructors);
        this.commandOptions = commandOption;
        this.argOptions = commandOption.args;
        this.config = { ...Parser.defaultConfig, ...config };
    }
    registerConstructors(constructos: ArgTypeConstructorMap) {
        Object.assign(this.constructors, constructos);
        return this;
    }
    fullParse() {
    }
    _parseArg(tokens: Token<TokenType>[], expected: ArgOptions) {
        let _name = tokens.shift(), _this = this;
        if (!_name) {
            throw new Error('No tokens provided');
        }
        let name = (new Constructors.STRING()).convert(_name, TYPES.STRING);

        let current = 0, expectedArgs = expected.args, output: BaseArgType[] = [], catchedAll: Token<TokenType>[] = [];
        const state = {
            createCycleTracker(): CycleTracker {
                return new CycleTracker(_this.config.maxCycles);
            },
            getCurrentToken(): Token<TokenType> | undefined {
                return tokens[current];
            },
            getToken(offset: number = 0): Token<TokenType> | undefined {
                return tokens[current + offset];
            },
            is(token: { type: TokenType, value: string }): boolean {
                let t = tokens[current];
                return t?.type === token.type && t?.value === token.value;
            },
            __tokens: tokens,
        }
        const utils = {
            next(num: number = 1) {
                current += num;
                return utils;
            }
        }

        let _cycleTracker = state.createCycleTracker();
        while (expectedArgs.length) {
            _cycleTracker.next(() => console.log(`Cycle limit exceeded: ${tokens.slice(current - 5, current + 5)}\n current index: ${current}`));

            let arg = expectedArgs.shift()!, constructor = arg?.type || Constructors.STRING;
            if (!state.getCurrentToken()) {
                if (arg.required) throw new Error('Unexpected end of input');
                break;
            }

            let type = constructor.construct().parse(state, utils, arg.required, arg.type.constructor.TYPE);
            output.push(type);
        }
        if (!expected.allowExcess && state.getCurrentToken()) {
            throw new Error('Excess tokens');
        }
        if (expected.catchAll) {
            while (state.getCurrentToken()) {
                catchedAll.push(state.getCurrentToken()!);
                utils.next();
            }
        }

        return {
            name,
            args: output,
            catchedAll
        }
    }
    _parseCommand(tokens: Token<TokenType>[]) {
        let res = [], options = [...this.argOptions];
        for (let arg of options) {
            try {
                res.push(this._parseArg([...tokens], arg));
            } catch (e) {
                continue;
            }
        }
        return res;
    }
    _parse(input: string) {
    }
    _lexer(input: string) {
        const _this = this;
        let tokens: Token<TokenType>[] = [], current = 0;

        const state = {
            validSpace: new RegExp(/\s/),
            validChar: new RegExp("[a-zA-Z0-9\u4e00-\u9fa5\u0100-\u017F_@]"),
            validIntegerOnly: new RegExp("[0-9]"),
            validNumberOnly: new RegExp("[0-9.]"),
            validLetterOnly: new RegExp("[a-zA-Z\u4e00-\u9fa5\u0100-\u017F_]"),
            getCurrentToken() {
                return input[current];
            },
            getNextTokens(start: number = current, num: number = 1) {
                let tokens: string[] = [];
                for (let i = 0; i < num; i++) {
                    if (input[start + i]) tokens.push(input[start + i]);
                }
                return tokens;
            },
            tracked(type: typeof Error | typeof ParseError, mes: string, i = current) {
                let message = `${mes}\nat index ${i}:\n${input.slice(i - 10, i + 10)}\n${i >= 10 ? ' '.repeat(10) : ' '.repeat(i)
                    }^`;
                return Reflect.construct(type, [message]);
            },
            isNumber(start: number = current) {
                let i = start, decimalFound = false;
                while (i < input.length) {
                    if (Parser.operators.includes(input[i]) || state.validSpace.test(input[i])) return true;
                    if (!this.validNumberOnly.test(input[i])) return false;
                    if (input[i] === '.') {
                        if (decimalFound) return false;
                        decimalFound = true;
                    }
                    i++;
                }
                return true;
            },
            getNextNonContentChar(start: number = current): number {
                let i = start;
                while (i < input.length) {
                    if (Parser.operators.includes(input[i]) || state.validSpace.test(input[i]) || input[i] === undefined) return i;
                    i++;
                }
                return i;
            },
            createCycleTracker(): CycleTracker {
                return new CycleTracker(_this.config.maxCycles);
            },
            ...(_this.config.overwrites || {})
        }
        const utils = {
            next(num: number = 1) {
                current += num;
                return utils
            },
            createToken<T extends TokenType>({ type, value }: Token<T>, skip: boolean = false) {
                if (!type) throw new Error('Invalid token');
                tokens.push({ type, value });
                if (skip) utils.next();
                return utils;
            },
            flowString(endString?: string | undefined, maxLength = Infinity) {
                let value: string[] = [];
                while (current < input.length && value.length < maxLength) {
                    let char = state.getCurrentToken();
                    if (endString ? char === endString : (
                        state.validSpace.test(char) || Parser.operators.includes(char)
                    )) {
                        return value.join("");
                    }
                    value.push(char);
                    utils.next();
                }
                if (endString) throw state.tracked(ParseError, 'Unexpected end of input');
                return value.join("");
            },
        }

        if (input.length && this.commandOptions.head) {
            let head = state.getNextTokens(0, this.commandOptions.head.length);
            if (head.join('') === this.commandOptions.head) {
                utils.next(this.commandOptions.head.length);
            }
        }

        let _cycleTracker = state.createCycleTracker();
        while (current < input.length) {
            _cycleTracker.next(() => console.log(`Cycle limit exceeded: ${input.slice(current - 10, current + 10)}\n current index: ${current}`));

            let char: string = state.getCurrentToken();
            if (state.validSpace.test(char)) {
                utils.next();
                continue;
            }

            // operator
            if (Parser.operators.includes(char)) {
                utils.createToken<TokenType.operator>({ type: TokenType.operator, value: char })
                    .next();
                continue;
            }

            // string
            if (char === "\"") {
                utils.next();
                utils.createToken<TokenType.string>({
                    type: TokenType.string,
                    value: utils.flowString("\"")
                });
                utils.next();
                continue;
            }

            // number
            if (state.validNumberOnly.test(char) && state.isNumber()) {
                let value: string[] = [];
                let decimalFound: boolean = false;
                while (char && new RegExp(/\d/).test(char) || char === '.') {
                    if (char === '.') {
                        if (decimalFound) {
                            throw state.tracked(ParseError, 'Mixed Content: Unexpected decimal point');
                        }
                        decimalFound = true;
                    }
                    value.push(char);
                    utils.next();
                    char = state.getCurrentToken();
                }
                utils.createToken<TokenType.number>({ type: TokenType.number, value: parseFloat(value.join('')) });
                continue;
            }

            // boolean
            if (char === 't' || char === 'f') {
                let nextOp = state.getNextNonContentChar();
                let distance = nextOp - current;
                let v = state.getNextTokens(current, distance).join('');
                if (v === 'true' || v === 'false') {
                    utils.createToken<TokenType.boolean>({ type: TokenType.boolean, value: v === 'true' })
                        .next(distance);
                    continue;
                }
            }

            // literal
            if (state.validChar.test(char)) {
                utils.createToken<TokenType.literal>({
                    type: TokenType.literal,
                    value: utils.flowString()
                });
                continue;
            }

            throw state.tracked(ParseError, `Unexpected token: ${char}`);
        }

        return tokens;
    }
}

let p = new Parser({
    head: "/",
    name: "test",
    description: "test",
    args: [{
        args: [{
            name: "name",
            required: true,
            type: Types.STRING,
        },{
            name: "name2",
            required: true,
            type: Types.NUMBER,
        }, {
            name: "enum",
            required: true,
            type: Types.ENUM({
                a: "A",
                b: "B"
            })
        }, {
            name: "array",
            required: true,
            type: Types.ARRAY(Types.STRING)
        }, {
            name: "dict",
            required: true,
            type: Types.DICT(Types.STRING, Types.STRING)
        }, {
            name: "array",
            required: true,
            type: Types.ARRAY(Types.NUMBER)
        }, {
            name: "array",
            required: true,
            type: Types.ARRAY(Types.NUMBER, Types.STRING, Types.BOOLEAN)
        }],
        catchAll: true,
        allowExcess: true,
    }],
});

let r = p._parseCommand(p._lexer(`/test nameeee "123" A [1,"2",3] {"qwq": 123} [1,"2", true] [1,"2", true]`));
console.log(
    p._lexer(`/test nameeee "123" A [1,"2",3] {"qwq": 123} [1,"2", true] [1,"2", false, true]`),
    JSON.stringify(r, null, 4),
    r[0]?.args?.[r[0].args.length - 1]?.value.entries()
)


