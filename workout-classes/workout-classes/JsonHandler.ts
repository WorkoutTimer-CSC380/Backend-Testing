import { Workout } from "./Workout";

export class JsonHandler{
    jsonFile : string;
    workout : Workout;

    constructor(jsonFile: string){
        this.jsonFile = jsonFile;
        this.workout = JSON.parse(this.jsonFile);
    }

    getWorkout(){
        return this.workout;
    }
}