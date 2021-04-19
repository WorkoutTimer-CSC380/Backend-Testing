import { Round } from "./Round";

export class Workout{
    queue : Round[] = [];

    push(round : Round){
        return this.queue.push(round);
    }

    pop(){
        return this.queue.shift();
    }
}