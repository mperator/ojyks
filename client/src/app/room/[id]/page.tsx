"use client";

import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { client } from "@/lib/colyseus";
import { useRouter, useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const id = params.id as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const joinRoom = async () => {
      try {
        const playerName = localStorage.getItem("playerName") || "Anonymous";
        const joinedRoom = await client.joinById(id, { playerName });
        setRoom(joinedRoom);

        joinedRoom.onMessage("chat", (message) => {
          setChatMessages((prev) => [...prev, message]);
        });

        joinedRoom.onLeave(() => {
          router.push("/");
        });

      } catch (e) {
        console.error("join error", e);
        router.push("/");
      }
    };

    joinRoom();

    return () => {
      if (room) {
        room.leave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const sendMessage = () => {
    if (room && message) {
      room.send("chat", message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {id}</h1>
      <div className="flex-grow border rounded p-4 mb-4 overflow-y-auto">
        {chatMessages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow border rounded-l px-4 py-2 text-black"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}
