import http from "http";

import express from "express";
import socketio from "socket.io";

const PORT = 3000;

// Setup express API
const app = express();
const httpServer = new http.Server(app);
const io = new socketio.Server(httpServer);

// NOTE: For later, we'll need to parse bodies on POST requests
// const jsonParser = express.json();

// REST API for CRUD operations on the timer

// TODO: Implement
// List all workouts available
app.get("/workout", (req, res) => {
    res.json({});
});

// TODO: Implement
// Get information for a specific workout
app.get("/workout/:id", (req, res) => {
    const id = parseInt(req.params["id"]);

    // Check if exists
    const exists = true;
    if (exists) {
        res.json({ youveGotData: true });
    } else {
        res.status(400).send("Better error message goes here");
    }
});

// TODO: Implement
// Create a workout: Returns 201 on success, 400 otherwise
app.post("/workout", (req, res) => {
    //
});

// TODO: Implement
// Delete a workout on the backend
app.delete("/workout/:id", (req, res) => {
    //
});

const sockets: socketio.Socket[] = [];

io.on("connection", (socket) => {
    console.log("User connected");

    sockets.push(socket);

    socket.on("disconnect", () => {
        const index = sockets.indexOf(socket);
        sockets.splice(index, 1);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});