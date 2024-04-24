
export declare class BaseArgType {
    static TYPE: string;
    name: string;
    constructor();
    getName(): string;
    toString(): string;
}

declare class WithChildType<T extends BaseArgType> extends BaseArgType {
    childrenTypes: T[];
    constructor(childrenTypes: T[]);
    toString(): string;
}

declare class WithKeyValueType<K extends BaseArgType, V extends BaseArgType> extends BaseArgType {
    constructor(keyTypes: K, valueTypes: V);
}

export interface IBaseArgTypeConstructor {
    TYPE: string;
    new(): BaseArgType;
}
export interface IWithChildTypeConstructor<T extends BaseArgType>{
    TYPE: string;
    new(childrenTypes: T[]): WithChildType<T>;
}
export interface IWithKeyValueTypeConstructor<K extends BaseArgType, V extends BaseArgType> {
    TYPE: string;
    new(keyTypes: K, valueTypes: V): WithKeyValueType<K, V>
}

const TYPES = {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    FLOAT: 'FLOAT',
    INT: 'INT',
    BOOLEAN: 'BOOLEAN',
    DICT: 'DICT',
    ARRAY: 'ARRAY',
    SET: 'SET',
}

/* Base Arg Type */
export class BaseArgTypeConstructor implements BaseArgType {
    static TYPE = 'base';
    name: string;
    constructor() {
        this.name = BaseArgTypeConstructor.TYPE;
    }
    getName() {
        return this.name;
    }
    toString() {
        return this.name;
    }
}

class StringArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.STRING;
    name: string;
    constructor() {
        super();
        this.name = StringArgTypeConstructor.TYPE;
    }
}

class NumberArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.NUMBER;
    name: string;
    constructor() {
        super();
        this.name = NumberArgTypeConstructor.TYPE;
    }
}

class FloatArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.FLOAT;
    name: string;
    constructor() {
        super();
        this.name = FloatArgTypeConstructor.TYPE;
    }
}

class IntArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.INT;
    name: string;
    constructor() {
        super();
        this.name = IntArgTypeConstructor.TYPE;
    }
}

class BooleanArgTypeConstructor extends BaseArgTypeConstructor {
    static TYPE = TYPES.BOOLEAN;
    name: string;
    constructor() {
        super();
        this.name = BooleanArgTypeConstructor.TYPE;
    }
}

/* k-v type */
class WithKeyValueTypeConstructor<K extends BaseArgType, V extends BaseArgType>
    extends BaseArgTypeConstructor
    implements WithKeyValueType<K, V> {
    static TYPE = 'withKeyValueType';
    name: string;
    keyTypes: K;
    valueTypes: V;
    constructor(keyTypes: K, valueTypes: V) {
        super();
        this.keyTypes = keyTypes;
        this.valueTypes = valueTypes;
        this.name = WithKeyValueTypeConstructor.TYPE;
    }
}

class DictArgTypeConstructor extends WithKeyValueTypeConstructor<BaseArgType, BaseArgType> {
    static TYPE = TYPES.DICT;
    name: string;
    constructor(keyTypes: BaseArgType, valueTypes: BaseArgType) {
        super(keyTypes, valueTypes);
        this.name = DictArgTypeConstructor.TYPE;
    }
}

/* with child type */
class WithChildTypeConstructor<T extends BaseArgType>
    extends BaseArgTypeConstructor
    implements WithChildType<T> {
    static TYPE = 'withChildType';
    name: string;
    childrenTypes: T[];
    constructor(childrenTypes: T[]) {
        super();
        this.childrenTypes = childrenTypes;
        this.name = WithChildTypeConstructor.TYPE;
    }
    toString() {
        return `${this.name}<${this.childrenTypes.toString()}>`;
    }
}

class ArrayArgTypeConstructor extends WithChildTypeConstructor<BaseArgType> {
    static TYPE = TYPES.ARRAY;
    name: string;
    constructor(childrenTypes: BaseArgType[]) {
        super(childrenTypes);
        this.name = ArrayArgTypeConstructor.TYPE;
    }
    toString() {
        return `${this.name}<${this.childrenTypes.toString()}>[]`;
    }
}

class SetArgTypeConstructor extends WithChildTypeConstructor<BaseArgType> {
    static TYPE = TYPES.SET;
    name: string;
    constructor(childrenTypes: BaseArgType[]) {
        super(childrenTypes);
        this.name = SetArgTypeConstructor.TYPE;
    }
}

export type ArgType = IBaseArgTypeConstructor | IWithChildTypeConstructor<BaseArgType> | IWithKeyValueTypeConstructor<BaseArgType, BaseArgType>;
export type ArgTypeConstructor  = typeof BaseArgTypeConstructor | typeof WithChildTypeConstructor | typeof WithKeyValueTypeConstructor;
export type ArgTypeConstructorMap = {
    STRING: typeof StringArgTypeConstructor;
    NUMBER: typeof NumberArgTypeConstructor;
    FLOAT: typeof FloatArgTypeConstructor;
    INT: typeof IntArgTypeConstructor;
    BOOLEAN: typeof BooleanArgTypeConstructor;

    DICT: typeof DictArgTypeConstructor;

    ARRAY: typeof ArrayArgTypeConstructor;
    SET: typeof SetArgTypeConstructor;
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
    SET: SetArgTypeConstructor,
}

