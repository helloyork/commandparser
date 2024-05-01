import { Types } from "../Types";
import { Arg, ArgOptions, ArgType, CommandOptions } from "../command";
import { ArgTypeConstructorMap, BaseArgType, BaseArgTypeConstructor, Constructors, TYPES } from "../constructors";
import { CycleTracker } from "../utils";

import { ParseError, ParseArgTypeError, ParseRuntimeError, ParseSyntaxError } from "./errors";
import { LexerProvider, Providers } from "./lexer";

export enum TokenType {
    space = 'space',
    operator = 'operator',
    string = 'string',
    number = 'number',
    boolean = 'boolean',
    literal = 'literal',
    unknown = 'unknown',
}
export type TokenValue = {
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

export interface ParserConfig {
    maxCycles?: number;
    overwrites?: {
        [key: string]: string;
    },
    strict?: boolean;
    logErrors?: boolean;
}

export interface ParsedResult {
    error?: Error;
    argOptions: ArgOptions;
    parsed?: {
        commandName: string;
        commandArgs: BaseArgType[];
        catchedAll: Token<TokenType>[];
    }
}

export interface CommandParsedResult {
    name: string;
    accepted: boolean;
    result: ParsedResult;
}


export class Parser {
    static operators = ['(', ')', '[', ']', '{', '}', ':', ','];
    static defaultConfig: ParserConfig = {
        maxCycles: 10000,
        overwrites: {},
        strict: false,
        logErrors: false,
    }
    static defaultArg: Omit<Arg, "type"> = {
        name: 'arg',
        required: true
    }
    commandOptions: CommandOptions;
    argOptions: { [key: string]: ArgOptions } = {};
    constructors: {[key: string]: typeof BaseArgType} = {};
    lexers: LexerProvider[] = [];
    config: ParserConfig;
    constructor(commandOption: CommandOptions, config: Partial<ParserConfig> = Parser.defaultConfig) {
        this.registerConstructorMap(Constructors);
        this.registerLexers(Providers);
        this.commandOptions = commandOption;
        this.argOptions = commandOption.args;
        this.config = { ...Parser.defaultConfig, ...config };
    }
    registerConstructorMap(constructos: ArgTypeConstructorMap) {
        Object.assign(this.constructors, constructos);
        return this;
    }
    registerConstructor(name: string, constructor: typeof BaseArgType) {
        this.constructors[name] = constructor;
    }
    registerLexer(lexer: LexerProvider) {
        this.lexers.push(lexer);
        return this;
    }
    registerLexers(lexers: LexerProvider[]) {
        this.lexers.push(...lexers);
        return this;
    }
    fullParse(input: string) {
        return this._parseCommand(this._lexer(input));
    }
    _getName(token: Token<TokenType>): string {
        let name = (new Constructors.STRING()).convert(token, TYPES.STRING);
        return String(name);
    }
    _acronymsToArg (input: Arg | ArgType): Arg {
        return {
            ...(("name" in input) ? input : Parser.defaultArg),
            type: ("name" in input) ? input.type : input
        }
    }
    _parseArg(tokens: Token<TokenType>[], expected: ArgOptions): ParsedResult {
        let _name = tokens.shift(), _this = this;
        if (!_name) {
            throw new Error('No tokens provided');
        }
        let name = this._getName(_name);

        let current = 0, expectedArgs = expected.args, output: BaseArgType[] = [], catchedAll: Token<TokenType>[] = [];
        const state = {
            createCycleTracker(): CycleTracker {
                return new CycleTracker(_this.config.maxCycles!);
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
            parseConfig: _this.config,
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

            let _arg = expectedArgs.shift()!;
            let arg: Arg = this._acronymsToArg(_arg);
            let constructor = arg.type;
            if (!state.getCurrentToken()) {
                if (arg.required) throw new ParseArgTypeError('Missing required argument', current, arg.name, arg.type.constructor.TYPE, 'undefined');
                break;
            }

            let type = constructor.construct().parse(state, utils, !!arg.required, arg.type.constructor.TYPE);
            output.push(type);
        }
        if (!expected.allowExcess && state.getCurrentToken()) {
            throw new ParseSyntaxError('Excess tokens');
        }
        if (expected.catchAll) {
            while (state.getCurrentToken()) {
                catchedAll.push(state.getCurrentToken()!);
                utils.next();
            }
        }

        return {
            argOptions: expected,
            parsed: {
                commandName: name,
                commandArgs: output,
                catchedAll
            }
        }
    }
    _parseCommand(tokens: Token<TokenType>[]): { [key: string]: CommandParsedResult } {
        let res: { [key: string]: CommandParsedResult } = {};
        for (let [name, arg] of Object.entries(this.argOptions)) {
            try {
                res[name] = {
                    name,
                    accepted: true,
                    result: this._parseArg([...tokens], {
                        ...arg,
                        args: [...arg.args.map((a) => ({ ...this._acronymsToArg(a) }))],
                    })
                };
            } catch (e) {
                if (this.config.logErrors) console.error(e);
                res[name] = {
                    name,
                    accepted: false,
                    result: {
                        error: e instanceof Error ? e : new ParseRuntimeError(String(e)),
                        argOptions: arg,
                    }
                };
                continue;
            }
        }
        return res;
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
            getCurrent(): number {
                return current;
            },
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
                let message = `${mes}\nat index ${i}:\n${input.slice(i - 10, i + 10)}\n${i >= 10 ? ' '.repeat(10) : ' '.repeat(i)}^`;
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
                return new CycleTracker(_this.config.maxCycles!);
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
            flowString(endString?: string | undefined, maxLength = Infinity): string {
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
        _: while (current < input.length) {
            _cycleTracker.next(() => console.log(`Cycle limit exceeded: ${input.slice(current - 10, current + 10)}\n current index: ${current}`));

            let char: string = state.getCurrentToken();
            if (state.validSpace.test(char)) {
                utils.next();
                continue;
            }
            if (Parser.operators.includes(char)) {
                utils.createToken<TokenType.operator>({ type: TokenType.operator, value: char })
                    .next();
                continue;
            }
            for (let provider of this.lexers) {
                if (provider.condition(state, utils) && provider.trigger(state, utils)) {
                    continue _;
                }
            }
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
    help() {
        let poly = Object.entries(this.commandOptions.args).map(([_, arg]) => {
            let _if = <T>(...args: [c: any, v: T][]): T[] => args.filter(([c, _v]) => c).map(([_c, v]) => v);
            let _insert = (s: string, a: string[]) => a.join(s);
            let _toPerfix = (perfix: string[][]) => [perfix.map(v => v[0]).join(""), perfix.map(v => v[1]).join("")];
            console.log(this.commandOptions)
            let args = arg.args.map((a) => {
                let arg = this._acronymsToArg(a);
                let content = `${arg.name}: ${arg.type.construct().toString()}`;
                let perfix = _if<string[]>(
                    [arg.required, ["<", ">"]],
                    [!arg.required, ["[", "]"]],
                );
                return _insert(
                    content,
                    _toPerfix(perfix)
                );
            }).join(' ');
            return _insert(
                `${this.commandOptions.head || "/"}${this.commandOptions.name} ${args}`,
                _toPerfix(_if<string[]>(
                    [arg.catchAll && arg.allowExcess, ["", " ..."]]
                ))
            );
        });
        return poly.join("\n");
    }
}

// let p = new Parser({
//     head: "/",
//     name: "test",
//     description: "test",
//     args: {
//         "a": {
//             args: [{
//                 name: "name",
//                 required: true,
//                 type: Types.STRING,
//             }, {
//                 name: "name2",
//                 required: true,
//                 type: Types.INT,
//             }, {
//                 name: "enum",
//                 required: true,
//                 type: Types.ENUM({
//                     a: "A",
//                     b: "B"
//                 })
//             }, {
//                 name: "dict",
//                 required: true,
//                 type: Types.DICT(Types.STRING, Types.STRING)
//             }, {
//                 name: "array",
//                 required: false,
//                 type: Types.ARRAY(Types.NUMBER, Types.STRING, Types.BOOLEAN)
//             }],
//             catchAll: true,
//             allowExcess: true,
//         },
//         "b": {
//             args: [{
//                 name: "name",
//                 required: true,
//                 type: Types.STRING,
//             }, {
//                 name: "name2",
//                 required: true,
//                 type: Types.STRING,
//             }],
//             catchAll: false,
//             allowExcess: false,
//         }
//     },
// }, {
//     logErrors: true,
//     strict: false
// });

// let t = `/test nameeee 123.3 A {"qwq": 123} [1,2,"3"]`;
// let r = p._parseCommand(p._lexer(t));
// console.log(
//     p._lexer(t),
//     JSON.stringify(r, null, 4),
// );
// console.log(p.help())


