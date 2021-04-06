import { IncomingMessage } from "http";
import { Socket } from "net";

import express from "express";
// import sqlite3 from "sqlite3";
import { v4 as uuid } from "uuid";
import ws from "ws";
import WebSocket from "ws";

// Is there a better way to manage active connections?
const connections: WebSocket[] = [];

// TODO: Define how we store items in Database.
// NOTE: Also we're using JSON right?
// "Connect" to database
// const db = new sqlite3.Database("workout-timer.db");

// Setup express api
const app = express();

// TODO: Better define API for client <-> backend communication

// React to WebSockets and send messages
const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket, req) => {
    console.log("Connection made from client. Giving id: ");

    // Give client uuid for session
    const id = uuid();
    socket.send(`id:${id}`);
    
    connections.push(socket);
    
    socket.on("message", msg => {
        console.log(`Client ${id} sent ${msg}`);
    });
});

// Listen for websockets on express
const server = app.listen(3000);
server.on("upgrade", (req: IncomingMessage, sock: Socket, head: Buffer) => {
    wsServer.handleUpgrade(req, sock, head, (wsSock) => {
        // Notify WS server that a connection was made
        wsServer.emit("connection", wsSock, req);
    })
});