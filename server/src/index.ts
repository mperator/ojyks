import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { MyRoom } from "./rooms/MyRoom";

const port = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json());

const gameServer = new Server({
  server: createServer(app),
});

gameServer.define("my_room", MyRoom);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
