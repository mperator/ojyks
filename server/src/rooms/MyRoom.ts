import { Room, Client } from "colyseus";
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

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
  score: number = 0;

  @type("boolean")
  isReady: boolean = false;
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
  gameState: string = "waiting"; // waiting, starting, playing, finished

  @type("string")
  hostId: string = "";

  @type("string")
  lastRoundInitiator: string | null = null;

  @type(Card)
  drawnCard: Card | null = null;
}

export class MyRoom extends Room<State> {

  maxClients = 8;

  onCreate (options: any) {
    this.setState(new State());

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
        if (client.sessionId !== this.state.hostId || this.state.gameState !== "waiting") {
            return; // Only host can start, and only in waiting state
        }

        const allPlayersReady = Array.from(this.state.players.values()).every(p => p.isReady);
        if (this.state.players.size >= 2 && allPlayersReady) {
            this.resetGame(); // Deal cards and set up piles
            this.state.gameState = "starting";
            this.broadcast("gameStarting");
        }
    });

    this.onMessage("revealInitialCard", (client, cardIndex: number) => {
        const player = this.state.players.get(client.sessionId);
        if (this.state.gameState !== "starting" || !player) return;

        const flippedCount = player.cards.filter(c => c.isFlipped).length;
        if (flippedCount >= 2) return;

        if (player.cards[cardIndex] && !player.cards[cardIndex].isFlipped) {
            player.cards[cardIndex].isFlipped = true;

            const newFlippedCount = player.cards.filter(c => c.isFlipped).length;
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
        if (this.state.drawPile.length === 0) {
            // Reshuffle discard pile into draw pile
            const discard = this.state.discardPile.splice(0, this.state.discardPile.length -1);
            discard.forEach(c => c.isFlipped = false);
            this.state.drawPile.push(...discard);
            this.state.drawPile.sort(() => Math.random() - 0.5);
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

        const card = this.state.discardPile.pop();
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
        // The player must now flip a card, but we don't end the turn yet.
        // The client will be responsible for sending a "flipCard" message next.
        // This is a slight deviation from the rules for simplicity, we'll combine the actions.
        // Let's adjust: the client will send which card to flip along with this message.
    });

     this.onMessage("discardAndFlip", (client, cardIndex: number) => {
        if (this.state.currentTurn !== client.sessionId || !this.state.drawnCard) return;
        const player = this.state.players.get(client.sessionId);
        if (!player || !player.cards[cardIndex] || player.cards[cardIndex].isFlipped) return;

        this.state.discardPile.push(this.state.drawnCard);
        console.log(`Cards on discard pile: ${this.state.discardPile.length}`);
        this.state.drawnCard = null;

        player.cards[cardIndex].isFlipped = true;
        this.checkForColumn(player);
        this.endTurn();
    });
  }

  resetGame() {
    // Reset player ready state for the new round
    this.state.players.forEach(p => p.isReady = false);

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
    this.state.players.forEach(player => {
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

          if(card1.value === 999 || card2.value === 999 || card3.value === 999) continue; // Skip empty placeholders    

          if (card1 && card2 && card3 && card1.isFlipped && card2.isFlipped && card3.isFlipped &&
              card1.value === card2.value && card2.value === card3.value)
          {
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
              const emptyCard1 = new Card(); emptyCard1.value = 999; emptyCard1.isFlipped = true;
              const emptyCard2 = new Card(); emptyCard2.value = 999; emptyCard2.isFlipped = true;
              const emptyCard3 = new Card(); emptyCard3.value = 999; emptyCard3.isFlipped = true;
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
          const allFlipped = currentPlayer.cards.every(c => c.isFlipped);
          if (allFlipped && !this.state.lastRoundInitiator) {
              this.state.lastRoundInitiator = this.state.currentTurn;
          }
      }

      const playerIds = Array.from(this.state.players.keys());
      const currentPlayerIndex = playerIds.indexOf(this.state.currentTurn);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      this.state.currentTurn = playerIds[nextPlayerIndex];

      if (this.state.currentTurn === this.state.lastRoundInitiator) {
          this.endGame();
      }
  }

  endGame() {
      this.state.gameState = "finished";
      let initiatorScore = 0;
      const initiator = this.state.players.get(this.state.lastRoundInitiator!);

      if (initiator) {
          initiator.cards.forEach(c => {
              if (!c.isFlipped) c.isFlipped = true;
          });
          initiatorScore = initiator.cards.reduce((sum, card) => sum + (card.value === 999 ? 0 : card.value), 0);
      }

      let someoneHasLowerScore = false;
      this.state.players.forEach((player, sessionId) => {
          if (sessionId === this.state.lastRoundInitiator) return;
          player.cards.forEach(c => {
              if (!c.isFlipped) c.isFlipped = true;
          });
          const playerScore = player.cards.reduce((sum, card) => sum + (card.value === 999 ? 0 : card.value), 0);
          player.score += playerScore;
          if (playerScore <= initiatorScore) {
              someoneHasLowerScore = true;
          }
      });

      if (initiator) {
          if (someoneHasLowerScore && initiatorScore > 0) {
              initiator.score += initiatorScore * 2;
          } else {
              initiator.score += initiatorScore;
          }
      }

      this.broadcast("gameEnd", { scores: this.state.players });

      // Check for winner
      const winner = Array.from(this.state.players.values()).find(p => p.score >= 100);
      if (winner) {
          this.broadcast("gameOver", { winner: winner.name });
          // lock room?
      } else {
          // Schedule next round
          setTimeout(() => {
            this.state.gameState = "waiting";
            this.broadcast("newRound");
          }, 10000);
      }
  }

  checkAllPlayersRevealed() {
      if (this.state.players.size < 2) return;
      const allRevealed = Array.from(this.state.players.values()).every(p => p.isReady);
      if (allRevealed) {
          this.determineStartPlayer();
      }
  }

  determineStartPlayer() {
      if (this.state.gameState !== "starting") return;

      let maxScore = -Infinity;
      let startPlayerId = "";
      let playersWithMaxScore: string[] = [];

      this.state.players.forEach((player, sessionId) => {
          const initialScore = player.cards
              .filter(card => card.isFlipped)
              .reduce((sum, card) => sum + card.value, 0);

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
      this.broadcast("gameStart", { startPlayerId });
  }


  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    if (this.state.players.size === 0) {
        this.state.hostId = client.sessionId;
    }

    const player = new Player();
    player.name = options.playerName || "Player";
    player.isReady = false;

    this.state.players.set(client.sessionId, player);
    this.broadcast("playerJoined", { player, playerId: client.sessionId });
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    const playerLeft = this.state.players.get(client.sessionId);
    if (playerLeft) {
        // Return cards to draw pile if game is in progress
        if (this.state.gameState === "playing" || this.state.gameState === "starting") {
            playerLeft.cards.forEach(card => {
                if (card.value !== 999) { // Don't return empty placeholders
                    this.state.drawPile.push(card)
                }
            });
            this.state.drawPile.sort(() => Math.random() - 0.5); // Re-shuffle
        }
    }

    this.state.players.delete(client.sessionId);
    this.broadcast("playerLeft", { playerId: client.sessionId });

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

    if (this.state.players.size < 2 && (this.state.gameState === "playing" || this.state.gameState === "starting")) {
        this.state.gameState = "waiting";
        this.state.currentTurn = "";
        // Reset player ready states
        this.state.players.forEach(p => p.isReady = false);
        this.broadcast("gameReset");
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
