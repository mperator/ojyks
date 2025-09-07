import { Room, Client } from "colyseus";
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

class Card extends Schema {
  @type("number")
  value: number = 0;
}

class Player extends Schema {
  @type("string")
  name: string = "";

  @type([Card])
  cards = new ArraySchema<Card>();

  @type("number")
  score: number = 0;
}

class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type([Card])
  drawPile = new ArraySchema<Card>();

  @type([Card])
  discardPile = new ArraySchema<Card>();

  @type("string")
  currentTurn: string = "";
}

export class MyRoom extends Room<State> {

  onCreate (options: any) {
    this.setState(new State());

    // Initialize the deck
    const values = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2];
    const counts = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 5];
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        const card = new Card();
        card.value = values[i];
        this.state.drawPile.push(card);
      }
    }

    // Shuffle the deck
    this.state.drawPile.sort(() => Math.random() - 0.5);

    this.onMessage("chat", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("chat", `(${player.name}) ${message}`);
      }
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.name = options.playerName;

    // Deal 12 cards to the player
    for (let i = 0; i < 12; i++) {
      const card = this.state.drawPile.pop();
      if (card) {
        player.cards.push(card);
      }
    }
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size === 1) {
      this.state.currentTurn = client.sessionId;
    }
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
    if (this.state.currentTurn === client.sessionId) {
      // Naive turn change, might need better logic
      const playerIds = Array.from(this.state.players.keys());
      this.state.currentTurn = playerIds[0] || "";
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
