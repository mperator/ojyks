import { Client } from "@colyseus/sdk";

const client = new Client(process.env.NEXT_PUBLIC_GAMESERVER);
export default client;
