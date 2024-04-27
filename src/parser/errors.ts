

export class ParseError extends Error {
    constructor(message?: string | undefined) {
        super(message);
        this.name = 'ParseError';
    }
}

export class ParseSyntaxError extends ParseError {
    constructor(message?: string | undefined, public line?: number, public column?: number) {
        let m = [];
        if (line !== undefined) m.push(`at line ${line}`);
        if (column !== undefined) m.push(`column ${column}`);

        super(`${message}\n    ` + m.join("\n    ") + '\n');
        this.name = 'ParseSyntaxError';
        this.line = line;
        this.column = column;
    }
}

export class ParseArgTypeError extends ParseError {
    constructor(message?: string | undefined, public position?: number, public argName?: string, public expectedType?: string, public actualType?: string) {
        let m = [];
        if (position !== undefined) m.push(`at position ${position}`);
        if (argName) m.push(`for argument ${argName}`);
        if (expectedType) m.push(`expected ${expectedType}`);
        if (actualType) m.push(`got ${actualType}`);

        super(`${message}\n    ` + m.join("\n    ") + '\n');
        this.name = 'ParseArgTypeError';
        this.position = position;
        this.argName = argName;
        this.expectedType = expectedType;
        this.actualType = actualType;
    }
}

export class ParseRuntimeError extends ParseError {
    constructor(message?: string | undefined, public cause?: Error | undefined) {
        let m = [];
        if (cause) m.push(`caused by ${cause}`);

        super(`${message}\n    ` + m.join("\n    ") + '\n');
        this.name = 'ParseRuntimeError';
        this.cause = cause;
    }
}
