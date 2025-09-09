"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import React from "react";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const router = useRouter();
  const { createRoom, joinRoom, joinLobby, availableRooms, createOrJoinFromLobby } = useGameStore();

  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedPlayerName) setPlayerName(savedPlayerName);
    joinLobby();
  }, [joinLobby]);

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem("playerName", name);
  };

  const handleCreateRoom = async () => {
    if (!playerName) return alert("Please enter a player name.");
    try {
      const newRoomId = await createRoom(playerName);
      if (newRoomId) router.push(`/room/${newRoomId}`);
    } catch (e) { console.error("create room error", e); }
  };

  const handleJoinRoom = async () => {
    if (!playerName) return alert("Please enter a player name.");
    if (!roomIdToJoin) return alert("Please enter a room ID.");
    try {
      await joinRoom(roomIdToJoin, playerName);
      router.push(`/room/${roomIdToJoin}`);
    } catch (e) { console.error("join error", e); }
  };

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="bg-gradient-to-r from-indigo-300 via-emerald-300 to-amber-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm">
            Ojyks
          </h1>
          <p className="text-sm text-slate-400">Create or join a lobby to begin.</p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Player Info Panel */}
          <section className="w-full space-y-5 rounded-2xl border border-slate-600/60 bg-slate-800/95 p-6 shadow-xl ring-1 ring-white/5 lg:w-1/3">
            <h2 className="text-lg font-semibold tracking-tight text-indigo-300">Your Info</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => handlePlayerNameChange(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/40 px-4 py-2 text-center text-sm font-medium text-slate-100 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
              <button
                onClick={handleCreateRoom}
                disabled={!playerName}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
              >
                Create New Room
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomIdToJoin}
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  className="w-full rounded-lg border border-slate-600/50 bg-slate-700/40 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName || !roomIdToJoin}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                >
                  Join
                </button>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400/80">
              Tip: You can rejoin a previous room from the same browser session automatically using your reconnection token.
            </p>
          </section>

          {/* Rooms Table */}
            <section className="w-full rounded-2xl border border-slate-600/60 bg-slate-800/95 p-6 shadow-xl ring-1 ring-white/5 lg:w-2/3">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-indigo-300">Open Lobbies</h2>
                  <span className="inline-flex items-center rounded-full bg-slate-600/30 px-2 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-500/40">
                    {availableRooms.length} listed
                  </span>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-600/50 shadow ring-1 ring-white/5">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-700/60 text-xs uppercase tracking-wider text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Room ID</th>
                      <th className="px-4 py-3">Players</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/70">
                    {availableRooms.map((r, idx) => {
                      const full = r.clients >= (r.metadata?.maxClients ?? r.maxClients ?? 8);
                      const rowBg = idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10";
                      return (
                        <tr key={r.roomId} className={`${rowBg} transition-colors hover:bg-slate-700/40`}>
                          <td className="px-4 py-3 font-mono text-xs md:text-sm">{r.roomId}</td>
                          <td className="px-4 py-3 text-xs md:text-sm">{r.clients} / {r.metadata?.maxClients ?? r.maxClients ?? 8}</td>
                          <td className="px-4 py-3 text-xs md:text-sm capitalize">{r.metadata?.status || 'unknown'}</td>
                          <td className="px-4 py-3">
                            <button
                              disabled={full || !playerName}
                              onClick={async () => {
                                await createOrJoinFromLobby(playerName, r.roomId);
                                router.push(`/room/${r.roomId}`);
                              }}
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                            >
                              {full ? 'Full' : 'Join'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {availableRooms.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No open rooms. Create one!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
        </div>
      </div>
    </main>
  );
}

