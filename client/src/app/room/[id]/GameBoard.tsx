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
    const { room, players, gameState, currentTurn, drawnCard, drawPile, discardPile, winner, scores, revealInitialCard, discardDrawnCard } = useGameStore();
    const [selectedPile, setSelectedPile] = useState<'draw' | 'discard' | null>(null);
    const [isFlippingAfterDiscard, setIsFlippingAfterDiscard] = useState<boolean>(false);

    const mySessionId = room?.sessionId;
    const player = mySessionId ? players[mySessionId] : null;
    const isMyTurn = currentTurn === mySessionId;

    // Reset states when turn changes or card is handled
    if ((!isMyTurn || (drawnCard === null && !isFlippingAfterDiscard)) && (selectedPile || isFlippingAfterDiscard)) {
        setSelectedPile(null);
        setIsFlippingAfterDiscard(false);
    }

    const handleBoardCardClick = (index: number) => {
        if (gameState === 'starting' && player && !player.isReady) {
            revealInitialCard(index);
            return;
        }

        if (isMyTurn && gameState === 'playing') {
            if (isFlippingAfterDiscard) {
                // After deciding to discard a drawn card, the player MUST flip a card.
                if (!player?.cards[index].isFlipped) {
                    room?.send("flipCard", index);
                    setIsFlippingAfterDiscard(false); // Reset state after action
                }
            } else if (drawnCard) {
                // If a card is drawn (from either pile), clicking the board means swapping.
                room?.send("swapCard", index);
                // State will be reset automatically when drawnCard becomes null
            } else {
                // If no card is drawn and not in flip-after-discard mode, it's a regular flip.
                if (!player?.cards[index].isFlipped) {
                    room?.send("flipCard", index);
                }
            }
        }
    };

    const handleDrawPileClick = () => {
        if (isMyTurn && gameState === 'playing' && !drawnCard && !isFlippingAfterDiscard) {
            room?.send("drawFromDrawPile");
            setSelectedPile('draw');
        }
    }

    const handleDiscardPileClick = () => {
        if (isMyTurn && gameState === 'playing' && !isFlippingAfterDiscard) {
            if (drawnCard && selectedPile === 'draw') {
                // Player has a card from the draw pile and clicks discard.
                discardDrawnCard();
                setIsFlippingAfterDiscard(true);
                setSelectedPile(null); // The card is no longer considered "selected" for swapping
            } else if (!drawnCard) {
                // Player is drawing from the discard pile.
                if (discardPile.length > 0) {
                    room?.send("drawFromDiscardPile");
                    setSelectedPile('discard');
                }
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
                            ? isFlippingAfterDiscard ? "Select a card to flip" : (drawnCard ? "Choose your action" : "Your Turn")
                            : `${players[currentTurn!]?.name}'s Turn`
                    }
                </h2>
                <div className="flex space-x-4">
                    <div className="text-center">
                        <p>Draw Pile</p>
                        <div onClick={handleDrawPileClick} className={`relative w-20 h-28 bg-blue-800 rounded-lg flex items-center justify-center ${isMyTurn && !drawnCard && !isFlippingAfterDiscard ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                           {drawPile.length}
                           {drawnCard && selectedPile === 'draw' && (
                                <div className="absolute -top-1 -left-1 z-10">
                                    <Card card={drawnCard} isSelected={true} />
                                </div>
                           )}
                        </div>
                    </div>
                     <div className="text-center">
                        <p>Discard Pile</p>
                        {discardPile.length > 0 ?
                            <Card 
                                card={discardPile[discardPile.length - 1]} 
                                onClick={handleDiscardPileClick} 
                                isSelected={(drawnCard != null && selectedPile === 'discard' && discardPile[discardPile.length - 1].value === drawnCard.value)}
                            />
                            : <div className="w-20 h-28 bg-gray-700 rounded-lg"></div>
                        }
                    </div>
                </div>
            </div>

            {isMyTurn && (drawnCard || isFlippingAfterDiscard) && (
                <div className="bg-gray-800 p-3 rounded-lg mb-4 text-center">
                    {isFlippingAfterDiscard 
                        ? <p>You discarded your card. Now you must flip one of your face-down cards.</p>
                        : selectedPile === 'draw' 
                            ? <p>You drew a {drawnCard!.value}. Swap it with a card on your board, or click the discard pile to discard it and flip a card.</p>
                            : <p>You selected a {drawnCard!.value} from the discard pile. Swap it with a card on your board.</p>
                    }
                </div>
            )}

            {gameState === 'starting' && !player.isReady && (
                 <div className="mb-4 text-center p-4 bg-gray-800 rounded-lg">
                    <p className="font-bold">Reveal Your Cards</p>
                    <p>Click on {player.cards.filter(c => c.isFlipped == true).length == 0 ? "two" : "one"} of your cards to reveal them.</p>
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
                            isSelected={false}
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
