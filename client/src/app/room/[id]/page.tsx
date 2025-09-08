"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import GameBoard from "./GameBoard";
import Chat from "./Chat";
import Lobby from "./Lobby";
import RoundEndDisplay from "./RoundEndDisplay";

export default function RoomPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const {
    joinRoom,
    room,
    leaveRoom,
    gameState,
  } = useGameStore();

  useEffect(() => {
    if (!id) {
      router.push("/");
      return;
    }

    const playerName = localStorage.getItem("playerName");
    if (!playerName) {
      router.push("/");
      return;
    }

    const reconnectionToken = sessionStorage.getItem('reconnectionToken');
    if (!room && reconnectionToken) {
        joinRoom(id, playerName);
    }

    return () => {
      // leaveRoom is handled by button click or browser close
    };
  }, [id, joinRoom, room, router]);

  const handleLeave = () => {
    leaveRoom();
    router.push("/");
  };

  if (!room) {
    return <div>Joining room...</div>;
  }

  const renderGameState = () => {
    switch (gameState) {
      case "waiting":
        return <Lobby />;
      case "starting":
        return (
            <div>
                <h2 className="text-xl text-center mb-4">Game is starting!</h2>
                <p className="text-center mb-4">Reveal two of your cards.</p>
                <GameBoard />
            </div>
        );
      case "playing":
        return <GameBoard />;
      case "round-end":
      case "game-over":
        return <RoundEndDisplay />;
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="flex h-screen p-4 bg-gray-800 text-white">
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Room: {id}</h1>
            <button
                onClick={handleLeave}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Leave Room
            </button>
        </div>
        {renderGameState()}
      </div>
      <div className="w-1/4 ml-4">
        <Chat />
        <Scoreboard />
      </div>
    </div>
  );
}

const Scoreboard = () => {
    const { players } = useGameStore();
    return (
        <div className="bg-gray-700 p-4 rounded-lg mt-4">
            <h2 className="text-xl font-bold mb-2">Scoreboard</h2>
            <ul>
                {Object.values(players).map(p => (
                    <li key={p.name} className="flex justify-between">
                        <span>{p.name}</span>
                        <span>{p.score}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
