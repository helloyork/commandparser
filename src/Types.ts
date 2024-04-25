import { BaseArgType, Constructors } from "./constructors";


export const Types = {
    STRING: Constructors.STRING,
    NUMBER: Constructors.NUMBER,
    FLOAT: Constructors.FLOAT,
    INT: Constructors.INT,
    BOOLEAN: Constructors.BOOLEAN,

    DICT: function (keyType: BaseArgType, valueType: BaseArgType) {
        return function () {
            return new Constructors.DICT(keyType, valueType);
        };
    },

    ARRAY: function (...valueType: BaseArgType[]) {
        return function () {
            return new Constructors.ARRAY(valueType);
        };
    },
    SET: function (...valueType: BaseArgType[]) {
        return function () {
            return new Constructors.SET(valueType);
        };
    }
};
