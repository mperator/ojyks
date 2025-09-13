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
      <div className="animate-fade-in mx-auto w-full max-w-3xl rounded-2xl border border-slate-600/60 bg-slate-800 p-4 text-slate-100 shadow-2xl sm:p-6">
        <div className="mb-5 text-center">
          <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-amber-300 drop-shadow-sm sm:text-4xl">
            Game Over
          </h2>
          <p className="text-sm font-medium text-slate-300 sm:text-lg">Final Results</p>
        </div>
        <div className="mb-5 rounded-xl border border-slate-600/50 bg-slate-900/40 p-3 shadow-inner sm:p-4">
          <p className="text-center text-xl font-semibold text-amber-300 sm:text-2xl">
            👑 Winner:{" "}
            <span className="font-bold text-white">{winningSessionId === currentPlayerId ? "You" : winnerName}</span>
          </p>
        </div>
        {/* Desktop / md+ table */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-600/50 shadow md:block">
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
        {/* Mobile list */}
        <div className="space-y-2 md:hidden">
          {sortedEntries.map(([sessionId, player]) => {
            const isWinner = sessionId === winningSessionId;
            return (
              <div
                key={sessionId}
                className={`flex items-center justify-between rounded-xl border border-slate-600/50 bg-slate-900/50 p-3 shadow-sm ${isWinner ? "ring-1 ring-amber-400/40" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{sessionId === currentPlayerId ? "You" : player.name}</span>
                  {isWinner && (
                    <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-amber-400/15 px-2 py-[2px] text-[10px] font-semibold text-amber-300 ring-1 ring-amber-300/30">
                      Champion
                    </span>
                  )}
                </div>
                <span className="font-mono text-base text-slate-100">{player.score}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center sm:mt-8">
          <button
            onClick={handleExitClick}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:px-6 sm:py-3"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-4xl rounded-2xl border border-slate-600/60 bg-slate-800 p-4 text-slate-100 shadow-xl sm:p-6">
      <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-indigo-300 drop-shadow-sm sm:text-3xl">
          Round Complete
        </h2>
        <p className="text-[12px] text-slate-300 sm:text-sm">
          Review scores while players ready up for the next round.
        </p>
      </div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-600/50 shadow ring-1 ring-white/5 md:block">
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
      {/* Mobile stacked list */}
      <div className="space-y-2 md:hidden">
        {Object.entries(players).map(([sessionId, player]) => {
          const isInitiator = sessionId === lastRoundInitiator;
          const doubled = isInitiator && initiatorScoreDoubled;
          const scoreColor = isInitiator ? (doubled ? "text-rose-300" : "text-emerald-300") : "text-slate-100";
          return (
            <div
              key={sessionId}
              className="flex flex-col gap-2 rounded-xl border border-slate-600/50 bg-slate-900/50 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {sessionId === currentPlayerId ? "You" : player.name}
                  {isInitiator && (
                    <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2 py-[2px] text-[9px] font-semibold tracking-wide text-amber-300 uppercase ring-1 ring-amber-300/30 ring-inset">
                      Initiator
                    </span>
                  )}
                </span>
                <span className={`font-mono text-xs ${scoreColor}`}>
                  {player.roundScore}
                  {doubled && <span className="ml-1 text-[9px] font-bold text-rose-300">×2</span>}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-300">
                  Total: <span className="font-semibold text-slate-100">{player.score}</span>
                </span>
                {player.readyForNextRound ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-[2px] text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30 ring-inset">
                    ✅ Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-[2px] text-[10px] font-medium text-slate-300 ring-1 ring-slate-400/20 ring-inset">
                    ⏳ Waiting
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
          <div className="mt-6 flex justify-center sm:mt-8">
            <button
              onClick={handleReadyClick}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:px-7 sm:py-3"
            >
              Ready for Next Round
            </button>
          </div>
        )}
    </div>
  );
};

export default RoundEndDisplay;
