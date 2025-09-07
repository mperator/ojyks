import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Server } from "colyseus";
import { Application, Request, Response } from "express";

import { MyRoom } from "./rooms/MyRoom";

export default Arena({
    getId: () => "Your App Name",

    initializeGameServer: (gameServer: Server) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);

    },

    initializeExpress: (app: Application) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req: Request, res: Response) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password for production environments.
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
