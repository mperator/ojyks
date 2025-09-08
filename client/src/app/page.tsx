"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const router = useRouter();
  const { createRoom, joinRoom } = useGameStore();

  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
  }, []);

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
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-800 text-white">
      <h1 className="text-4xl font-bold mb-8">Ojyks</h1>
      <div className="flex flex-col items-center bg-gray-700 p-8 rounded-lg">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => handlePlayerNameChange(e.target.value)}
          className="px-4 py-2 mb-4 text-black rounded w-64 text-center"
        />
        <button
          onClick={handleCreateRoom}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 w-64"
        >
          Create Room
        </button>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomIdToJoin}
            onChange={(e) => setRoomIdToJoin(e.target.value)}
            className="px-4 py-2 mr-2 text-black rounded-l"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r"
          >
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}

