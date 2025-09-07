"use client";

import { useGameStore } from "@/lib/store";
import { useState } from "react";
import { Card as CardType, Player as PlayerType } from "../../../../../server/src/rooms/MyRoom";

const Card = ({ card, onClick, isSelected }: { card: CardType, onClick?: () => void, isSelected?: boolean }) => {
    if (card.value === 999) { // Render empty slot
        return <div className="w-20 h-28 rounded-lg bg-gray-800" />;
    }
    return (
        <div
            className={`w-20 h-28 border-2 rounded-lg flex items-center justify-center transition-all
                ${onClick ? 'cursor-pointer hover:border-yellow-400' : ''}
                ${isSelected ? 'border-yellow-400 scale-105' : (card.value < 0 ? 'border-red-500' : 'border-gray-300')}
                ${card.isFlipped ? 'bg-white text-black' : 'bg-gray-500'}`}
            onClick={onClick}
        >
            {card.isFlipped ? <span className="text-2xl font-bold">{card.value}</span> : null}
        </div>
    );
};

const PlayerBoard = ({ player, isCurrentPlayer }: { player: PlayerType, isCurrentPlayer: boolean }) => {
    return (
        <div>
            <h3 className={`text-lg font-semibold ${isCurrentPlayer ? 'text-yellow-400' : ''}`}>{player.name} (Score: {player.score})</h3>
            <div className="grid grid-cols-4 gap-2 mt-2">
                {player.cards.map((card, index) => (
                    <Card key={index} card={card} />
                ))}
            </div>
        </div>
    )
}


const GameBoard = () => {
    const { room, players, gameState, currentTurn, drawnCard, drawPile, discardPile, winner, scores, revealInitialCards } = useGameStore();
    const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
    const [selectedBoardCard, setSelectedBoardCard] = useState<number | null>(null);

    const mySessionId = room?.sessionId;
    const player = mySessionId ? players[mySessionId] : null;
    const isMyTurn = currentTurn === mySessionId;

    const handleBoardCardClick = (index: number) => {
        // Initial card revelation
        if (gameState === 'starting' && player && !player.isReady) {
            if (selectedCardIndices.includes(index)) {
                setSelectedCardIndices(selectedCardIndices.filter(i => i !== index));
            } else if (selectedCardIndices.length < 2) {
                setSelectedCardIndices([...selectedCardIndices, index]);
            }
            return;
        }

        // Gameplay clicks
        if (isMyTurn && gameState === 'playing') {
             // If a drawn card is present, the main action is to decide what to do with it.
            if (drawnCard) {
                // Option A: Swap with a card on the board (can be flipped or unflipped)
                // We'll select the card first, then a separate button will confirm the swap.
                // For simplicity, let's make the click a direct swap action.
                room?.send("swapCard", index);
                return;
            }
            // If no card is drawn, the action is to flip a card.
            else {
                if (!player?.cards[index].isFlipped) {
                    room?.send("flipCard", index);
                }
                return;
            }
        }
    };

    const handleRevealClick = () => {
        if (gameState === 'starting' && selectedCardIndices.length === 2) {
            revealInitialCards(selectedCardIndices);
            setSelectedCardIndices([]); // Clear selection after revealing
        }
    };

    const handleDrawPileClick = () => {
        if (isMyTurn && gameState === 'playing' && !drawnCard) {
            room?.send("drawFromDrawPile");
        }
    }

    const handleDiscardPileClick = () => {
        if (isMyTurn && gameState === 'playing' && !drawnCard) {
            room?.send("drawFromDiscardPile");
        }
    }

    const handleDiscardAndFlip = () => {
        if (isMyTurn && drawnCard && selectedBoardCard !== null) {
             if (!player?.cards[selectedBoardCard].isFlipped) {
                room?.send("discardAndFlip", selectedBoardCard);
                setSelectedBoardCard(null);
             }
        }
    }

    if (!player) return <div>Loading player data...</div>;

    if (winner) {
        return (
            <div className="text-center">
                <h2 className="text-4xl font-bold text-yellow-400">Game Over!</h2>
                <p className="text-2xl mt-4">Winner is {winner}!</p>
            </div>
        )
    }

    if (gameState === 'finished') {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold">Round Over</h2>
                <div className="mt-4">
                    {scores && Object.entries(scores).map(([id, score]) => (
                        <p key={id} className="text-lg">{players[id]?.name}: {score}</p>
                    ))}
                </div>
                <p className="mt-6 text-gray-400">Next round will start soon...</p>
            </div>
        )
    }

    return (
        <div className="flex-grow bg-gray-900 p-4 rounded-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                    {gameState === 'starting'
                        ? "Reveal Phase"
                        : isMyTurn
                        ? "Your Turn"
                        : `${players[currentTurn!]?.name}'s Turn`
                    }
                </h2>
                <div className="flex space-x-4">
                    <div className="text-center">
                        <p>Draw Pile</p>
                        <div onClick={handleDrawPileClick} className={`w-20 h-28 bg-blue-800 rounded-lg flex items-center justify-center ${isMyTurn && !drawnCard ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                           {drawPile.length}
                        </div>
                    </div>
                     <div className="text-center">
                        <p>Discard Pile</p>
                        {discardPile.length > 0 ?
                            <Card card={discardPile[discardPile.length - 1]} onClick={handleDiscardPileClick} />
                            : <div className="w-20 h-28 bg-gray-700 rounded-lg"></div>
                        }
                    </div>
                    {drawnCard && (
                         <div className="text-center">
                            <p>Drawn Card</p>
                            <Card card={drawnCard} />
                        </div>
                    )}
                </div>
            </div>

            {drawnCard && isMyTurn && (
                <div className="bg-gray-800 p-3 rounded-lg mb-4 text-center">
                    <p className="mb-2">You drew a {drawnCard.value}. Choose an action:</p>
                    <p className="text-sm text-gray-400 mb-2">Click a card on your board to swap. OR select an unflipped card on your board and click discard.</p>
                     <button
                        onClick={handleDiscardAndFlip}
                        disabled={selectedBoardCard === null || player.cards[selectedBoardCard]?.isFlipped}
                        className="px-4 py-2 bg-red-600 rounded disabled:bg-gray-500"
                    >
                        Discard Drawn Card & Flip Selected
                    </button>
                </div>
            )}


            {gameState === 'starting' && !player.isReady && (
                 <div className="mb-4 text-center p-4 bg-gray-800 rounded-lg">
                    <p className="font-bold">Reveal Your Cards</p>
                    <p>Select two of your cards to reveal.</p>
                    <button
                        onClick={handleRevealClick}
                        disabled={selectedCardIndices.length !== 2}
                        className="mt-2 px-4 py-2 bg-green-600 rounded disabled:bg-gray-500"
                    >
                        Reveal Selected Cards
                    </button>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-yellow-400">Your Board (Score: {player.score})</h3>
                <div className="grid grid-cols-4 gap-4">
                    {player.cards.map((card, index) => (
                        <Card
                            key={index}
                            card={card}
                            onClick={() => handleBoardCardClick(index)}
                            isSelected={selectedCardIndices.includes(index) || selectedBoardCard === index}
                        />
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4">
                 <h3 className="text-lg font-semibold mb-2">Other Players</h3>
                 {Object.values(players).filter(p => p.name !== player.name).map(p => (
                     <PlayerBoard key={p.name} player={p} isCurrentPlayer={currentTurn === Object.keys(players).find(id => players[id] === p)} />
                 ))}
            </div>
        </div>
    );
};

export default GameBoard;
