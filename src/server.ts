import http from "http";

import express from "express";
import socketio from "socket.io";

import { Serializer } from "./seralize";
import { Workout } from "./workout";

export class Server {
    private app: express.Express;
    private httpServer: http.Server;
    private io: socketio.Server;

    private serializer: Serializer;

    constructor() {
        // Setup express API
        this.app = express();
        this.httpServer = new http.Server(this.app);
        this.io = new socketio.Server(this.httpServer);

        this.serializer = new Serializer();

        this.routes();
    }

    /**
     * REST API for CRUD operations on the timer
     */
    private routes() {
        this.app.use(express.json());

        // List all workouts available naively
        this.app.get("/workout", (req, res) => {
            res.json(this.serializer.listWorkoutNames());
        });

        // Get information for a specific workout
        this.app.get("/workout/:name", (req, res) => {
            console.log(`GET /workout/${req.params["name"]}`);

            const name = req.params["name"];

            const workout = this.serializer.read(name + ".json"); // NOTE: eugh
            if (workout !== undefined) {
                res.json(workout);
            } else {
                res.status(400).send(`Could not find workout named "${name}"`);
            }
        });

        // Create a workout: Returns 201 on success, 400 otherwise
        this.app.post("/workout", (req, res) => {
            const workout = req.body as Workout;

            console.log(`POST /workout with content:\n ${JSON.stringify(workout)}`);

            // We're going to assume ALL data from the client should be correct
            console.log("Writing to JSON file...");

            this.serializer.write(workout);

            res.status(201).end(); // We've created the resource!
        });

        // Delete a workout on the backend
        this.app.delete("/workout/:name", (req, res) => {
            const name = req.params["name"];
            console.log(`TODO: DELETE /workout/${name}`);

            this.serializer.delete(name);

            res.status(200).end();
        });
    }

    public listen(port: number): void {
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

        this.httpServer.listen(port, () => console.log(`Listening on port ${port}`));
    }
}