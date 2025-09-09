"use client";

import { useGameStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card as CardType, Player as PlayerType } from "../../../../../server/src/rooms/MyRoom";

// Helper: map card value to color classes (front side)
const getCardColorClasses = (value: number) => {
    // Muted, less bright palette (darker variants) for better contrast with white outlined text
    if (value === -2 || value === -1) return 'bg-blue-800';
    if (value === 0) return 'bg-sky-600';
    if (value >= 1 && value <= 4) return 'bg-green-700';
    if (value >= 5 && value <= 8) return 'bg-yellow-600';
    if (value >= 9 && value <= 12) return 'bg-red-700';
    return 'bg-gray-600';
};

const Card = ({ card, onClick, isSelected, size = 'md' }: { card: CardType, onClick?: () => void, isSelected?: boolean, size?: 'xs' | 'sm' | 'md' | 'lg' }) => {
    if (!card || card.value === 999) { // Render empty slot
        return <div className={`rounded-lg bg-gray-800 ${size === 'xs' ? 'w-9 h-12' : size === 'sm' ? 'w-10 h-14' : size === 'lg' ? 'w-24 h-36' : 'w-20 h-28'}`} />;
    }
    const sizeClasses = size === 'xs'
        ? 'w-9 h-12 text-[14px]'
        : size === 'sm'
            ? 'w-10 h-14 text-lg'
            : size === 'lg'
                ? 'w-24 h-36 text-6xl'
                : 'w-20 h-28 text-5xl';
    const frontClasses = `${getCardColorClasses(card.value)} text-white border-white`;
    const backClasses = 'bg-gray-600/80 text-transparent border-gray-400/70';
    return (
        <div
            className={`${sizeClasses} border-2 rounded-xl flex items-center justify-center font-semibold tracking-wide select-none shadow-sm transition-all duration-150
                ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''}
                ${isSelected ? 'ring-2 ring-amber-300 scale-105 shadow-amber-400/30' : ''}
                ${card.isFlipped ? frontClasses : backClasses}
            `}
            onClick={onClick}
            aria-label={card.isFlipped ? `Card ${card.value}` : 'Hidden card'}
        >
            {card.isFlipped ? <span className="card-value drop-shadow-md">{card.value}</span> : null}
        </div>
    );
};

