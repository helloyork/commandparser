
import { Arg } from "./command";
import { ParseArgTypeError, ParseRuntimeError, ParseSyntaxError } from "./parser/errors";
import { ParserConfig, Token, TokenType } from "./parser/parser";
import { CycleTracker } from "./utils";

type ParsingProviderUtils = {
    next(num?: number): ParsingProviderUtils;
}
type ParsingProviderState = {
    createCycleTracker(): CycleTracker,
    getCurrentToken(): Token<TokenType> | undefined,
    getToken(offset?: number): Token<TokenType> | undefined,
    is(token: { type: TokenType, value: string }): boolean,
    parseConfig: ParserConfig,
}
type ParsingProvider = (state: ParsingProviderState, utils: ParsingProviderUtils, required: boolean, type: TYPES | TYPES[]) => BaseArgType;

export declare class BaseArgType<T = any> {
    static TYPE: TYPES;
    name: TYPES;
    value: any;
    constructor();
    getName(): TYPES;
    toString(): string;
    parse: ParsingProvider;
    clone(): BaseArgType<T>;
    format(): BaseArgType<T>;
    public setValue(value: T): void;
    public getValue(): T;
    public validate(value: any, scrict?: boolean): boolean;
    public convert(value: Token<TokenType>, type: string): any;
}

declare class WithChildType<T extends BaseArgType> extends BaseArgType {
    childrenTypes: T[];
    constructor(childrenTypes: T[]);
    toString(): string;
}

declare class WithKeyValueType<K extends BaseArgType, V extends BaseArgType> extends BaseArgType {
    constructor(keyTypes: K, valueTypes: V);
}

type Enumable = string | number | boolean;
export type EnumArgTypeValues<T extends Enumable> = { [key: string]: T };
declare class EnumArgType<T extends Enumable> extends BaseArgType {
    enums: EnumArgTypeValues<T>;
    constructor(values: EnumArgTypeValues<T>);
}

export interface IBaseArgTypeConstructor {
    TYPE: TYPES;
    new(): BaseArgType;
}
export interface IWithChildTypeConstructor<T extends BaseArgType> {
    TYPE: TYPES;
    new(childrenTypes: T[]): WithChildType<T>;
}
export interface IWithKeyValueTypeConstructor<K extends BaseArgType, V extends BaseArgType> {
    TYPE: TYPES;
    new(keyTypes: K, valueTypes: V): WithKeyValueType<K, V>
}
export interface IEnumArgTypeConstructor<T extends string | number | boolean> {
    TYPE: TYPES;
    new(values: EnumArgTypeValues<T>): EnumArgType<T>;
}

export enum TYPES {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    FLOAT = 'FLOAT',
    INT = 'INT',
    BOOLEAN = 'BOOLEAN',

    DICT = 'DICT',

    ARRAY = 'ARRAY',
    SET = 'SET',

    ENUM = 'ENUM',

    _BASE = 'base',
    _WITH_KEY_VALUE = 'withKeyValueType',
    _WITH_CHILD_TYPE = 'withChildType',
}

/* Base Arg Type */
export class BaseArgTypeConstructor implements BaseArgType {
    static TYPE = TYPES._BASE;
    name: TYPES;
    value: any;
    constructor() {
        this.name = BaseArgTypeConstructor.TYPE;
    }
    getName() {
        return this.name;
    }
    parse(state: ParsingProviderState, utils: ParsingProviderUtils, required: boolean, type: TYPES | TYPES[]): BaseArgType {
        let token = state.getCurrentToken();
        if (!token && required) throw new ParseSyntaxError('Unexpected end of input');

        if (Array.isArray(type)) {
            for (let t of type) {
                try {
                    this.setValue(this.convert(token!, t));
                    return this;
                } catch (e) {
                    if (state.parseConfig.logErrors) console.error(e);
                    continue;
                }
            }
        } else this.setValue(this.convert(token!, type));
        utils.next();
        return this;
    }
    convert(value: Token<TokenType>, type: string): any {
        switch (type) {
            case TYPES.STRING:
                return String(value.value);
            case TYPES.NUMBER:
                return Number(value.value);
            case TYPES.FLOAT:
                return parseFloat(String(value.value));
            case TYPES.INT:
                return parseInt(String(value.value));
            case TYPES.BOOLEAN:
                return value.value === 'true';
            default:
                throw new ParseArgTypeError(`Invalid type: ${type}`);
        }
    }
    validate(value: any): boolean {
        return true;
    }
    setValue(value: any) {
        if (!this.validate(value)) throw new ParseArgTypeError(`Invalid value: ${value}, expected: ${this.name}`);
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    clone() {
        let clone = new (this.constructor as any)();
        clone.value = this.value;
        return clone;
    }
    format(): BaseArgType<any> {
        this.setValue(this.convert({ value: this.getValue(), type: TokenType.unknown }, this.name));
        return this;
    }
    toString(): string {
        return this.name;
    }
}

class StringArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.STRING;
    name: TYPES;
    constructor() {
        super();
        this.name = StringArgTypeConstructor.TYPE;
    }
    validate(value: any, strict?: boolean): boolean {
        return value === String(value);
    }
}

class NumberArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.NUMBER;
    name: TYPES;
    constructor() {
        super();
        this.name = NumberArgTypeConstructor.TYPE;
    }
    validate(value: any, strict?: boolean): boolean {
        return strict ? typeof value === "number" : !isNaN(value);
    }
    convert(value: Token<TokenType>, type: string) {
        switch (type) {
            case TYPES.NUMBER:
                if (!this.validate(value.value)) throw new ParseArgTypeError(
                    `Invalid value: ${value.value}`,
                    undefined,
                    undefined,
                    TYPES.NUMBER,
                );
                return Number(value.value);
            default:
                return super.convert(value, type);
        }
    }
}

class FloatArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.FLOAT;
    name: TYPES;
    constructor() {
        super();
        this.name = FloatArgTypeConstructor.TYPE;
    }
    validate(value: any, strict?: boolean): boolean {
        return strict ? typeof value === 'number' : !isNaN(value);
    }
}

class IntArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.INT;
    name: TYPES;
    constructor() {
        super();
        this.name = IntArgTypeConstructor.TYPE;
    }
    validate(value: any, strict?: boolean): boolean {
        return strict ? typeof value === 'number' && Number.isInteger(value) : !isNaN(value);
    }
    convert(value: Token<TokenType>, type: string) {
        switch (type) {
            case TYPES.INT:
                if (!this.validate(value.value)) throw new ParseArgTypeError(
                    `Invalid value: ${value.value}`,
                    undefined,
                    undefined,
                    TYPES.INT,
                );
                return parseInt(value.value.toString());
            default:
                return super.convert(value, type);
        }
    }
}

class BooleanArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.BOOLEAN;
    name: TYPES;
    constructor() {
        super();
        this.name = BooleanArgTypeConstructor.TYPE;
    }
    validate(value: any, strict?: boolean): boolean {
        return strict ? value === true || value === false : typeof value === 'boolean';
    }
    convert(value: Token<TokenType>, type: string) {
        return Boolean(value.value);
    }
}

/* k-v type */
class WithKeyValueTypeConstructor<K extends BaseArgType, V extends BaseArgType>
    extends BaseArgTypeConstructor
    implements WithKeyValueType<K, V> {
    static TYPE = TYPES._WITH_KEY_VALUE;
    name: TYPES;
    keyTypes: K;
    valueTypes: V;
    constructor(keyTypes: K, valueTypes: V) {
        super();
        this.keyTypes = keyTypes;
        this.valueTypes = valueTypes;
        this.name = WithKeyValueTypeConstructor.TYPE;
    }
    validate(value: any): boolean {
        return typeof value === 'object' && value !== null && Object.keys(value).every(k => (
            this.keyTypes.validate(k) && this.valueTypes.validate(value[k])
        ));
    }
    clone() {
        let clone = new (this.constructor as any)(this.keyTypes, this.valueTypes);
        clone.value = this.value;
        return clone;
    }
    toString(): string {
        return `${this.keyTypes.toString()} => ${this.valueTypes.toString()}`;
    }
}

