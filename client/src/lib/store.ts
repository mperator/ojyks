import { create } from 'zustand';
import { Room } from 'colyseus.js';
import { State, Player, Card } from '../../../server/src/rooms/MyRoom';

import client from './colyseus';

interface GameState {
  room: Room<State> | null;
  players: Record<string, Player>;
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: string | null;
  gameState: string;
  hostId: string | null;
  lastRoundInitiator: string | null;
  drawnCard: Card | null;
  messages: string[];
  winner: string | null;
  scores: Record<string, number> | null;
  countdown: number | null;
  initiatorScoreDoubled: boolean;
  createRoom: (playerName: string) => Promise<string | undefined>;
  joinRoom: (roomId: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  setReady: (isReady: boolean) => void;
  setReadyForNextRound: (isReady: boolean) => void;
  startGame: () => void;
  revealInitialCard: (index: number) => void;
  discardDrawnCard: () => void;
  setRoom: (room: Room<State>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  room: null,
  players: {},
  drawPile: [],
  discardPile: [],
  currentTurn: null,
  gameState: 'waiting',
  hostId: null,
  lastRoundInitiator: null,
  drawnCard: null,
  messages: [],
  winner: null,
  scores: null,
  countdown: null,
  initiatorScoreDoubled: false,
  createRoom: async (playerName) => {
    try {
      const room = await client.create<State>("my_room", { playerName });
      sessionStorage.setItem('reconnectionToken', room.reconnectionToken);
      console.log("created room with id:", room.roomId);
      set({ room });
      get().setRoom(room);
      return room.roomId;
    } catch (e) {
      console.error("Failed to create room", e);
    }
  },
  joinRoom: async (roomId, playerName) => {
    // check for reconnection token
    const reconnectionToken = sessionStorage.getItem('reconnectionToken');
    if (reconnectionToken) {
      try {
        const room = await client.reconnect<State>(reconnectionToken);
        sessionStorage.setItem('reconnectionToken', room.reconnectionToken);
        console.log("reconnect", reconnectionToken)
        set({ room });
        get().setRoom(room);
        return;
      } catch (e) {
        console.error(`Failed to reconnect to room ${roomId}`, e);
         sessionStorage.removeItem('reconnectionToken');
      }
    }

    try {
      const room = await client.joinById<State>(roomId, { playerName });
      sessionStorage.setItem('reconnectionToken', room.reconnectionToken);
        console.log("join",reconnectionToken)

      set({ room });
      get().setRoom(room);
    } catch (e) {
      console.error(`Failed to join room ${roomId}`, e);
    }
  },
  leaveRoom: () => {
    sessionStorage.removeItem('reconnectionToken');
    console.log("leave");
    const { room } = get();
    if (room) {
      room.leave(true);

    }
    // Reset state on leave
    // set({ room: null, players: {}, messages: [], drawnCard: null, currentTurn: null, gameState: 'waiting', winner: null, scores: null, hostId: null });
  },
  sendMessage: (message) => {
    const { room } = get();
    if (room) {
      room.send("chat", message);
    }
  },
  setReady: (isReady: boolean) => {
    get().room?.send("playerReady", { isReady });
  },
  setReadyForNextRound: (isReady: boolean) => {
    get().room?.send("setReadyForNextRound", { isReady });
  },
  startGame: () => {
    get().room?.send("startGame");
  },
  revealInitialCard: (index: number) => {
    get().room?.send("revealInitialCard", index);
  },
  discardDrawnCard: () => {
    get().room?.send("discardDrawnCard");
  },
  setRoom: (room) => {
    room.onStateChange((state) => {
      const players: Record<string, Player> = {};
      state.players.forEach((player, sessionId) => {
        players[sessionId] = player;
      });
      set({
        players,
        drawPile: Array.from(state.drawPile),
        discardPile: Array.from(state.discardPile),
        currentTurn: state.currentTurn,
        gameState: state.gameState,
        hostId: state.hostId,
        lastRoundInitiator: state.lastRoundInitiator,
        drawnCard: state.drawnCard,
        initiatorScoreDoubled: state.initiatorScoreDoubled,
      });
    });

    room.onMessage("chat", (message) => {
      set((state) => ({ messages: [...state.messages, message] }));
    });

    room.onMessage("gameStarting", () => {
        console.log("Game is starting! Reveal your cards.");
        set({ gameState: 'starting' });
    });

    room.onMessage("gameStart", ({ startPlayerId }) => {
        console.log("Game is starting! First turn:", startPlayerId);
        set({ gameState: 'playing' });
    });

    room.onMessage("roundEnd", ({ players }) => {
        console.log("Round ended. Scores:", players);
        set({ gameState: 'round-end' });
    });

    room.onMessage("playerReadyForNextRound", ({ playerId, isReady }) => {
        set(state => {
            const players = { ...state.players };
            if (players[playerId]) {
                players[playerId].readyForNextRound = isReady;
            }
            return { players };
        });
    });

    room.onMessage("nextRoundCountdown", (countdown) => {
        set({ countdown });
    });

     room.onMessage("gameOver", ({ winner }) => {
        console.log("Game Over! Winner:", winner);
        set({ winner });
    });

    room.onMessage("newRound", () => {
        console.log("Starting a new round...");
        set({ gameState: 'waiting', winner: null, scores: null, drawnCard: null, currentTurn: null });
    });

     room.onMessage("gameReset", () => {
        console.log("Game reset to waiting lobby.");
        set({ gameState: 'waiting', winner: null, scores: null, drawnCard: null, currentTurn: null });
    });

    room.onLeave(() => {
      // State is reset in leaveRoom now
      set({ room: null });
    });
  },
}));

