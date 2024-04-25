
export class ParseError extends Error {
    constructor(message?: string | undefined) {
        super(message);
        this.name = 'ParseError';
    }
}
