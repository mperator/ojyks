import { useGameStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const RoundEndDisplay = () => {
  const {
    players,
    setReadyForNextRound,
    room,
    countdown,
    winner,
    lastRoundInitiator,
    initiatorScoreDoubled,
    leaveRoom,
  } = useGameStore();
  const currentPlayerId = room?.sessionId;
  const router = useRouter();

  const handleReadyClick = () => {
    const player = players[currentPlayerId!];
    if (player) {
      setReadyForNextRound(!player.readyForNextRound);
    }
  };

  const handleExitClick = () => {
    router.push("/");
    leaveRoom();
  };

  if (winner) {
    // Treat the player with the LOWEST total score as the actual winner (lower is better)
    const entries = Object.entries(players);
    const sortedEntries = [...entries].sort((a, b) => a[1].score - b[1].score); // ascending: lowest first
    const [winningSessionId, winningPlayer] = sortedEntries[0] || [];
    const winnerName = winningPlayer?.name;

    return (
      <div className="animate-fade-in mx-auto w-full max-w-3xl rounded-2xl border border-slate-600/60 bg-slate-800 p-6 text-slate-100 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-amber-300 drop-shadow-sm">Game Over</h2>
          <p className="text-lg font-medium text-slate-300">Final Results</p>
        </div>
        <div className="mb-6 rounded-xl border border-slate-600/50 bg-slate-900/40 p-4 shadow-inner">
          <p className="text-center text-2xl font-semibold text-amber-300">
            👑 Winner:{" "}
            <span className="font-bold text-white">{winningSessionId === currentPlayerId ? "You" : winnerName}</span>
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-600/50 shadow">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-700/60 text-xs tracking-wider text-slate-300 uppercase">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/70">
              {sortedEntries.map(([sessionId, player], idx) => {
                const isWinner = sessionId === winningSessionId;
                return (
                  <tr
                    key={sessionId}
                    className={`transition-colors ${isWinner ? "bg-amber-500/10" : idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"} hover:bg-slate-700/40`}
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {sessionId === currentPlayerId ? "You" : player.name}
                        {isWinner && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-300/30 ring-inset">
                            Champion
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-100">{player.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleExitClick}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-4xl rounded-2xl border border-slate-600/60 bg-slate-800 p-6 text-slate-100 shadow-xl">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-indigo-300 drop-shadow-sm">Round Complete</h2>
        <p className="text-sm text-slate-300">Review scores while players ready up for the next round.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-600/50 shadow ring-1 ring-white/5">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-700/60 text-xs tracking-wider text-slate-300 uppercase">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Round</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/70">
            {Object.entries(players).map(([sessionId, player], idx) => {
              const isInitiator = sessionId === lastRoundInitiator;
              const doubled = isInitiator && initiatorScoreDoubled;
              const scoreColor = isInitiator ? (doubled ? "text-rose-400" : "text-emerald-400") : "text-slate-200";
              const rowBg = idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10";
              return (
                <tr key={sessionId} className={`${rowBg} transition-colors hover:bg-slate-700/40`}>
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {sessionId === currentPlayerId ? "You" : player.name}
                      {isInitiator && (
                        <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 uppercase ring-1 ring-amber-300/30 ring-inset">
                          Initiator
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono text-sm ${scoreColor}`}>
                    {player.roundScore}
                    {doubled && <span className="ml-1 text-[10px] font-bold text-rose-300">×2</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-100">{player.score}</td>
                  <td className="px-4 py-3">
                    {player.readyForNextRound ? (
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
          </tbody>
        </table>
      </div>
      {countdown !== null && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div className="absolute inset-0 animate-pulse bg-slate-500/40" />
          </div>
          <div className="text-lg font-medium text-slate-200">
            Next round starting in <span className="font-semibold text-white">{countdown}</span>…
          </div>
        </div>
      )}
      {currentPlayerId &&
        players[currentPlayerId] &&
        !players[currentPlayerId].readyForNextRound &&
        countdown === null && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleReadyClick}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Ready for Next Round
            </button>
          </div>
        )}
    </div>
  );
};

export default RoundEndDisplay;
