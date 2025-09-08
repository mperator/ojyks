import React from 'react';
import { useGameStore } from '@/lib/store';

const RoundEndDisplay = () => {
  const { players, setReadyForNextRound, room, countdown, winner, lastRoundInitiator, initiatorScoreDoubled } = useGameStore();
  const currentPlayerId = room?.sessionId;

  const handleReadyClick = () => {
    const player = players[currentPlayerId!];
    if (player) {
      setReadyForNextRound(!player.readyForNextRound);
    }
  };

  if (winner) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-2xl">Winner is {winner}!</p>
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
