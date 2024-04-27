import { CycleTracker } from "../utils";
import { ParseError } from "./errors";
import { Token, TokenType } from "./parser"

type LexerProviderUtils = {
    next(num?: number): LexerProviderUtils;
    createToken<T extends TokenType>({ type, value }: Token<T>, skip?: boolean): LexerProviderUtils;
    flowString(endString?: string | undefined, maxLength?: number): string;
}

type LexerProviderState = {
    validSpace: RegExp;
    validChar: RegExp;
    validIntegerOnly: RegExp;
    validNumberOnly: RegExp;
    validLetterOnly: RegExp;
    getCurrent(): number;
    getCurrentToken(): string;
    getNextTokens(start?: number, num?: number): string[];
    tracked(type: typeof Error | typeof ParseError, mes: string, i?: number): Error;
    isNumber(start?: number): boolean;
    getNextNonContentChar(start?: number): number;
    createCycleTracker(): CycleTracker;
}

export type LexerProvider = {
    name: string;
    condition: (state: LexerProviderState, utils: LexerProviderUtils) => boolean;
    trigger: (state: LexerProviderState, utils: LexerProviderUtils) => boolean;
}

const StringProvider: LexerProvider = {
    name: 'StringProvider',
    condition(state, _utils) {
        return state.getCurrentToken() === "\"";
    },
    trigger(_state, utils) {
        utils.next();
        utils.createToken<TokenType.string>({
            type: TokenType.string,
            value: utils.flowString("\"")
        });
        utils.next();
        return true;
    }
}

const NumberProvider: LexerProvider = {
    name: 'NumberProvider',
    condition(state, _utils) {
        return state.validNumberOnly.test(state.getCurrentToken()) && state.isNumber();
    },
    trigger(state, utils) {
        let char = state.getCurrentToken(), value: string[] = [];
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
        return true;
    }
}

const BooleanProvider: LexerProvider = {
    name: 'BooleanProvider',
    condition(state, _utils) {
        let char = state.getCurrentToken();
        return char === 't' || char === 'f';
    },
    trigger(state, utils) {
        let nextOp = state.getNextNonContentChar();
        let distance = nextOp - state.getCurrent();
        let v = state.getNextTokens(state.getCurrent(), distance).join('');
        if (v !== 'true' && v !== 'false') return false;
        utils.createToken<TokenType.boolean>({ type: TokenType.boolean, value: v === 'true' })
            .next(distance);
        return true;
    }
}

export const Providers = [
    StringProvider,
    NumberProvider,
    BooleanProvider
];



