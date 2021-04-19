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

    /**
     * Grab a workout object from storage
     * 
     * @param name Name of the workout
     * @returns The workout object if it exists otherwise undefined
     */
    read(name: string): Workout | undefined {
        const wantedPath = `${this.mainPath}/${name}.json`;

        if (!fs.existsSync(wantedPath)) {
            console.warn(`Could not find ${wantedPath}!`);
            return undefined;
        }

        const workoutStr = fs.readFileSync(wantedPath, { encoding: "utf-8", flag: "r" });

        return JSON.parse(workoutStr) as Workout;
    }

    /**
     * Delete's a workout record from storage
     * 
     * WARNING: This function is rather unsafe! People could redirect via path manipulation and
     * potentially delete something else. Sanitize that input!
     * 
     * @param name Name of the workout
     */
    delete(name: string): void {
        if (this.has(name)) {
            fs.rmSync(`${this.mainPath}/${name}.json`);
        }
    }

    has(name: string): boolean {
        return fs.existsSync(`${this.mainPath}/${name}.json`);
    }

    listWorkoutNames(): string[] {
        return fs.readdirSync(this.mainPath).map(
            val => val.substring(0, val.length - ".json".length) // NOTE: is this a good idea?
        );
    }
}