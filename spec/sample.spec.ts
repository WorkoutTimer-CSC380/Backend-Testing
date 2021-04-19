import crypto from "crypto";
import path from "path";

import fse from "fs-extra";
import supertest from "supertest";

import { Server } from "../src/server";
import { Workout } from "../src/workout";

// We're using the setup below to create consistent locations for different tests and running
// in parallel as well
// https://stackoverflow.com/questions/41111620/testing-the-file-system-with-jest/49155837
const DIR_BASE = path.resolve(__dirname, "__fixtures__");
const EXAMPLE_WORKOUTS = path.resolve(__dirname, "example-workouts");

// NOTE: Maybe use env to allow keeping outputs of tests
// This function cleans up after the test files in __fixture__
afterAll(() => {
    const folders = fse.readdirSync(DIR_BASE).filter(folder => folder.match("workout"));

    folders.forEach(folder => {
        const relPath = path.resolve(DIR_BASE, folder);
        fse.remove(relPath);
    });
});

describe("GET /workouts - List all workouts available", () => {
    const DIR_ID = crypto
        .createHash("md5")
        .update("GET /workouts - List all workouts available")
        .digest("hex");

    const DIR_PATH = path.resolve(DIR_BASE, `workout${DIR_ID}`);
    fse.copySync(EXAMPLE_WORKOUTS, DIR_PATH);

    const server = new Server({ mainPath: DIR_PATH });
    const app = server.app;

    it("Should return 200 with all the workouts available", async () => {
        const response = await supertest(app)
            .get("/workouts")
            .expect(200);
        const workouts = server.serializer.listWorkoutNames();
        expect(response.body).toEqual(workouts);
    });
});

describe("GET /workouts/:name - Grab a specific workout", () => {
    const DIR_ID = crypto
        .createHash("md5")
        .update("GET /workouts/:name - Grab a specific workout")
        .digest("hex");

    const DIR_PATH = path.resolve(DIR_BASE, `workout${DIR_ID}`);
    fse.copySync(EXAMPLE_WORKOUTS, DIR_PATH);

    const server = new Server({ mainPath: DIR_PATH });
    const app = server.app;

    const workout: Workout = {
        "name": "Single Round",
        "rounds": [
            {
                "name": "Pushups for 30 seconds",
                "time": 30
            }
        ]
    };

    it("Should return 200 with the workout data for the specified workout", async () => {
        const response = await supertest(app)
            .get(`/workouts/${workout.name}`)
            .expect(200);

        expect(workout).toEqual(response.body);
    });
});

describe("POST /workouts - Create a workout with the specified name", () => {
    const DIR_ID = crypto
        .createHash("md5")
        .update("POST /workouts - Create a workout with the specified name")
        .digest("hex");

    const DIR_PATH = path.resolve(DIR_BASE, `workout${DIR_ID}`);
    fse.copySync(EXAMPLE_WORKOUTS, DIR_PATH);

    const workout: Workout = {
        name: "Test workout",
        rounds: [
            {
                name: "Run around in a circle at 60 fps",
                time: 1
            }
        ]
    };

    const server = new Server({ mainPath: DIR_PATH });
    const app = server.app;

    it("Should return 201 indicating the workout was created in the backed", () => {
        return supertest(app)
            .post("/workouts")
            .send(workout)
            .expect(201)
            .then(() => {
                const workoutInBackend = server.serializer.read(workout.name);
                expect(workoutInBackend).toEqual(workout);
            });
    });
});