import fs from "fs";

import { Workout } from "./workout";

export class Serializer {
    constructor(private readonly mainPath: string = "./workouts") {
        // Create folder
        if (!fs.existsSync(mainPath)) {
            fs.mkdirSync(mainPath);
        }
    }

    /**
     * Serialize a Workout into a JSON file
     * 
     * NOTE: This will overwrite the file if it exists!
     * 
     * @param workout Workout to serialize
     */
    write(workout: Workout): void {
        const wantedPath = `${this.mainPath}/${workout.name}.json`;

        // Create if not exists
        if (!fs.existsSync(wantedPath)) {
            fs.writeFile(wantedPath, JSON.stringify(workout), (err) => {
                if (err) {
                    console.error(`Failed to write to ${wantedPath}`);
                }
            });
        }
    }

    read(name: string): Workout | undefined {
        const wantedPath = `${this.mainPath}/${name}`;

        if (!fs.existsSync(wantedPath)) {
            return undefined;
        }

        const workoutStr = fs.readFileSync(wantedPath, { encoding: "utf-8", flag: "r" });

        return JSON.parse(workoutStr) as Workout;
    }

    listWorkoutNames(): string[] {
        return fs.readdirSync(this.mainPath).map(
            val => val.substring(0, val.length - ".json".length) // NOTE: is this a good idea?
        );
    }
}