import http from "http";
import { performance } from "perf_hooks";
import process from "process";

import cors from "cors";
import express from "express";
import socketio from "socket.io";

import { Serializer } from "./serialize";
import { Exercise, Workout } from "./workout";
import { RecentsQueue } from "./queue";

interface TimedTask {
  timeout: NodeJS.Timeout; // Timeout id
  start: DOMHighResTimeStamp; // When the workout was started
  end: DOMHighResTimeStamp; // When the workout should end
  left: DOMHighResTimeStamp; // Time left
  message: string; // Message to send to clients
  paused: boolean;
}

type TimerRequest = {
  id: string; // Client giving id for a timer
  duration: DOMHighResTimeStamp; // How long in seconds the timer should last in seconds
  message: string; // Message to send to clients
};

export interface ServerConfig {
  workoutPath?: string;
  exercisePath?: string;
  maxRecents?: number;
}

export class Server {
  public readonly app: express.Express;
  public readonly httpServer: http.Server;
  public readonly io: socketio.Server;

  // Map the ids to the servers timers
  timers: Map<string, TimedTask>;

  public readonly serializer: Serializer;

  private recentWorkouts: RecentsQueue;

  constructor(config?: ServerConfig) {
    // Setup express API
    this.app = express();
    this.httpServer = new http.Server(this.app);
    // Allow requests from front-end
    this.io = new socketio.Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.serializer = new Serializer(config?.workoutPath, config?.exercisePath);

    this.recentWorkouts = this.serializer.loadRecentWorkouts(
      config?.maxRecents || 3
    );

    // Save to disk on ctrl+c
    process.on("SIGINT", () => {
      console.log("Saving recent workouts");
      this.serializer.writeRecentWorkouts(this.recentWorkouts);
      process.exit();
    });

    this.timers = new Map();

    this.routes();
  }

  /**
   * REST API for CRUD operations on the timer
   */
  private routes() {
    type DeviceType = "desktop" | "mobile";
    type TimerEvent = "pause" | "play" | "restart" | "stop";

    this.app.use(express.json());
    this.app.use(cors());

    this.io.on("connection", (socket) => {
      socket.on("pause", (device: DeviceType) => {
        console.log("[*] Timer pause received");
      });

      socket.on("play", (device: DeviceType) => {
        console.log("[*] Timer play received");
      });

      socket.on("restart", (device: DeviceType) => {
        console.log("[*] Timer restart received");
      });

      socket.on("stop", (device: DeviceType) => {
        console.log("[*] Timer stop received");
      });
    });

    // List all workouts available naively
    this.app.get("/workouts", (_, res) => {
      res.json(this.serializer.listWorkoutNames());

      console.log(`[^] All workout names requested`);

      res.status(200).end();
    });

    // Get information for a specific workout
    this.app.get("/workouts/:name", (req, res) => {
      const name = req.params["name"];

      const workout = this.serializer.readWorkout(name);
      if (workout !== undefined) {
        res.json(workout);
        console.log(`[^] Workout ${name} requested`);

      } else {
        console.warn(`[!] No workout called ${name}`);

        res.status(400).send(`No workout called "${name}"`);
      }
    });

    // Create a workout: Returns 201 on success, 400 otherwise
    this.app.post("/workouts", (req, res) => {
      const workout = req.body as Workout;

      console.log(`[+] Workout "${workout.name}" created`);

      this.serializer.writeWorkout(workout);

      res.status(201).end(); // We've created the resource!
    });

    // Delete a workout on the backend
    this.app.delete("/workouts/:name", (req, res) => {
      const name = req.params["name"];

      if (this.serializer.hasWorkout(name)) {
        console.log(`[-] Workout ${name} deleted`);
      } else {
        console.warn(`[!] No workout called ${name}`);
      }

      this.serializer.deleteWorkout(name);

      res.status(200).end();
    });

    this.app.get("/recents", (req, res) => {
      const recentWorkouts = this.recentWorkouts.data();

      console.log(`[^] Recent workouts requested`);

      res.status(200).send(recentWorkouts);
    });

    this.app.get("/recents/:name", (req, res) => {
      const name = req.params["name"];

      const workout = this.serializer.readWorkout(name);

      if (workout === undefined) {
        console.log(`[!] No workout called "${name}"`);
        res.status(404).send(`No workout called "${name}"`);
      } else {
        console.log(`[+] Added workout "${name}" to recents`);
        this.recentWorkouts.enqueue(workout);
        res.status(200).end();
      }
    });

    this.app.post("/exercises", (req, res) => {
      const exercise = req.body as Exercise;

      console.log(`[+] Exercise ${exercise.name} created`);

      this.serializer.writeExercise(exercise);

      res.status(201).end();
    });

    // Send ALL exercises
    this.app.get("/exercises", (req, res) => {
      const exercises = this.serializer.allExercises();

      console.log(`[^] All exercises requested`);

      res.status(200).send(exercises);
    });

    // Send only the names
    this.app.get("/exercises/names", (req, res) => {
      const exerciseNames = this.serializer.listExerciseNames();

      console.log(`[^] All exercise names requested`);

      res.status(200).send(exerciseNames);
    });

    this.app.delete("/exercises/:name", (req, res) => {
      const name = req.params["name"];

      console.log(`[-] Exercise "${name}" deleted`);

      this.serializer.deleteExercise(name);

      res.status(200).end();
    });

    this.app.post("/timers", (req, res) => {
      const tReq = req.body as TimerRequest;

      console.log(`[+] Timer ${tReq.id} created`);

      // Timer already exists
      if (this.timers.has(tReq.id)) {
        res.status(409).end();
        return;
      }

      const MS_PER_SEC = 1000;

      // Timer duration is in milliseconds!
      const msDuration = tReq.duration * MS_PER_SEC;
      const timeout = setTimeout(
        () => this.io.emit("timer", tReq.message),
        msDuration
      );

      const start = performance.now();
      const end = performance.now() + msDuration;
      this.timers.set(tReq.id, {
        start: start,
        end: end,
        left: end - start,
        timeout: timeout,
        message: tReq.message,
        paused: false,
      });

      res.status(201).end();
    });

    // Strange way of doing this probably
    this.app.get("/timers/pause", (req, res) => {
      console.log(`[*] All timers paused`);

      // Pause ALL timers
      this.timers.forEach((val, key) => {
        clearTimeout(val.timeout);

        const copy = { ...val };
        const now = performance.now();
        copy.left = copy.end - now;
        copy.end = now + copy.left;
        copy.paused = true;
        this.timers.set(key, copy);
      });

      res.status(200).end();
    });

    this.app.get("/timers/resume", (req, res) => {
      console.log(`[*] All timers resumed`);

      // Resume ALL timers
      this.timers.forEach((val, key) => {
        if (val.paused) {
          const newTimeout = setTimeout(
            () => this.io.emit("timer", val.message),
            val.left
          );

          const copy = { ...val };
          copy.timeout = newTimeout;
          copy.paused = false;
          this.timers.set(key, copy);
        }
      });

      res.status(200).end();
    });
  }

  public listen(port: number): void {
    this.httpServer.listen(port, () =>
      console.log(`[*] Listening on port ${port}`)
    );
  }
}
