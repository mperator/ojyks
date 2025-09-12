"use client";

import { useGameStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isJoiningOrCreating, setIsJoiningOrCreating] = useState(false);
  const [reconnectRoomId, setReconnectRoomId] = useState<string | null>(null);
  const router = useRouter();
  const { createRoom, joinRoom, joinLobby, availableRooms, createOrJoinFromLobby } = useGameStore();

  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedPlayerName) setPlayerName(savedPlayerName);
    joinLobby();
  }, [joinLobby]);

  useEffect(() => {
    const reconnectionToken = sessionStorage.getItem("reconnectionToken");
    if (reconnectionToken) {
      const [roomId] = reconnectionToken.split(":");
      if (roomId && availableRooms.some((room) => room.roomId === roomId)) {
        setReconnectRoomId(roomId);
      } else {
        setReconnectRoomId(null);
      }
    }
  }, [availableRooms]);

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem("playerName", name);
  };

  const handleCreateRoom = async () => {
    if (isJoiningOrCreating) return;
    if (!playerName) return alert("Please enter a player name.");
    setIsJoiningOrCreating(true);
    try {
      const newRoomId = await createRoom(playerName);
      if (newRoomId) router.push(`/room/${newRoomId}`);
    } catch (e) {
      console.error("create room error", e);
      setIsJoiningOrCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (isJoiningOrCreating) return;
    if (!playerName) return alert("Please enter a player name.");
    if (!roomIdToJoin) return alert("Please enter a room ID.");
    setIsJoiningOrCreating(true);
    try {
      await joinRoom(roomIdToJoin, playerName);
      router.push(`/room/${roomIdToJoin}`);
    } catch (e) {
      console.error("join error", e);
      setIsJoiningOrCreating(false);
    }
  };

  const handleReconnect = async () => {
    if (reconnectRoomId && playerName) {
      if (isJoiningOrCreating) return;
      setIsJoiningOrCreating(true);
      try {
        await joinRoom(reconnectRoomId, playerName);
        router.push(`/room/${reconnectRoomId}`);
      } catch (e) {
        console.error("reconnect error", e);
        setIsJoiningOrCreating(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-6 text-slate-100 md:px-6 md:py-10">
      {reconnectRoomId && (
        <div className="fixed top-0 right-0 left-0 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-center text-sm font-semibold text-white shadow-lg">
          <span>You have an active game! Click here to jump back in.</span>
          <button
            onClick={handleReconnect}
            disabled={isJoiningOrCreating}
            className="ml-4 inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoiningOrCreating ? "Reconnecting..." : "Reconnect"}
          </button>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 pt-16 sm:gap-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="bg-gradient-to-r from-indigo-300 via-emerald-300 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-4xl">
            Ojyks
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">Create or join a lobby to begin.</p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Player Info Panel */}
          <section className="w-full space-y-5 rounded-2xl border border-slate-600/60 bg-slate-800/95 p-5 shadow-xl ring-1 ring-white/5 sm:p-6 lg:w-1/3">
            <h2 className="text-base font-semibold tracking-tight text-indigo-300 sm:text-lg">Your Info</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => handlePlayerNameChange(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/40 px-4 py-2 text-center text-sm font-medium text-slate-100 placeholder-slate-400 shadow-inner focus:ring-2 focus:ring-indigo-400/40 focus:outline-none"
                aria-label="Player name"
              />
              <button
                onClick={handleCreateRoom}
                disabled={!playerName || isJoiningOrCreating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                aria-disabled={!playerName || isJoiningOrCreating}
              >
                {isJoiningOrCreating ? "Creating..." : "Create New Room"}
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomIdToJoin}
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  className="w-full rounded-lg border border-slate-600/50 bg-slate-700/40 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-400 shadow-inner focus:ring-2 focus:ring-indigo-400/40 focus:outline-none"
                  aria-label="Room ID to join"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName || !roomIdToJoin || isJoiningOrCreating}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                  aria-disabled={!playerName || !roomIdToJoin || isJoiningOrCreating}
                >
                  {isJoiningOrCreating ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400/80">
              Tip: You can rejoin a previous room from the same browser session automatically using your reconnection
              token.
            </p>
          </section>

          {/* Rooms Table */}
          <section className="w-full rounded-2xl border border-slate-600/60 bg-slate-800/95 p-5 shadow-xl ring-1 ring-white/5 sm:p-6 lg:w-2/3">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold tracking-tight text-indigo-300 sm:text-lg">Open Lobbies</h2>
                <span className="inline-flex items-center rounded-full bg-slate-600/30 px-2 py-0.5 text-[11px] font-medium text-slate-300 ring-1 ring-slate-500/40 ring-inset">
                  {availableRooms.length} listed
                </span>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="space-y-3 md:hidden" aria-live="polite">
              {availableRooms.map((r) => {
                const full = r.clients >= (r.metadata?.maxClients ?? r.maxClients ?? 8);
                const isReconnectable = r.roomId === reconnectRoomId;
                return (
                  <div
                    key={r.roomId}
                    className="relative flex items-center justify-between gap-4 rounded-xl border border-slate-600/60 bg-slate-700/40 px-4 py-3 shadow-inner"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] text-slate-300">{r.roomId}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>
                          {r.clients} / {r.metadata?.maxClients ?? r.maxClients ?? 8}
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-600/50 px-1.5 py-0.5 font-medium text-slate-300 capitalize">
                          {r.metadata?.status || "unknown"}
                        </span>
                      </div>
                    </div>
                    {isReconnectable ? (
                      <button
                        disabled={!playerName || isJoiningOrCreating}
                        onClick={handleReconnect}
                        className="shrink-0 rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                      >
                        {isJoiningOrCreating ? "..." : "Reconnect"}
                      </button>
                    ) : (
                      <button
                        disabled={full || !playerName || isJoiningOrCreating || r.metadata?.status !== "waiting"}
                        onClick={async () => {
                          if (isJoiningOrCreating) return;
                          setIsJoiningOrCreating(true);
                          try {
                            await createOrJoinFromLobby(playerName, r.roomId);
                            router.push(`/room/${r.roomId}`);
                          } catch (error) {
                            console.error("Failed to join from lobby", error);
                            setIsJoiningOrCreating(false);
                          }
                        }}
                        className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                      >
                        {isJoiningOrCreating ? "..." : full ? "Full" : "Join"}
                      </button>
                    )}
                  </div>
                );
              })}
              {availableRooms.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-600/60 bg-slate-700/20 px-4 py-8 text-center text-xs text-slate-400">
                  No open rooms. Create one!
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-600/50 shadow ring-1 ring-white/5 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-700/60 text-xs tracking-wider text-slate-300 uppercase">
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
                    const isReconnectable = r.roomId === reconnectRoomId;
                    return (
                      <tr key={r.roomId} className={`${rowBg} transition-colors hover:bg-slate-700/40`}>
                        <td className="px-4 py-3 font-mono text-xs md:text-sm">{r.roomId}</td>
                        <td className="px-4 py-3 text-xs md:text-sm">
                          {r.clients} / {r.metadata?.maxClients ?? r.maxClients ?? 8}
                        </td>
                        <td className="px-4 py-3 text-xs capitalize md:text-sm">{r.metadata?.status || "unknown"}</td>
                        <td className="px-4 py-3">
                          {isReconnectable ? (
                            <button
                              disabled={!playerName || isJoiningOrCreating}
                              onClick={handleReconnect}
                              className="inline-flex items-center justify-center rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                            >
                              {isJoiningOrCreating ? "Reconnecting..." : "Reconnect"}
                            </button>
                          ) : (
                            <button
                              disabled={full || !playerName || isJoiningOrCreating || r.metadata?.status !== "waiting"}
                              onClick={async () => {
                                if (isJoiningOrCreating) return;
                                setIsJoiningOrCreating(true);
                                try {
                                  await createOrJoinFromLobby(playerName, r.roomId);
                                  router.push(`/room/${r.roomId}`);
                                } catch (error) {
                                  console.error("Failed to join from lobby", error);
                                  setIsJoiningOrCreating(false);
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                            >
                              {isJoiningOrCreating ? "Joining..." : full ? "Full" : "Join"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {availableRooms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                        No open rooms. Create one!
                      </td>
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
