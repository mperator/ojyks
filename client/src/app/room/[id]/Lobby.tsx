"use client";

import { useGameStore } from "@/lib/store";

export default function Lobby() {
  const { players, room, hostId, setReady, startGame } = useGameStore();
  const sessionId = room?.sessionId || "";
  const isHost = sessionId === hostId;
  const localPlayer = players[sessionId];

  const handleReadyClick = () => {
    if (localPlayer) setReady(!localPlayer.isReady);
  };

  const playerEntries = Object.entries(players);
  const playerCount = playerEntries.length;
  const allPlayersReady = playerCount > 0 && playerEntries.every(([, p]) => p.isReady);
  const canStart = isHost && allPlayersReady && playerCount >= 2;

  return (
    <div className="animate-fade-in mx-auto w-full max-w-3xl rounded-2xl border border-slate-600/60 bg-slate-800 p-6 text-slate-100 shadow-xl">
      <header className="mb-6 flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-indigo-300 drop-shadow-sm">Lobby</h2>
        <p className="text-sm text-slate-300">
          {playerCount < 2 && <span>Waiting for more players to join…</span>}
          {playerCount >= 2 && !allPlayersReady && <span>Players ready up to begin.</span>}
          {allPlayersReady && playerCount >= 2 && <span className="text-emerald-300">All players are ready.</span>}
        </p>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-600/30 px-2 py-0.5 ring-1 ring-slate-500/40 ring-inset">
            Players: <span className="font-semibold text-slate-200">{playerCount}</span>/8
          </span>
          {isHost && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-300 uppercase ring-1 ring-amber-300/30 ring-inset">
              You are Host
            </span>
          )}
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-600/50 shadow ring-1 ring-white/5">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-700/60 text-xs tracking-wider text-slate-300 uppercase">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/70">
            {playerEntries.map(([id, player], idx) => {
              const rowBg = idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10";
              const isLocal = id === sessionId;
              const ready = player.isReady;
              return (
                <tr key={id} className={`${rowBg} transition-colors hover:bg-slate-700/40`}>
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {isLocal ? "You" : player.name}
                      {id === hostId && (
                        <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 uppercase ring-1 ring-amber-300/30 ring-inset">
                          Host
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ready ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30 ring-inset">
                        <span className="text-base leading-none">✅</span> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-slate-400/20 ring-inset">
                        <span className="text-base leading-none">⏳</span> Waiting
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {playerEntries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-400">
                  No players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {localPlayer && (
          <button
            onClick={handleReadyClick}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
              localPlayer.isReady
                ? "bg-slate-600 text-white hover:bg-slate-500"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {localPlayer.isReady ? "Set Not Ready" : "Set Ready"}
          </button>
        )}
        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {canStart ? "Start Game" : "Waiting for readiness"} ({playerCount} / 8)
          </button>
        )}
      </div>
    </div>
  );
}
