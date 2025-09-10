import { Client } from "colyseus.js";

const client = new Client(process.env.NEXT_PUBLIC_GAMESERVER);
export default client;