class DictArgTypeConstructor<K extends BaseArgType<string> = BaseArgType<string>, V extends BaseArgType = BaseArgType> extends WithKeyValueTypeConstructor<K, V> {
    static TYPE = TYPES.DICT;
    name: TYPES;
    value: Map<K, V>;
    constructor(keyTypes: K, valueTypes: V) {
        super(keyTypes, valueTypes);
        this.value = new Map();
        this.name = DictArgTypeConstructor.TYPE;
    }
    parse(state: ParsingProviderState, utils: ParsingProviderUtils, required: boolean, type: TYPES | TYPES[]): BaseArgType {
        let token = state.getCurrentToken();
        if (!token || token.type !== TokenType.operator || token.value !== '{') throw new ParseSyntaxError('Expected {');

        let dict = new Map();
        let cycle = state.createCycleTracker();

        utils.next();
        while (!state.is({ type: TokenType.operator, value: '}' })) {
            cycle.next(() => { throw new ParseRuntimeError('Cycle limit exceeded'); });
            if (!state.getCurrentToken()) throw new ParseSyntaxError('Unexpected end of input');
            if (state.getCurrentToken()?.type === TokenType.operator) throw new ParseSyntaxError('Unexpected operator: ' + state.getCurrentToken()?.value);

            let key = this.keyTypes.clone().parse(state, utils, true, this.keyTypes.name).format();

            let token = state.getCurrentToken();
            if (!state.is({ type: TokenType.operator, value: ':' })) throw new ParseSyntaxError('Expected ":", but got: ' + (token || {}).value);
            utils.next();

            if (state.getCurrentToken()?.type === TokenType.operator) throw new ParseSyntaxError('Unexpected operator: ' + state.getCurrentToken()?.value);
            let value = this.valueTypes.clone().parse(state, utils, true, this.valueTypes.name).format();
            dict.set(key, value);

            if (state.is({ type: TokenType.operator, value: ',' })) {
                utils.next();
                continue;
            } else if (state.is({ type: TokenType.operator, value: '}' })) {
                break;
            } else {
                throw new ParseSyntaxError('Expected "," or "}", but got: ' + state.getCurrentToken()?.value);
            }
        }
        utils.next();

        this.setValue(dict);
        return this;
    }
    validate(value: any): boolean {
        return Object.getPrototypeOf.call(null, value) === Map.prototype;
    }
}

// @TODO
// MixedDictArgTypeConstructor

/* with child type */
class WithChildTypeConstructor<T extends BaseArgType>
    extends BaseArgTypeConstructor
    implements WithChildType<T> {
    static TYPE = TYPES._WITH_CHILD_TYPE;
    name: TYPES;
    childrenTypes: T[];
    constructor(childrenTypes: T[]) {
        super();
        this.childrenTypes = childrenTypes;
        this.name = WithChildTypeConstructor.TYPE;
    }
    clone() {
        let clone = new (this.constructor as any)(this.childrenTypes);
        clone.value = this.value;
        return clone;
    }
    toString(): string {
        return `${this.getName()}<${this.childrenTypes.toString()}>`;
    }
}

class ArrayArgTypeConstructor<T extends BaseArgType> extends WithChildTypeConstructor<T> {
    static TYPE = TYPES.ARRAY;
    name: TYPES;
    value: T[];
    constructor(childrenTypes: T[]) {
        super(childrenTypes);
        this.value = [];
        this.name = ArrayArgTypeConstructor.TYPE;
    }
    parse(state: ParsingProviderState, utils: ParsingProviderUtils, required: boolean, type: TYPES | TYPES[]): BaseArgType {
        if (!state.is({ type: TokenType.operator, value: '[' })) throw new Error('Expected "["');
        utils.next();

        let output: BaseArgType<any>[] = [];
        let cycle = state.createCycleTracker();

        if (state.is({ type: TokenType.operator, value: ']' })) {
            utils.next();
            this.setValue(output);
            return this;
        }

        while (!state.is({ type: TokenType.operator, value: ']' })) {
            cycle.next(() => { throw new ParseRuntimeError('Cycle limit exceeded'); });
            if (!state.getCurrentToken()) throw new ParseSyntaxError('Unexpected end of input');
            if (state.getCurrentToken()?.type === TokenType.operator) throw new ParseSyntaxError('Unexpected operator: ' + state.getCurrentToken()?.value);

            let vToken = state.getCurrentToken();
            if (!vToken) throw new ParseSyntaxError('Unexpected end of input');
            let value;
            if (state.parseConfig.strict) {
                for (let t of this.childrenTypes) {
                    if (t.validate(vToken.value, true)) {
                        try {
                            value = t.clone().parse(state, utils, true, t.name).format();
                            break;
                        } catch (e) {
                            if (state.parseConfig.logErrors) console.error(e);
                            continue;
                        }
                    }
                }
            }
            if (!value) {
                for (let t of this.childrenTypes) {
                    try {
                        value = t.clone().parse(state, utils, true, t.name).format();
                        break;
                    } catch (e) {
                        if (state.parseConfig.logErrors) console.error(e);
                        continue;
                    }
                }
            }
            if (!value) throw new ParseSyntaxError('Invalid value: ' + vToken.value);

            output.push(value);

            if (state.is({ type: TokenType.operator, value: ',' })) {
                utils.next();
                continue;
            } else if (state.is({ type: TokenType.operator, value: ']' })) {
                utils.next();
                break;
            } else {
                throw new ParseSyntaxError('Expected "," or "]", but got: ' + state.getCurrentToken()?.value);
            }
        }

        this.setValue(output);
        return this;
    }
    validate(value: any): boolean {
        return Array.isArray(value);
    }
    toString(): string {
        return `${this.name}<(${this.childrenTypes.join("|")})>[]`;
    }
}


