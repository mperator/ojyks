import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import config from "@colyseus/tools";

/**
 * Import your Room files
 */
import { LobbyRoom } from "colyseus";
import { MyRoom } from "./rooms/MyRoom";

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    // Expose the built-in lobby room
    gameServer.define("lobby", LobbyRoom);

    // Define main game room with realtime listing enabled so it shows up in lobby
    gameServer.define("my_room", MyRoom).enableRealtimeListing();
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground());
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/monitor", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
