"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const router = useRouter();
  const { createRoom, joinRoom, joinLobby, availableRooms, createOrJoinFromLobby } = useGameStore();

  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
    // join lobby once
    joinLobby();
  }, [joinLobby]);

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem("playerName", name);
  };

  const handleCreateRoom = async () => {
    if (!playerName) {
      alert("Please enter a player name.");
      return;
    }
    try {
      const newRoomId = await createRoom(playerName);
      if (newRoomId) {
        router.push(`/room/${newRoomId}`);
      }
    } catch (e) {
      console.error("create room error", e);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName) {
      alert("Please enter a player name.");
      return;
    }
    if (!roomIdToJoin) {
      alert("Please enter a room ID.");
      return;
    }
    try {
      await joinRoom(roomIdToJoin, playerName);
      router.push(`/room/${roomIdToJoin}`);
    } catch (e) {
      console.error("join error", e);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-10 bg-gray-800 text-white space-y-8">
      <h1 className="text-4xl font-bold">Ojyks</h1>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
        {/* Player Name & Actions */}
        <div className="bg-gray-700 p-6 rounded-lg w-full lg:w-1/3 space-y-4">
          <h2 className="text-2xl font-semibold">Your Info</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => handlePlayerNameChange(e.target.value)}
            className="px-4 py-2 text-black rounded w-full text-center"
          />
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-900 text-white font-bold py-2 px-4 rounded w-full"
            disabled={!playerName}
          >
            Create New Room
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Room ID"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              className="px-4 py-2 text-black rounded w-full"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-900 text-white font-bold py-2 px-4 rounded"
              disabled={!playerName || !roomIdToJoin}
            >
              Join
            </button>
          </div>
        </div>
        {/* Available Rooms Table */}
        <div className="bg-gray-700 p-6 rounded-lg w-full lg:w-2/3 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Open Lobbies</h2>
            <span className="text-sm opacity-75">{availableRooms.length} listed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-600 text-left">
                  <th className="py-2 px-3">Room ID</th>
                  <th className="py-2 px-3">Players</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {availableRooms.map(r => (
                  <tr key={r.roomId} className="border-t border-gray-600 hover:bg-gray-600/50">
                    <td className="py-2 px-3 font-mono">{r.roomId}</td>
                    <td className="py-2 px-3">{r.clients} / {r.metadata?.maxClients ?? r.maxClients ?? 8}</td>
                    <td className="py-2 px-3 capitalize">{r.metadata?.status || 'unknown'}</td>
                    <td className="py-2 px-3">
                      <button
                        disabled={r.clients >= (r.metadata?.maxClients ?? r.maxClients ?? 8) || !playerName}
                        onClick={async () => {
                          await createOrJoinFromLobby(playerName, r.roomId);
                          router.push(`/room/${r.roomId}`);
                        }}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-1 px-3 rounded text-xs"
                      >Join</button>
                    </td>
                  </tr>
                ))}
                {availableRooms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 opacity-70">No open rooms. Create one!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

