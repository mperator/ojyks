import { create } from 'zustand';
import { Room, Client } from 'colyseus.js';
import { State, Player, Card } from '../../../server/src/rooms/MyRoom';

interface GameState {
  client: Client | null;
  room: Room<State> | null;
  players: Record<string, Player>;
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: string | null;
  gameState: string;
  lastRoundInitiator: string | null;
  drawnCard: Card | null;
  messages: string[];
  winner: string | null;
  scores: Record<string, number> | null;
  connect: (playerName: string) => Promise<void>;
  createRoom: (playerName: string) => Promise<string | undefined>;
  joinRoom: (roomId: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  setRoom: (room: Room<State>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  client: null,
  room: null,
  players: {},
  drawPile: [],
  discardPile: [],
  currentTurn: null,
  gameState: 'waiting',
  lastRoundInitiator: null,
  drawnCard: null,
  messages: [],
  winner: null,
  scores: null,
  connect: async (playerName) => {
    try {
      if (get().client) return;
      const client = new Client("ws://localhost:3001");
      set({ client });
    } catch (e) {
      console.error("Failed to connect to server", e);
    }
  },
  createRoom: async (playerName) => {
    const client = get().client;
    if (!client) {
        await get().connect(playerName);
    }
    try {
      const room = await get().client!.create<State>("my_room", { playerName });
      set({ room });
      get().setRoom(room);
      return room.roomId;
    } catch (e) {
      console.error("Failed to create room", e);
    }
  },
  joinRoom: async (roomId, playerName) => {
    const client = get().client;
    if (!client) {
        await get().connect(playerName);
    }
    try {
      const room = await get().client!.joinById<State>(roomId, { playerName });
      set({ room });
      get().setRoom(room);
    } catch (e) {
      console.error(`Failed to join room ${roomId}`, e);
    }
  },
  leaveRoom: () => {
    const { room } = get();
    if (room) {
      room.leave();
    }
    // Reset state on leave
    set({ room: null, players: {}, messages: [], drawnCard: null, currentTurn: null, gameState: 'waiting', winner: null, scores: null });
  },
  sendMessage: (message) => {
    const { room } = get();
    if (room) {
      room.send("chat", message);
    }
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
        lastRoundInitiator: state.lastRoundInitiator,
        drawnCard: state.drawnCard,
      });
    });

    room.onMessage("chat", (message) => {
      set((state) => ({ messages: [...state.messages, message] }));
    });

    room.onMessage("gameStart", ({ startPlayerId }) => {
        console.log("Game is starting! First turn:", startPlayerId);
        set({ gameState: 'playing' });
    });

    room.onMessage("gameEnd", ({ scores }) => {
        console.log("Round ended. Scores:", scores);
        const finalScores: Record<string, number> = {};
        scores.forEach((player: Player, id: string) => {
            finalScores[id] = player.score;
        });
        set({ gameState: 'finished', scores: finalScores });
    });

     room.onMessage("gameOver", ({ winner }) => {
        console.log("Game Over! Winner:", winner);
        set({ winner });
    });

    room.onLeave(() => {
      // State is reset in leaveRoom now
      set({ room: null });
    });
  },
}));
