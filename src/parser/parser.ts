import { ArgOptions } from "../command";
import { ArgType, ArgTypeConstructorMap, BaseArgTypeConstructor, Constructors, IBaseArgTypeConstructor, IWithChildTypeConstructor } from "../constructors";


class Parser {
    argOptions: ArgOptions;
    constructors: Partial<ArgTypeConstructorMap> = {};
    constructor(argOption: ArgOptions) {
        this.argOptions = argOption;
        this.registerConstructors(Constructors);
    }
    registerConstructors(constructos: ArgTypeConstructorMap) {
        Object.keys(constructos).forEach((key) => {
            this.constructors[key] = constructos[key];
        });
        return this;
    }
    fullParse() {
    }
    lexer(input: string) {

    }
}
