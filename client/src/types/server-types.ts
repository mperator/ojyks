// Local mirrored types of server-side schema for client-only type safety.
// This avoids importing server code (decorators, Schema classes) into the Next.js bundle.

export const ROOM_NAME = "ojyks_room";

export interface Card {
  value: number; // normal values (-2 .. 12) or 999 for removed placeholders
  isFlipped: boolean;
}

export interface Player {
  name: string;
  cards: Card[]; // Always length 12, placeholders may appear with value 999
  score: number; // cumulative game score
  roundScore: number;
  isReady: boolean;
  readyForNextRound: boolean;
  connected: boolean;
}

// Minimal shape of State we rely on in the client.
// `players` is a MapSchema on the server. We only use `forEach` here, so model that structurally.
export interface PlayersMapLike {
  forEach(cb: (player: Player, sessionId: string) => void): void;
}

export interface State {
  players: PlayersMapLike;
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: string;
  gameState: string; // waiting | starting | playing | round-end | game-over
  hostId: string;
  lastRoundInitiator: string | null;
  initiatorScoreDoubled: boolean;
  drawnCard: Card | null;
}
