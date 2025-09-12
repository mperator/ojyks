"use client";

import { useGameStore } from "@/lib/store";
import { useState } from "react";

const Chat = () => {
  const { messages, sendMessage } = useGameStore();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex h-full flex-col rounded bg-gray-700 p-4">
      <h2 className="mb-4 text-xl font-bold">Chat</h2>
      <div className="mb-4 flex-grow overflow-y-auto rounded border bg-gray-800 p-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1 text-sm">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow rounded-l border px-3 py-2 text-black"
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} className="rounded-r bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
