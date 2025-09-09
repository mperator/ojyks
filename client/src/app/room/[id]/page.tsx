"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import GameBoard from "./GameBoard";
import Lobby from "./Lobby";
import RoundEndDisplay from "./RoundEndDisplay";

export default function RoomPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const {
  joinRoom,
  room,
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

  // Leave functionality handled inside GameBoard sidebar now.

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
        {/* Header removed per request (room name & leave button) */}
        {renderGameState()}
      </div>
    </div>
  );
}

// Scoreboard & Chat removed: now handled within GameBoard sidebar tabs
