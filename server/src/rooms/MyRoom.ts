import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Client, Room, updateLobby } from "colyseus";

export class Card extends Schema {
  @type("number")
  value: number = 0;

  @type("boolean")
  isFlipped: boolean = false;
}

export class Player extends Schema {
  @type("string")
  name: string = "";

  @type([Card])
  cards = new ArraySchema<Card>();

  @type("number")
  score: number = 0; // Total game score

  @type("number")
  roundScore: number = 0;

  @type("boolean")
  isReady: boolean = false;

  @type("boolean")
  readyForNextRound: boolean = false;

  @type("boolean")
  connected: boolean = true;
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type([Card])
  drawPile = new ArraySchema<Card>();

  @type([Card])
  discardPile = new ArraySchema<Card>();

  @type("string")
  currentTurn: string = "";

  @type("string")
  gameState: string = "waiting"; // waiting, starting, playing, round-end, game-over

  @type("string")
  hostId: string = "";

  @type("string")
  lastRoundInitiator: string | null = null;

  @type("boolean")
  initiatorScoreDoubled: boolean = false;

  @type(Card)
  drawnCard: Card | null = null;
}

// Option shape incoming when creating / joining a room
interface JoinOptions {
  playerName?: string;
}

export class MyRoom extends Room<State> {
  maxClients = 8;

  // 'options' not used currently – keep signature (renamed) to satisfy base class without triggering no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCreate(_options: unknown) {
    this.setState(new State());

    // Initial metadata used by LobbyRoom listings
    this.setMetadata({
      status: "waiting",
      players: 0,
      maxClients: this.maxClients,
      name: "my_room",
    }).then(() => updateLobby(this));

