import { Exercise } from "./Exercise";

export class Round {
    queue : Exercise[] = [];

    push(exercise : Exercise){
        return this.queue.push(exercise);
    }

    pop(){
        return this.queue.shift();
    }
}