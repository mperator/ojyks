"use client";

import { useGameStore } from "@/lib/store";

export default function Lobby() {
  const { players, room, hostId, setReady, startGame } = useGameStore();
  const isHost = room?.sessionId === hostId;
  const localPlayer = players[room?.sessionId || ""];

  const handleReadyClick = () => {
    if (localPlayer) {
      setReady(!localPlayer.isReady);
    }
  };

  const allPlayersReady = Object.values(players).every(p => p.isReady);
  const canStart = isHost && allPlayersReady && Object.keys(players).length >= 2;

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Lobby</h2>
      <div className="space-y-4">
        {Object.entries(players).map(([id, player]) => (
          <div key={id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
            <span className="font-semibold">{player.name} {id === hostId && "(Host)"}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${player.isReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-800'}`}>
              {player.isReady ? "Ready" : "Not Ready"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center space-y-4">
        {localPlayer && (
          <button
            onClick={handleReadyClick}
            className={`w-full py-3 px-4 rounded font-bold text-white transition-colors ${
              localPlayer.isReady
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {localPlayer.isReady ? "Set Not Ready" : "Set Ready"}
          </button>
        )}
        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full py-3 px-4 rounded font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Start Game ({Object.keys(players).length} / 8)
          </button>
        )}
      </div>
    </div>
  );
}
