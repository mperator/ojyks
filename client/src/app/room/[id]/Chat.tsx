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
        <div className="flex flex-col h-full bg-gray-700 rounded p-4">
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <div className="flex-grow border rounded p-2 mb-4 overflow-y-auto bg-gray-800">
                {messages.map((msg, i) => (
                    <div key={i} className="text-sm mb-1">{msg}</div>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-grow border rounded-l px-3 py-2 text-black"
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
