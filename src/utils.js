"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CycleTracker = void 0;
var errors_1 = require("./parser/errors");
var CycleTracker = /** @class */ (function () {
    function CycleTracker(maxCycles) {
        this.cycles = 0;
        this.maxCycles = maxCycles;
    }
    CycleTracker.prototype.next = function (callback) {
        this.cycles++;
        if (this.cycles > this.maxCycles) {
            if (callback)
                callback();
            throw new errors_1.ParseRuntimeError('Cycle limit exceeded');
        }
    };
    CycleTracker.prototype.getCycles = function () {
        return this.cycles;
    };
    return CycleTracker;
}());
exports.CycleTracker = CycleTracker;
