import { Client } from "colyseus.js";

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const port = 3001;

export const client = new Client(`ws://${host}:${port}`);
