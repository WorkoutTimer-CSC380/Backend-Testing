import http from "http";

import express from "express";
import socketio from "socket.io";

import { Serializer } from "./seralize";
import { Workout } from "./workout";

const PORT = 3000;

// Setup express API
const app = express();
const httpServer = new http.Server(app);
const io = new socketio.Server(httpServer);

const serializer = new Serializer();

app.use(express.json());

// REST API for CRUD operations on the timer

// List all workouts available naively
app.get("/workout", (req, res) => {
    res.json(serializer.listWorkoutNames());
});

// Get information for a specific workout
app.get("/workout/:name", (req, res) => {
    console.log(`GET /workout/${req.params["name"]}`);

    const name = req.params["name"];

    const workout = serializer.read(name + ".json"); // NOTE: eugh
    if (workout !== undefined) {
        res.json(workout);
    } else {
        res.status(400).send(`Could not find workout named "${name}"`);
    }
});

// Create a workout: Returns 201 on success, 400 otherwise
app.post("/workout", (req, res) => {
    const workout = req.body as Workout;

    console.log(`POST /workout with content:\n ${JSON.stringify(workout)}`);

    // We're going to assume ALL data from the client should be correct
    console.log("Writing to JSON file...");
    
    serializer.write(workout);

    res.status(201).end(); // We've created the resource!
});

// TODO: Implement
// Delete a workout on the backend
app.delete("/workout/:name", (req, res) => {
    console.log(`TODO: DELETE /workout/${req.params["name"]}`);
});

// NOTE: io.of("/").sockets
// Use above to grab to connections to server as a map.
// Each socket will have an id: 
io.on("connection", (socket) => {
    console.log("User connected");

    const sockets = io.of("/").sockets;

    socket.on("disconnect", () => {
        // TODO: Handle
    });
});

httpServer.listen(PORT, () => {
    console.log(`Listening on localhost:${PORT}`);
});