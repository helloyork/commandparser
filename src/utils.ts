import { ParseRuntimeError } from "./parser/errors";

export class CycleTracker {
    private cycles: number = 0;
    private maxCycles: number;
    constructor(maxCycles: number) {
        this.maxCycles = maxCycles;
    }
    next(callback?: () => void) {
        this.cycles++;
        if (this.cycles > this.maxCycles) {
            if (callback) callback();
            throw new ParseRuntimeError('Cycle limit exceeded');
        }
    }
    getCycles() {
        return this.cycles;
    }
}

