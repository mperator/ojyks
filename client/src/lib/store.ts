import { create } from "zustand";
import { Room } from "colyseus.js";
import type { RoomAvailable } from "colyseus.js"; // room listing entries from LobbyRoom
import { State, Player, Card } from "../../../server/src/rooms/MyRoom";

import client from "./colyseus";

interface GameState {
  room: Room<State> | null;
  lobby: Room | null;
  availableRooms: RoomAvailable[];
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
  joinLobby: () => Promise<void>;
  createOrJoinFromLobby: (playerName: string, roomId?: string) => Promise<void>;
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
  lobby: null,
  availableRooms: [],
  players: {},
  drawPile: [],
  discardPile: [],
  currentTurn: null,
  gameState: "waiting",
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
      sessionStorage.setItem("reconnectionToken", room.reconnectionToken);
      console.log("created room with id:", room.roomId);
      set({ room });
      get().setRoom(room);
      return room.roomId;
    } catch (e) {
      console.error("Failed to create room", e);
    }
  },
  joinRoom: async (roomId, playerName) => {
    const { leaveRoom, room: currentr } = get();

    if(currentr) {
      if(currentr.roomId === roomId) {
        console.log("Already in the room", roomId);
        return;
      } else {
        leaveRoom();
      }
    }

    const reconnectionToken = sessionStorage.getItem("reconnectionToken");
    const reconnectionRoomId = reconnectionToken?.split(":")[0];
    // reconnect to the room with the reconnection token
    // what happens if an error happens?

    if (reconnectionToken) {
      try {
        console.log("CurrentR", currentr, currentr?.reconnectionToken);
        
        const room = await client.reconnect<State>(reconnectionToken);
        sessionStorage.setItem("reconnectionToken", room.reconnectionToken);
        console.log("reconnected to room:", room.roomId);

        set({ room });
        get().setRoom(room);

        // Reconnect to the same room
        if (reconnectionRoomId === roomId) {
          return;
        } else {
          // When reconnecting to a different room, leave this room and join the new one
          leaveRoom();
        }
      } catch (e) {
        console.error(`Failed to reconnect to room ${roomId}, will try to join as new.`, e);
        sessionStorage.removeItem("reconnectionToken");
      }
    }

    try {
      const room = await client.joinById<State>(roomId, { playerName });
      sessionStorage.setItem("reconnectionToken", room.reconnectionToken);
      console.log("joined new room:", room.roomId);
      set({ room });
      get().setRoom(room);
    } catch (e) {
      console.error(`Failed to join room ${roomId}`, e);
      // Re-throw the error to be handled by the UI
      throw e;
    }
  },
  leaveRoom: () => {
    sessionStorage.removeItem("reconnectionToken");
    console.log("leave");
    const { room } = get();
    if (room) {
      room.leave(true);
    }
    // Fully reset local client state
    set({
      room: null,
      lobby: null,
      availableRooms: [],
      players: {},
      drawPile: [],
      discardPile: [],
      currentTurn: null,
      gameState: "waiting",
      hostId: null,
      lastRoundInitiator: null,
      drawnCard: null,
      messages: [],
      winner: null,
      scores: null,
      countdown: null,
      initiatorScoreDoubled: false,
    });
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
      // Clear any leftover round / game-over state for a clean start
      set({
        gameState: "starting",
        winner: null,
        scores: null,
        countdown: null,
        lastRoundInitiator: null,
        drawnCard: null,
        initiatorScoreDoubled: false,
      });
    });

    room.onMessage("gameStart", ({ startPlayerId }) => {
      console.log("Game is starting! First turn:", startPlayerId);
      set({ gameState: "playing" });
    });

    room.onMessage("roundEnd", ({ players }) => {
      console.log("Round ended. Scores:", players);
      set({ gameState: "round-end" });
    });

    room.onMessage("playerReadyForNextRound", ({ playerId, isReady }) => {
      set((state) => {
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
      set({
        gameState: "waiting",
        winner: null,
        scores: null,
        drawnCard: null,
        currentTurn: null,
      });
    });

    room.onMessage("gameReset", () => {
      console.log("Game reset to waiting lobby.");
      set({
        gameState: "waiting",
        winner: null,
        scores: null,
        drawnCard: null,
        currentTurn: null,
      });
    });

    room.onLeave(() => {
      // State is reset in leaveRoom now
      set({ room: null });
    });
  },
  joinLobby: async () => {
    try {
      const lobby = await client.joinOrCreate("lobby");
      // initial full rooms list
      lobby.onMessage("rooms", (rooms: RoomAvailable[]) => {
        set({ availableRooms: rooms });
      });
      lobby.onMessage("+", ([roomId, room]: [string, RoomAvailable]) => {
        set((state) => {
          const list = [...state.availableRooms];
          const idx = list.findIndex((r) => r.roomId === roomId);
          if (idx !== -1) list[idx] = room;
          else list.push(room);
          return { availableRooms: list };
        });
      });
      lobby.onMessage("-", (roomId: string) => {
        set((state) => ({
          availableRooms: state.availableRooms.filter(
            (r) => r.roomId !== roomId
          ),
        }));
      });
      set({ lobby });
    } catch (e) {
      console.error("failed to join lobby", e);
    }
  },
  createOrJoinFromLobby: async (playerName, roomId) => {
    if (!playerName) return;
    if (roomId) {
      await get().joinRoom(roomId, playerName);
    } else {
      await get().createRoom(playerName);
    }
  },
}));