    this.onMessage("chat", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("chat", `(${player.name}) ${message}`);
      }
    });

    this.onMessage("playerReady", (client, { isReady }: { isReady: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.gameState === "waiting") {
        player.isReady = isReady;
        this.broadcast("playerReady", { playerId: client.sessionId, isReady });
      }
    });

    this.onMessage("startGame", (client) => {
      // Host can start when in waiting OR after a completed game (game-over)
      if (
        client.sessionId !== this.state.hostId ||
        (this.state.gameState !== "waiting" && this.state.gameState !== "game-over")
      ) {
        return;
      }

      const allPlayersReady = (Array.from(this.state.players.values()) as Player[]).every((p) => p.isReady);
      if (this.state.players.size >= 2 && allPlayersReady) {
        // If coming from a finished game, reset cumulative scores
        if (this.state.gameState === "game-over") {
          this.state.players.forEach((player: Player) => {
            player.score = 0;
            player.roundScore = 0;
            player.isReady = false;
            player.readyForNextRound = false;
          });
          this.state.lastRoundInitiator = null;
          this.state.initiatorScoreDoubled = false;
        }
        this.resetGame(); // Deal cards and set up piles
        this.state.gameState = "starting";
        this.setMetadata({
          status: "starting",
          players: this.state.players.size,
          maxClients: this.maxClients,
          name: "my_room",
        }).then(() => updateLobby(this));
        this.broadcast("gameStarting");
      }
    });

    this.onMessage("revealInitialCard", (client, cardIndex: number) => {
      const player = this.state.players.get(client.sessionId);
      if (this.state.gameState !== "starting" || !player) return;

      const flippedCount = player.cards.filter((c: Card) => c.isFlipped).length;
      if (flippedCount >= 2) return;

      if (player.cards[cardIndex] && !player.cards[cardIndex].isFlipped) {
        player.cards[cardIndex].isFlipped = true;

        const newFlippedCount = player.cards.filter((c: Card) => c.isFlipped).length;
        if (newFlippedCount === 2) {
          player.isReady = true;
          this.checkAllPlayersRevealed();
        }
      }
    });

    // --- Game Actions ---
    this.onMessage("flipCard", (client, cardIndex: number) => {
      if (this.state.currentTurn !== client.sessionId || this.state.drawnCard) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.cards[cardIndex] || player.cards[cardIndex].isFlipped) return;

      player.cards[cardIndex].isFlipped = true;
      this.checkForColumn(player);
      this.endTurn();
    });

    this.onMessage("drawFromDrawPile", (client) => {
      if (this.state.currentTurn !== client.sessionId || this.state.drawnCard) return;
      // Draw pile should never be empty here because we reshuffle at endTurn.
      // (Safety) If it's empty and we can reshuffle, do it now.
      if (this.state.drawPile.length === 0 && this.state.discardPile.length > 1) {
        this.reshuffleDiscardIntoDraw();
      }
      const card = this.state.drawPile.pop();
      if (card) {
        card.isFlipped = true;
        this.state.drawnCard = card;
      }
    });

    this.onMessage("drawFromDiscardPile", (client) => {
      if (this.state.currentTurn !== client.sessionId || this.state.drawnCard) return;
      if (this.state.discardPile.length === 0) return;

      // Don't pop the card, just set it as drawn. It will be removed on swap.
      const card = this.state.discardPile[this.state.discardPile.length - 1];
      if (card) {
        this.state.drawnCard = card;
      }
    });

    this.onMessage("swapCard", (client, cardIndex: number) => {
      if (this.state.currentTurn !== client.sessionId || !this.state.drawnCard) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.cards[cardIndex]) return;

      const oldCard = player.cards[cardIndex];
      oldCard.isFlipped = true;

      // If the drawn card originated from the discard pile we still have its reference there.
      // Use reference equality (not value) to avoid wrong removals when values match.
      if (
        this.state.discardPile.length > 0 &&
        this.state.discardPile[this.state.discardPile.length - 1] === this.state.drawnCard
      ) {
        this.state.discardPile.pop();
      }

      player.cards[cardIndex] = this.state.drawnCard;
      this.state.discardPile.push(oldCard);
      console.log(`Cards on discard pile: ${this.state.discardPile.length}`, this.state.discardPile.toJSON());
      this.state.drawnCard = null;

      this.checkForColumn(player);
      this.endTurn();
    });

    this.onMessage("discardDrawnCard", (client) => {
      if (this.state.currentTurn !== client.sessionId || !this.state.drawnCard) return;

      this.state.discardPile.push(this.state.drawnCard);
      console.log(`Cards on discard pile: ${this.state.discardPile.length}`);
      this.state.drawnCard = null;

      // The player must now flip a card. The client will set a state to enforce this
      // and then send a "flipCard" message.
    });

    this.onMessage("flipCard", (client, cardIndex: number) => {
      if (this.state.currentTurn !== client.sessionId) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.cards[cardIndex] || player.cards[cardIndex].isFlipped) return;

      // If a card is drawn, this message is not valid.
      if (this.state.drawnCard) return;

      player.cards[cardIndex].isFlipped = true;
      this.checkForColumn(player);
      this.endTurn();
    });

    this.onMessage("setReadyForNextRound", (client, { isReady }: { isReady: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.gameState === "round-end") {
        player.readyForNextRound = isReady;
        this.broadcast("playerReadyForNextRound", { playerId: client.sessionId, isReady });
        this.checkAllPlayersReadyForNextRound();
      }
    });
  }

  resetGame() {
    // Reset player ready state for the new round
    this.state.players.forEach((p: Player) => {
      p.isReady = false;
    });

    // Initialize the deck
    const values = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2];
    const counts = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 5];
    this.state.drawPile.clear();
    this.state.discardPile.clear();

    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        const card = new Card();
        card.value = values[i];
        card.isFlipped = false;
        this.state.drawPile.push(card);
      }
    }

    // Shuffle the deck
    this.state.drawPile.sort(() => Math.random() - 0.5);

    // Deal cards
    this.state.players.forEach((player: Player) => {
      player.cards.clear();
      for (let i = 0; i < 12; i++) {
        const card = this.state.drawPile.pop();
        if (card) {
          player.cards.push(card);
        }
      }
    });

    // Place top card on discard pile
    const topCard = this.state.drawPile.pop();
    if (topCard) {
      topCard.isFlipped = true;
      this.state.discardPile.push(topCard);
      console.log(`Cards on discard pile: ${this.state.discardPile.length}`);
    }

    this.state.currentTurn = "";
    this.state.lastRoundInitiator = null;
    this.state.drawnCard = null;
  }

  checkForColumn(player: Player) {
    for (let col = 0; col < 4; col++) {
      const card1 = player.cards[col];
      const card2 = player.cards[col + 4];
      const card3 = player.cards[col + 8];

      if (card1.value === 999 || card2.value === 999 || card3.value === 999) continue; // Skip empty placeholders

      if (
        card1 &&
        card2 &&
        card3 &&
        card1.isFlipped &&
        card2.isFlipped &&
        card3.isFlipped &&
        card1.value === card2.value &&
        card2.value === card3.value
      ) {
        // Found a matching column.
        // For simplicity, we'll just mark them as "removed" by setting a special value,
        // as removing them would mess up indices. A better implementation might use a different data structure.
        // Let's just push them to the discard pile and null them out in the player's hand.
        // This is tricky with ArraySchema. Let's replace them with placeholder "empty" cards.
        // A better approach for a real game would be to handle this more gracefully on the client.
        // For MVP, we'll just discard them. The client will need to handle the visual shift.
        this.state.discardPile.push(card1, card2, card3);
        console.log(`Cards on discard pile: ${this.state.discardPile.length}`);
        // This will break indices. Let's rethink.
        // We can't remove items from ArraySchema directly without causing shifts.
        // Let's create new cards and replace them.
        const emptyCard1 = new Card();
        emptyCard1.value = 999;
        emptyCard1.isFlipped = true;
        const emptyCard2 = new Card();
        emptyCard2.value = 999;
        emptyCard2.isFlipped = true;
        const emptyCard3 = new Card();
        emptyCard3.value = 999;
        emptyCard3.isFlipped = true;
        player.cards[col] = emptyCard1;
        player.cards[col + 4] = emptyCard2;
        player.cards[col + 8] = emptyCard3;
      }
    }
  }

  endTurn() {
    // Check for game end condition
    const currentPlayer = this.state.players.get(this.state.currentTurn);
    if (currentPlayer) {
      const allFlipped = currentPlayer.cards.every((c: Card) => c.isFlipped);
      if (allFlipped && !this.state.lastRoundInitiator) {
        this.state.lastRoundInitiator = this.state.currentTurn;
      }
    }

    const playerIds: string[] = Array.from(this.state.players.keys());
    const currentPlayerIndex = playerIds.indexOf(this.state.currentTurn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
    this.state.currentTurn = playerIds[nextPlayerIndex];

    // After a player's move ends, if the draw pile is empty, reshuffle discard (except top card).
    if (this.state.drawPile.length === 0 && this.state.discardPile.length > 1) {
      this.reshuffleDiscardIntoDraw();
    }

    if (this.state.currentTurn === this.state.lastRoundInitiator) {
      this.endRound();
    }
  }

  endRound() {
    this.state.gameState = "round-end";
    this.setMetadata({
      status: "round-end",
      players: this.state.players.size,
      maxClients: this.maxClients,
      name: "my_room",
    }).then(() => updateLobby(this));
    this.state.initiatorScoreDoubled = false;
    let initiatorRoundScore = 0;
    const initiator = this.state.players.get(this.state.lastRoundInitiator!);

    // Flip all cards and calculate round scores
    this.state.players.forEach((player: Player) => {
      player.cards.forEach((c: Card) => {
        if (!c.isFlipped) c.isFlipped = true;
      });
      player.roundScore = player.cards.reduce(
        (sum: number, card: Card) => sum + (card.value === 999 ? 0 : card.value),
        0
      );
    });

    if (initiator) {
      initiatorRoundScore = initiator.roundScore;
    }

    let someoneHasLowerScore = false;
    this.state.players.forEach((player: Player, sessionId: string) => {
      if (sessionId !== this.state.lastRoundInitiator) {
        if (player.roundScore <= initiatorRoundScore) {
          someoneHasLowerScore = true;
        }
      }
    });

    if (initiator) {
      if (someoneHasLowerScore && initiatorRoundScore > 0) {
        initiator.roundScore *= 2;
        this.state.initiatorScoreDoubled = true;
      }
    }

    // Update total game score from round scores
    this.state.players.forEach((player: Player) => {
      player.score += player.roundScore;
      player.readyForNextRound = false;
    });

    this.broadcast("roundEnd", { players: this.state.players });

    const winner: Player | undefined = (Array.from(this.state.players.values()) as Player[]).find(
      (p) => p.score >= 100
    );
    if (winner) {
      this.state.gameState = "game-over";
      this.setMetadata({
        status: "game-over",
        players: this.state.players.size,
        maxClients: this.maxClients,
        name: "my_room",
      }).then(() => updateLobby(this));
      this.broadcast("gameOver", { winner: winner.name });
    }
  }

  checkAllPlayersRevealed() {
    if (this.state.players.size < 2) return;
    const allRevealed = (Array.from(this.state.players.values()) as Player[]).every((p) => p.isReady);
    if (allRevealed) {
      this.determineStartPlayer();
    }
  }

  determineStartPlayer() {
    if (this.state.gameState !== "starting") return;

    let maxScore = -Infinity;
    let startPlayerId = "";
    let playersWithMaxScore: string[] = [];

    this.state.players.forEach((player: Player, sessionId: string) => {
      const initialScore = player.cards
        .filter((card: Card) => card.isFlipped)
        .reduce((sum: number, card: Card) => sum + card.value, 0);

      if (initialScore > maxScore) {
        maxScore = initialScore;
        playersWithMaxScore = [sessionId];
      } else if (initialScore === maxScore) {
        playersWithMaxScore.push(sessionId);
      }
    });

    // If there's a tie, pick one randomly
    startPlayerId = playersWithMaxScore[Math.floor(Math.random() * playersWithMaxScore.length)];

    this.state.currentTurn = startPlayerId;
    this.state.gameState = "playing";
    this.setMetadata({
      status: "playing",
      players: this.state.players.size,
      maxClients: this.maxClients,
      name: "my_room",
    }).then(() => updateLobby(this));
    this.broadcast("gameStart", { startPlayerId });
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(client.sessionId, "joined!");

    // Disallow joining if the game is in progress
    if (this.state.gameState !== "waiting") {
      // This is a new player trying to join a game in progress, reject them.
      // Reconnections are handled by `allowReconnection` and don't trigger `onJoin` for the same session.
      throw new Error("Game has already started.");
    }

    if (this.state.players.size === 0) {
      this.state.hostId = client.sessionId;
    }

    const player = new Player();
    player.name = options.playerName || "Player";
    player.isReady = false;
    player.connected = true;

    this.state.players.set(client.sessionId, player);
    this.broadcast("playerJoined", { player, playerId: client.sessionId });
    this.setMetadata({
      status: this.state.gameState,
      players: this.state.players.size,
      maxClients: this.maxClients,
      name: "my_room",
    }).then(() => updateLobby(this));
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
      console.log(client.sessionId, "disconnected.");
    }

    try {
      if (consented) {
        throw new Error("consented leave");
      }

      // allow disconnected client to reconnect into this room until 180 seconds
      await this.allowReconnection(client, 180);

      // client returned! let's re-activate it.
      if (player) {
        player.connected = true;
        console.log(client.sessionId, "reconnected.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // 20 seconds expired. let's remove the client.
      if (player) {
        console.log(client.sessionId, "left permanently.");
        this.state.players.delete(client.sessionId);
        this.broadcast("playerLeft", { playerId: client.sessionId });
        this.setMetadata({
          status: this.state.gameState,
          players: this.state.players.size,
          maxClients: this.maxClients,
          name: "my_room",
        }).then(() => updateLobby(this));

        // If the host left, assign a new host
        if (client.sessionId === this.state.hostId && this.state.players.size > 0) {
          const newHostId = this.state.players.keys().next().value;
          if (newHostId) {
            this.state.hostId = newHostId;
            this.broadcast("newHost", { hostId: newHostId });
          }
        }

        if (this.state.currentTurn === client.sessionId) {
          this.endTurn(); // Properly handle turn change
        }

        if (
          this.state.players.size < 2 &&
          (this.state.gameState === "playing" || this.state.gameState === "starting")
        ) {
          this.state.gameState = "waiting";
          this.state.currentTurn = "";
          // Reset player ready states
          this.state.players.forEach((p: Player) => (p.isReady = false));
          this.broadcast("gameReset");
          this.setMetadata({
            status: "waiting",
            players: this.state.players.size,
            maxClients: this.maxClients,
            name: "my_room",
          }).then(() => updateLobby(this));
        } else if (this.state.players.size === 0) {
          this.state.gameState = "waiting";
          this.setMetadata({
            status: "waiting",
            players: this.state.players.size,
            maxClients: this.maxClients,
            name: "my_room",
          }).then(() => updateLobby(this));
        }
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  startNextRound() {
    this.state.players.forEach((p: Player) => {
      p.roundScore = 0;
      p.readyForNextRound = false;
    });

    this.resetGame();
    this.state.gameState = "starting";
    this.setMetadata({
      status: "starting",
      players: this.state.players.size,
      maxClients: this.maxClients,
      name: "my_room",
    }).then(() => updateLobby(this));
    this.broadcast("gameStarting");
  }

  checkAllPlayersReadyForNextRound() {
    if (this.state.gameState !== "round-end") return;

    const allReady = (Array.from(this.state.players.values()) as Player[]).every((p) => p.readyForNextRound);

    if (allReady && this.state.players.size > 0) {
      // All players are ready, start countdown
      let countdown = 5;
      this.broadcast("nextRoundCountdown", countdown);

      const interval = this.clock.setInterval(() => {
        countdown--;
        this.broadcast("nextRoundCountdown", countdown);
        if (countdown <= 0) {
          interval.clear();
          this.startNextRound();
        }
      }, 1000);
    }
  }

  // Take all but the last card from discard pile, turn them face-down, shuffle and restock draw pile.
  private reshuffleDiscardIntoDraw() {
    const numberToTake = this.state.discardPile.length - 1;
    if (numberToTake <= 0) return;
    const toReshuffle = this.state.discardPile.splice(0, numberToTake);
    toReshuffle.forEach((c: Card) => {
      c.isFlipped = false;
    });
    // Simple shuffle
    for (let i = toReshuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [toReshuffle[i], toReshuffle[j]] = [toReshuffle[j], toReshuffle[i]];
    }
    this.state.drawPile.push(...toReshuffle);
    this.broadcast("chat", "(System) The discard pile has been reshuffled into the draw pile.");
  }
}
