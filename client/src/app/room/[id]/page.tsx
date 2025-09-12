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
  const { joinRoom, room, gameState, leaveRoom } = useGameStore();

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

    const reconnectionToken = sessionStorage.getItem("reconnectionToken");
    if (!reconnectionToken) {
      router.push("/");
      return;
    }

    if (!room) {
      joinRoom(id, playerName).catch((e) => {
         router.push("/");
        return;
      });
    }

    return () => {
      // leaveRoom is handled by button click or browser close
    };
  }, [id, joinRoom, room, router]);

  // Leave functionality handled inside GameBoard sidebar now.

  if (!room) {
    return <div>Joining room...</div>;
  }

  const handleLeave = () => {
    leaveRoom();
    router.push("/");
  };

  const renderGameState = () => {
    switch (gameState) {
      case "waiting":
        return <Lobby />;
      case "starting":
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
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs sm:text-sm text-slate-300 font-mono truncate pr-4">Room: {room?.roomId}</div>
          <button
            onClick={handleLeave}
            className="inline-flex items-center rounded-full bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-semibold shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Leave Room
          </button>
        </div>
        {renderGameState()}
      </div>
    </div>
  );
}

// Scoreboard & Chat removed: now handled within GameBoard sidebar tabs