const PlayerBoard = ({ player, isCurrentPlayer, compact = false }: { player: PlayerType, isCurrentPlayer: boolean, compact?: boolean }) => {
    return (
        <div className={`flex flex-col items-center ${compact ? 'min-w-[120px]' : ''}`}>
            <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-1' : 'mb-2'}`}>
                <span className={`text-sm font-medium ${isCurrentPlayer ? 'text-amber-300' : 'text-gray-300'}`}>{player.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/70 text-gray-200">{player.score}</span>
                {isCurrentPlayer && <span className="animate-pulse text-[10px] text-amber-300">●</span>}
            </div>
            <div className={`grid justify-items-center ${compact ? 'grid-cols-4 gap-[2px]' : 'grid-cols-4 gap-2'}`}>
                {player.cards.map((card, index) => (
                    <Card key={index} card={card} size={compact ? 'xs' : 'md'} />
                ))}
            </div>
        </div>
    );
};

const GameBoard = () => {
    const { room, players, gameState, currentTurn, drawnCard, drawPile, discardPile, winner, scores, revealInitialCard, discardDrawnCard, messages, sendMessage, leaveRoom } = useGameStore();
    const [isFlippingAfterDiscard, setIsFlippingAfterDiscard] = useState<boolean>(false);
    const [sidebarTab, setSidebarTab] = useState<'scoreboard' | 'chat'>('scoreboard');
    const [chatInput, setChatInput] = useState('');
    const router = useRouter();

    const mySessionId = room?.sessionId;
    const player = mySessionId ? players[mySessionId] : null;
    const isMyTurn = currentTurn === mySessionId;

    const otherPlayers = useMemo(() => Object.entries(players).filter(([id]) => id !== mySessionId).map(([id, p]) => ({ id, player: p })), [players, mySessionId]);

    // Reset states when turn changes or card is handled
    if ((!isMyTurn || (drawnCard === null && !isFlippingAfterDiscard)) && isFlippingAfterDiscard) {
        setIsFlippingAfterDiscard(false);
    }

    // Determine from which pile the currently drawn card originated so ALL players can see it.
    const drawnFromDiscard = useMemo(() => {
        if (!drawnCard) return false;
        if (discardPile.length === 0) return false;
        return discardPile[discardPile.length - 1] === drawnCard; // reference equality (server keeps card reference on discard)
    }, [drawnCard, discardPile]);

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
            // No local state needed; overlay will be derived from presence of drawnCard not on discard pile
        }
    }

    const handleDiscardPileClick = () => {
        if (isMyTurn && gameState === 'playing' && !isFlippingAfterDiscard) {
            if (drawnCard && !drawnFromDiscard) {
                // Player has a card from the draw pile and chooses to discard it -> must flip a card.
                discardDrawnCard();
                setIsFlippingAfterDiscard(true);
            } else if (!drawnCard) {
                // Player is drawing from the discard pile.
                if (discardPile.length > 0) {
                    room?.send("drawFromDiscardPile");
                }
            }
        }
    }

    if (!player) return <div>Loading player data...</div>;

    // Winner / Round summary overlay style presentation.
    if (winner || gameState === 'finished') {
        return (
            <div className="flex flex-col flex-grow items-center justify-center bg-gray-900/80 rounded-lg p-6 text-center space-y-6">
                {winner && (
                    <div>
                        <h2 className="text-5xl font-extrabold text-amber-400 drop-shadow">Game Over</h2>
                        <p className="text-2xl mt-4 text-gray-200">Winner: <span className="text-amber-300 font-semibold">{winner}</span></p>
                    </div>
                )}
                {gameState === 'finished' && (
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Round Scores</h2>
                        <div className="space-y-1">
                            {scores && Object.entries(scores).sort((a,b)=> a[1]-b[1]).map(([id, score]) => (
                                <p key={id} className="text-lg text-gray-300">{players[id]?.name}: <span className="text-amber-200 font-medium">{score}</span></p>
                            ))}
                        </div>
                        {!winner && <p className="mt-6 text-gray-400 text-sm">Next round will start soon...</p>}
                    </div>
                )}
            </div>
        );
    }

    // Phase & turn headline logic extracted for reuse.
    const phaseTitle = gameState === 'starting'
        ? 'Reveal two cards'
        : isMyTurn
            ? (isFlippingAfterDiscard ? 'Flip a card' : (drawnCard ? 'Choose: swap or discard' : 'Your Turn'))
            : `${players[currentTurn!]?.name}'s Turn`;

    return (
        <div className="flex flex-col flex-grow bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl p-3 md:p-5 overflow-hidden">
            {/* Top bar: other players (centered, wrapping) */}
            <div className="flex flex-wrap justify-center items-start gap-4 pb-2 mb-3 border-b border-gray-700/60">
                {otherPlayers.map(({ id, player: p }) => (
                    <PlayerBoard
                        key={id}
                        player={p}
                        isCurrentPlayer={currentTurn === id}
                        compact
                    />
                ))}
                {otherPlayers.length === 0 && <p className="text-xs text-gray-500 px-2">No other players yet...</p>}
            </div>

            <div className="flex flex-1 min-h-0 gap-4">
                {/* Center play zone */}
                <div className="flex-1 flex flex-col">
                    {/* Status / instructions (mobile inline) */}
                    <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-100">{phaseTitle}</h2>
                        <div className="flex gap-3">
                            {/* Turn indicator badge */}
                            <div className={`text-xs px-2 py-1 rounded-full ${isMyTurn ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-gray-700/60 text-gray-300'}`}>{isMyTurn ? 'Your turn' : 'Waiting'}</div>
                        </div>
                    </div>

                    {/* Central piles area */}
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 py-2">
                        {/* Draw Pile */}
                        <div className="flex flex-col items-center gap-1">
                            {drawPile.length > 0 ? (
                                <div
                                    onClick={handleDrawPileClick}
                                    className={`relative w-20 h-28 border-2 rounded-xl flex items-center justify-center font-semibold select-none transition-all duration-150
                                        bg-gray-600/80 text-gray-200 border-gray-400/70 shadow-sm
                                        ${isMyTurn && !drawnCard && !isFlippingAfterDiscard
                                            ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-amber-300 hover:ring-1 hover:ring-amber-300/60'
                                            : 'cursor-not-allowed '}
                                    `}
                                >
                                    {drawnCard && !drawnFromDiscard && (
                                        <div className="absolute -top-3 -left-4 rotate-[-6deg]">
                                            <Card card={drawnCard} isSelected size='md' />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative w-20 h-28 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-[11px] font-medium tracking-wide text-gray-500 select-none">
                                    Draw
                                    {drawnCard && !drawnFromDiscard && (
                                        <div className="absolute -top-3 -left-4 rotate-[-6deg]">
                                            <Card card={drawnCard} isSelected size='md' />
                                        </div>
                                    )}
                                </div>
                            )}
                            <span className="mt-1 text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1">
                                <span>Draw</span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-700/70 text-[10px] font-medium text-gray-200">{drawPile.length}</span>
                            </span>
                        </div>
                        {/* Discard Pile */}
                        <div className="flex flex-col items-center gap-1">
                            {(() => {
                                const count = discardPile.length;
                                const isSelectedFromDiscard = drawnCard && drawnFromDiscard;
                                // Single card & selected -> show placeholder instead of base card
                                if (count === 1 && isSelectedFromDiscard) {
                                    return (
                                        <div className="relative">
                                            <div className="w-20 h-28 rounded-xl border-2 border-dashed flex items-center justify-center text-[11px] tracking-wide uppercase text-gray-400 border-gray-700 opacity-80">Discard</div>
                                            <div className="absolute -top-3 -right-4 rotate-[6deg]">
                                                <Card card={drawnCard!} isSelected size='md' />
                                            </div>
                                        </div>
                                    );
                                }
                                // Single card & not selected -> show the actual card
                                if (count === 1) {
                                    return (
                                        <div className="relative">
                                            <Card
                                                card={discardPile[0]}
                                                onClick={handleDiscardPileClick}
                                                isSelected={false}
                                                size='md'
                                            />
                                        </div>
                                    );
                                }
                                // Multiple cards -> stacked representation
                                return (
                                    <div className="relative">
                                        <Card
                                            card={discardPile[count - 1]}
                                            onClick={isSelectedFromDiscard ? undefined : handleDiscardPileClick}
                                            isSelected={false}
                                            size='md'
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-20 h-28 rounded-xl border-2 border-gray-500 bg-gray-700/80 -z-10" />
                                        {isSelectedFromDiscard && (
                                            <div className="absolute -top-3 -right-4 rotate-[6deg]">
                                                <Card card={drawnCard!} isSelected size='md' />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <span className="mt-1 text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1">
                                <span>Discard</span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-700/70 text-[10px] font-medium text-gray-200">{discardPile.length}</span>
                            </span>
                        </div>
                    </div>

                    {/* Instruction banner (moved below piles, above player board) */}
                    {(isMyTurn && (drawnCard || isFlippingAfterDiscard)) || (gameState === 'starting' && !player.isReady) ? (
                        <div className="mt-2 mb-3 px-4 py-3 text-sm text-gray-200 w-full max-w-md mx-auto">
                            {gameState === 'starting' && !player.isReady ? (
                                <div>
                                    <p className="font-semibold text-amber-300 mb-1 text-center">Reveal Your Cards</p>
                                    <p className="text-center">Click {player.cards.filter(c => c.isFlipped).length === 0 ? 'two' : 'one'} hidden card(s) to reveal.</p>
                                </div>
                            ) : isFlippingAfterDiscard ? (
                                <p className="text-center">You discarded. Now flip one of your face-down cards.</p>
                            ) : drawnCard && !drawnFromDiscard ? (
                                <p className="text-center">You drew <span className="text-amber-300 font-medium">{drawnCard!.value}</span>. Swap with a board card or discard it to flip instead.</p>
                            ) : drawnCard && drawnFromDiscard ? (
                                <p className="text-center">You selected <span className="text-amber-300 font-medium">{drawnCard!.value}</span> from discard. Swap it with a card on your board.</p>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Player Board at bottom (heading removed, score moved to sidebar) */}
                    <div className="mt-auto pt-3 flex flex-col items-center">
                        <div className="inline-grid grid-cols-4 gap-2 sm:gap-3 place-items-center">
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
                </div>

                {/* Unified Sidebar with Tabs (phase card removed) */}
                <aside className="w-64 hidden lg:flex flex-col border-l border-gray-700/60 pl-4 gap-4">
                    {/* Your info panel */}
                    <div className="bg-gray-800/70 rounded-lg p-3 border border-gray-700/70 shadow-sm">
                        <p className="text-xs text-gray-300">Your Score: <span className="font-medium text-amber-300">{player.score}</span></p>
                    </div>

                    {/* Tabs */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-700/70 bg-gray-800/70">
                        <button
                            onClick={() => setSidebarTab('scoreboard')}
                            className={`flex-1 text-xs py-2 font-medium transition ${sidebarTab === 'scoreboard' ? 'bg-gray-700 text-amber-300' : 'text-gray-300 hover:text-gray-100'}`}
                        >
                            Scoreboard
                        </button>
                        <button
                            onClick={() => setSidebarTab('chat')}
                            className={`flex-1 text-xs py-2 font-medium transition ${sidebarTab === 'chat' ? 'bg-gray-700 text-amber-300' : 'text-gray-300 hover:text-gray-100'}`}
                        >
                            Chat
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 min-h-0 flex flex-col bg-gray-800/60 rounded-lg border border-gray-700/70 overflow-hidden">
                        {sidebarTab === 'scoreboard' ? (
                            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700/70">
                                {Object.entries(players).map(([id, p]) => (
                                    <div key={id} className={`flex items-center justify-between text-sm rounded px-2 py-1 ${id === currentTurn ? 'bg-amber-400/15 border border-amber-300/30' : 'bg-gray-700/40'} ${id === mySessionId ? 'ring-1 ring-amber-300/30' : ''}`}>
                                        <span className={`truncate ${id === mySessionId ? 'text-amber-200 font-medium' : 'text-gray-200'}`} title={p.name}>{id === mySessionId ? `${p.name}` : p.name}</span>
                                        <span className="text-gray-300 font-mono text-xs">{p.score}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700/70">
                                    {messages.length === 0 && <div className="text-[11px] text-gray-400">No messages yet.</div>}
                                    {messages.map((m, i) => (
                                        <div key={i} className="text-xs text-gray-200 bg-gray-700/60 rounded px-2 py-1 break-words">{m}</div>
                                    ))}
                                </div>
                                <form
                                    onSubmit={e => { e.preventDefault(); if (chatInput.trim()) { sendMessage(chatInput); setChatInput(''); } }}
                                    className="p-2 border-t border-gray-700 flex gap-2"
                                >
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Type..."
                                        className="flex-1 bg-gray-900/60 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-amber-400 text-gray-100"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs font-semibold px-3 py-1 rounded transition disabled:opacity-40"
                                        disabled={!chatInput.trim()}
                                    >Send</button>
                                </form>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { leaveRoom(); router.push('/'); }}
                        className="mt-2 text-xs font-semibold tracking-wide uppercase bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white py-2 rounded-lg border border-red-500/60 shadow-sm transition"
                    >
                        Rage Quit
                    </button>
                </aside>
            </div>
        </div>
    );
};

export default GameBoard;
