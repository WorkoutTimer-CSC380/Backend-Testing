export class ExerciseClass{
    name : string = "";
    duration : number = 0;
    breakTime : number = 0;
    reps : number = 0;
    sets : number = 0;

    constructor(){
    }

    enterName(name : string){
        this.name = name;
    }

    enterDuration(duration : number){
        this.duration = duration;
    }

    enterBreakTime(breakTime : number){
        this.breakTime = breakTime;
    }

    enterReps(reps : number){
        this.reps = reps;
    }

    enterSets(sets : number){
        this.sets = sets;
    }

    getName(){
        return this.name;
    }

    getDuration(){
        return this.duration;
    }

    getBreakTime(){
        return this.breakTime;
    }

    getReps(){
        return this.reps;
    }

    getSets(){
        return this.sets;
    }
}