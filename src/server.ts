import http from "http";

import express from "express";
import socketio from "socket.io";

import { Serializer } from "./seralize";
import { Workout } from "./workout";

export interface ServerConfig {
    mainPath: string
}

export class Server {
    public readonly app: express.Express;
    public readonly httpServer: http.Server;
    public readonly io: socketio.Server;

    public readonly serializer: Serializer;

    constructor(config?: ServerConfig) {
        // Setup express API
        this.app = express();
        this.httpServer = new http.Server(this.app);
        this.io = new socketio.Server(this.httpServer);

        this.serializer = new Serializer(config?.mainPath);

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
    }

    public initSocketio(): void {
        // NOTE: io.of("/").sockets
        // Use above to grab to connections to server as a map.
        // Each socket will have an id: 
        this.io.on("connection", (socket) => {
            console.log("User connected");

            // const sockets = io.of("/").sockets;

            socket.on("disconnect", () => {
                // TODO: Handle
            });
        });
    }

    public listen(port: number): void {
        this.initSocketio();
        this.httpServer.listen(port, () => console.log(`Listening on port ${port}`));
    }
}