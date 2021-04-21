import http from "http";

import express from "express";
import socketio from "socket.io";

import { Serializer } from "./seralize";
import { Workout } from "./workout";

interface TimedTask {
    timeout: NodeJS.Timeout, // Timeout id
    start: DOMHighResTimeStamp, // When the workout was started
    end: DOMHighResTimeStamp, // When the workout should end
    left: DOMHighResTimeStamp, // Time left
    message: string // Message to send to clients
}

type TimerRequest = {
    id: string, // Client giving id for a timer
    duration: DOMHighResTimeStamp, // How long in seconds the timer should lsat
    message: string // Message to send to clients
};

export interface ServerConfig {
    mainPath: string
}

export class Server {
    public readonly app: express.Express;
    public readonly httpServer: http.Server;
    public readonly io: socketio.Server;

    // Map the ids to the servers timers
    timers: Map<string, TimedTask>;

    public readonly serializer: Serializer;

    constructor(config?: ServerConfig) {
        // Setup express API
        this.app = express();
        this.httpServer = new http.Server(this.app);
        this.io = new socketio.Server(this.httpServer);

        this.serializer = new Serializer(config?.mainPath);

        this.timers = new Map();

        this.routes();
    }

    /**
     * REST API for CRUD operations on the timer
     */
    private routes() {
        this.app.use(express.json());

        // List all workouts available naively
        this.app.get("/workouts", (_, res) => {
            res.json(this.serializer.listWorkoutNames());

            res.status(200).end();
        });

        // Get information for a specific workout
        this.app.get("/workouts/:name", (req, res) => {
            console.log(`GET /workouts/${req.params["name"]}`);

            const name = req.params["name"];

            const workout = this.serializer.read(name);
            if (workout !== undefined) {
                res.json(workout);
            } else {
                res.status(400).send(`Could not find workout named "${name}"`);
            }
        });

        // Create a workout: Returns 201 on success, 400 otherwise
        this.app.post("/workouts", (req, res) => {
            const workout = req.body as Workout;

            console.log(`POST /workouts with content:\n ${JSON.stringify(workout)}`);

            // We're going to assume ALL data from the client should be correct
            console.log("Writing to JSON file...");

            this.serializer.write(workout);

            res.status(201).end(); // We've created the resource!
        });

        // Delete a workout on the backend
        this.app.delete("/workouts/:name", (req, res) => {
            const name = req.params["name"];

            this.serializer.delete(name);

            res.status(200).end();
        });

        // NOTE: Proof of concept, not final
        this.app.post("/timers", (req, res) => {
            const tReq = req.body as TimerRequest;

            // Timer already exists
            if (this.timers.has(tReq.id)) {
                res.status(409).end();
                return;
            }

            const MS_PER_SEC = 1000;

            // Timer duration is in milliseconds!
            const msDuration = tReq.duration * MS_PER_SEC;
            const timeout = setTimeout(() => this.io.emit("timer", tReq.message), msDuration);

            const start = performance.now();
            const end = performance.now() + msDuration;
            this.timers.set(tReq.id, {
                start: start,
                end: end,
                left: end - start,
                timeout: timeout,
                message: tReq.message
            });

            res.status(201).end();
        });

        // Strange way of doing this probably
        this.app.get("/timers/pause/", (req, res) => { // Pause ALL timers
            this.timers.forEach((val, key) => {
                clearTimeout(val.timeout);

                const copy = { ...val };
                copy.left = copy.end - performance.now();
                this.timers.set(key, copy);
            });

            res.status(200).end();
        });


        this.app.get("/timers/resume/", (req, res) => { // Resume ALL timers
            this.timers.forEach((val, key) => {
                const newTimeout = setTimeout(() => this.io.emit("timer", val.message), val.left);

                const copy = { ...val };
                copy.timeout = newTimeout;
                this.timers.set(key, copy);
            });

            res.status(200).end();
        });
    }

    // public initSocketio(): void {
        // NOTE: io.of("/").sockets
        // Use above to grab to connections to server as a map.
        // Each socket will have an id
    // }

    public listen(port: number): void {
        // this.initSocketio();
        this.httpServer.listen(port, () => console.log(`Listening on port ${port}`));
    }
}