/* Enum Type */
class EnumArgTypeConstructor<T extends Enumable>
    extends BaseArgTypeConstructor
    implements EnumArgType<T> {
    static TYPE = TYPES.ENUM;
    name: TYPES;
    enums: EnumArgTypeValues<T>;
    constructor(values: EnumArgTypeValues<T>) {
        super();
        this.enums = values;
        this.name = EnumArgTypeConstructor.TYPE;
    }
    validate(value: any): boolean {
        let [k, _] = (Object.entries(this.enums).filter(([_, v]) => v === value.value)[0] || [void 0, void 0]);
        return k !== void 0;
    }
    setValue(value: any): void {
        if (!this.validate({
            value
        })) throw new ParseSyntaxError(`Invalid value: ${value.value}`);
        this.value = value;
    }
    convert(value: Token<TokenType>, type: string): any {
        switch (type) {
            case TYPES.ENUM:
                if (!this.validate(value)) throw new ParseArgTypeError(`Invalid value: ${value.value}`);
                return value.value;
            default:
                return super.convert(value, type);
        }
    }
    toString(): string {
        return `Enum<${Object.values(this.enums).join("|")}>`;
    }
}

export type ArgType =
    IBaseArgTypeConstructor
    | IWithChildTypeConstructor<BaseArgType>
    | IWithKeyValueTypeConstructor<BaseArgType, BaseArgType>
    | IEnumArgTypeConstructor<Enumable>;
export type ArgTypeConstructor =
    typeof BaseArgTypeConstructor
    | typeof WithChildTypeConstructor
    | typeof ArrayArgTypeConstructor
    | typeof WithKeyValueTypeConstructor
    | typeof DictArgTypeConstructor
    | typeof EnumArgTypeConstructor;
export type ArgTypeConstructors =
    BaseArgTypeConstructor
    | WithChildTypeConstructor<BaseArgType>
    | WithKeyValueTypeConstructor<BaseArgType, BaseArgType>
    | EnumArgTypeConstructor<Enumable>;
export type ArgTypeConstructorMap = {
    STRING: typeof StringArgTypeConstructor;
    NUMBER: typeof NumberArgTypeConstructor;
    FLOAT: typeof FloatArgTypeConstructor;
    INT: typeof IntArgTypeConstructor;
    BOOLEAN: typeof BooleanArgTypeConstructor;

    DICT: typeof DictArgTypeConstructor;

    ARRAY: typeof ArrayArgTypeConstructor;

    ENUM: typeof EnumArgTypeConstructor;
}
export const Constructors: ArgTypeConstructorMap = {
    /* Base Arg Type */
    STRING: StringArgTypeConstructor,
    NUMBER: NumberArgTypeConstructor,
    FLOAT: FloatArgTypeConstructor,
    INT: IntArgTypeConstructor,
    BOOLEAN: BooleanArgTypeConstructor,

    /* With Key Value Type */
    DICT: DictArgTypeConstructor,

    /* With Child Type */
    ARRAY: ArrayArgTypeConstructor,

    /* Enum Type */
    ENUM: EnumArgTypeConstructor,
}

