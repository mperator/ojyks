"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/colyseus";
import { Room } from "colyseus.js";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

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

  const createRoom = async () => {
    if (!playerName) {
      alert("Please enter a player name.");
      return;
    }
    try {
      const room: Room = await client.create("my_room", { playerName });
      router.push(`/room/${room.roomId}`);
    } catch (e) {
      console.error("join error", e);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!playerName) {
      alert("Please enter a player name.");
      return;
    }
    try {
      const room: Room = await client.joinById(roomId, { playerName });
      router.push(`/room/${room.roomId}`);
    } catch (e) {
      console.error("join error", e);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Ojyks</h1>
      <div className="flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => handlePlayerNameChange(e.target.value)}
          className="px-4 py-2 mb-4 text-black"
        />
        <button
          onClick={createRoom}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
        >
          Create Room
        </button>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Enter Room ID"
            id="room-id-input"
            className="px-4 py-2 mr-2 text-black"
          />
          <button
            onClick={() => {
              const roomIdInput = document.getElementById("room-id-input") as HTMLInputElement;
              if (roomIdInput && roomIdInput.value) {
                joinRoom(roomIdInput.value);
              }
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}

