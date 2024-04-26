import { ArgType } from "./command";
import { BaseArgType, Constructors, EnumArgTypeValues, TYPES } from "./constructors";

type ArgTypeConstructor = (...arg: any[]) => ArgType;
export const Types = {
    STRING: {
        constructor: Constructors.STRING,
        construct: () => new Constructors.STRING()
    },
    NUMBER: {
        constructor: Constructors.NUMBER,
        construct: () => new Constructors.NUMBER()
    },
    FLOAT: {
        constructor: Constructors.FLOAT,
        construct: () => new Constructors.FLOAT()
    },
    INT: {
        constructor: Constructors.INT,
        construct: () => new Constructors.INT()
    },
    BOOLEAN: {
        constructor: Constructors.BOOLEAN,
        construct: () => new Constructors.BOOLEAN()
    },

    DICT: function (keyType: ArgType, valueType: ArgType) {
        return {
            constructor: Constructors.DICT,
            construct: () => new Constructors.DICT(keyType.construct(), valueType.construct())
        }
    },

    ARRAY: function (...valueType: ArgType[]) {
        return {
            constructor: Constructors.ARRAY,
            construct: () => new Constructors.ARRAY(valueType.map(v => v.construct()))
        }
    },

    ENUM: function (value: EnumArgTypeValues<any>) {
        return {
            constructor: Constructors.ENUM,
            construct: () => new Constructors.ENUM(value)
        }
    }
};
