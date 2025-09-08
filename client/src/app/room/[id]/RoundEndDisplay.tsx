import React from 'react';
import { useGameStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const RoundEndDisplay = () => {
  const { players, setReadyForNextRound, room, countdown, winner, lastRoundInitiator, initiatorScoreDoubled, leaveRoom } = useGameStore();
  const currentPlayerId = room?.sessionId;
  const router = useRouter();

  const handleReadyClick = () => {
    const player = players[currentPlayerId!];
    if (player) {
      setReadyForNextRound(!player.readyForNextRound);
    }
  };

  const handleExitClick = () => {
    router.push('/');
    leaveRoom();
  };

  if (winner) {
    return (
      <div className="p-4 bg-gray-700 rounded-lg text-white">
        <h2 className="text-3xl font-bold text-center mb-4">Game Over!</h2>
        <p className="text-2xl text-center mb-4">Winner is {winner}!</p>
        <table className="w-full text-left table-auto mb-6">
          <thead>
            <tr>
              <th className="px-4 py-2">Player</th>
              <th className="px-4 py-2">Final Score</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(players)
              .sort((a, b) => b.score - a.score)
              .map((player) => (
              <tr key={player.name} className="border-t border-gray-600">
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2">{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center">
          <button
            onClick={handleExitClick}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-700 rounded-lg text-white">
      <h2 className="text-2xl font-bold text-center mb-4">Round Over</h2>
      <table className="w-full text-left table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">Player</th>
            <th className="px-4 py-2">Round Score</th>
            <th className="px-4 py-2">Total Score</th>
            <th className="px-4 py-2">Ready</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(players).map(([sessionId, player]) => {
            const isInitiator = sessionId === lastRoundInitiator;
            const scoreColor = isInitiator
              ? initiatorScoreDoubled ? 'text-red-500' : 'text-green-500'
              : '';

            return (
              <tr key={player.name} className="border-t border-gray-600">
                <td className="px-4 py-2">{player.name} {isInitiator ? '👑' : ''}</td>
                <td className={`px-4 py-2 ${scoreColor}`}>{player.roundScore} {isInitiator && initiatorScoreDoubled ? '(x2)' : ''}</td>
                <td className="px-4 py-2">{player.score}</td>
                <td className="px-4 py-2">{player.readyForNextRound ? '✅' : '❌'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {countdown !== null && (
        <div className="text-center mt-4 text-xl">
          Next round starting in {countdown}...
        </div>
      )}
      {currentPlayerId && players[currentPlayerId] && !players[currentPlayerId].readyForNextRound && countdown === null && (
        <div className="text-center mt-4">
          <button
            onClick={handleReadyClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Ready for Next Round
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundEndDisplay;
