import crypto from "crypto";
import path from "path";

import fse from "fs-extra";
import supertest from "supertest";

import { Server } from "../src/server";

// We're using the setup below to create consistent locations for different tests
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

describe("GET /workout - List all workouts available", () => {
    const DIR_ID = crypto
        .createHash("md5")
        .update("GET /workout - List all workouts available")
        .digest("hex");

    const DIR_PATH = path.resolve(DIR_BASE, `workout${DIR_ID}`);
    fse.copySync(EXAMPLE_WORKOUTS, DIR_PATH);

    const server = new Server({ mainPath: DIR_PATH });
    const app = server.app;

    it("Should return 200 with all the workouts available", () => {
        supertest(app)
        .get("/workout")
        .then(response => {
            const workouts = server.serializer.listWorkoutNames();
            expect(response.body).toEqual(workouts);
        });
    });
});