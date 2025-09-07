"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import GameBoard from "./GameBoard";
import Chat from "./Chat";
import Lobby from "./Lobby"; // We will create this component

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

    if (!room) {
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
      case "finished":
        return <GameBoard />;
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
      </div>
    </div>
  );
}
