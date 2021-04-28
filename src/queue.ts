import { Workout } from "./workout";

import _ from "lodash";

export class RecentsQueue {
    private readonly max: number;
    private capacity: number;

    private elements: Workout[];

    constructor(max: number, elements: Workout[] = []) {
        this.max = max;
        this.elements = elements;

        // Clip off extras
        this.elements = elements.slice(0, max);

        this.capacity = this.elements.length - max;
    }

    static fromString(max: number, data: string): RecentsQueue {
        const elements = JSON.parse(data) as Workout[];

        return new RecentsQueue(max, elements);
    }

    toString(): string {
        return JSON.stringify(this.elements);
    }

    enqueue(item: Workout): void {
        for (let idx = 0; idx < this.elements.length; idx++) {
            const e = this.elements[idx];

            if (_.isEqual(item, e)) {
                this.elements.splice(idx, 1);
            }
        }

        if (this.elements.length >= this.max) {
            console.log("Queue at capacity, removing element at end...  ");
            this.elements.pop();
        }

        this.elements.unshift(item); // Add to front
    }

    has(item: Workout): boolean {
        return this.elements.includes(item);
    }

    public data(): Workout[] {
        return this.elements;
    }
}