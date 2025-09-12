"use client";

import { useGameStore } from "@/lib/store";
import { Card as CardType, Player as PlayerType } from "@/types/server-types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// Helper: map card value to color classes (front side)
const getCardColorClasses = (value: number) => {
  // Muted, less bright palette (darker variants) for better contrast with white outlined text
  if (value === -2 || value === -1) return "bg-[#053D61]";
  if (value === 0) return "bg-[#429FD4]";
  if (value >= 1 && value <= 4) return "bg-[#02806A]";
  if (value >= 5 && value <= 8) return "bg-[#D99514]";
  if (value >= 9 && value <= 12) return "bg-[#AB2E1B]";
  return "bg-gray-600";
};

const Card = ({
  card,
  onClick,
  isSelected,
  size = "md",
}: {
  card: CardType;
  onClick?: () => void;
  isSelected?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  if (!card || card.value === 999) {
    // Empty slot placeholder
    return (
      <div
        className={`rounded-lg bg-gray-800 ${size === "xs" ? "h-14 w-9" : size === "sm" ? "h-15 w-10" : size === "lg" ? "h-36 w-24" : "h-30 w-20"}`}
      />
    );
  }

  const sizeClasses =
    size === "xs"
      ? "w-9 h-14 text-[14px]"
      : size === "sm"
        ? "w-10 h-15 text-lg"
        : size === "lg"
          ? "w-24 h-36 text-6xl"
          : "w-20 h-30 text-5xl";
  const roundedClasses =
    size === "xs" ? "rounded-xs" : size === "sm" ? "rounded-sm" : size === "lg" ? "rounded-lg" : "rounded-lg";

  const frontColorClasses = `${getCardColorClasses(card.value)} text-white border-white`;
  const backColorClasses = "bg-gray-600/80 text-transparent border-gray-400/70";

  return (
    <div
      className={`flip-container ${sizeClasses} relative select-none ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      aria-label={card.isFlipped ? `Card ${card.value}` : "Hidden card"}
    >
      <div
        className={`flip-inner ${card.isFlipped ? "flipped" : ""} ${isSelected ? "scale-[1.04] rounded-xl ring-1 ring-amber-300" : ""} ${onClick ? "hover:-translate-y-1" : ""}`}
      >
        {/* Back Face */}
        <div
          className={`flip-face back flex items-center justify-center border-2 font-semibold tracking-wide shadow-sm ${backColorClasses} ${roundedClasses}`}
        >
          <Image
            src={size === "xs" || size === "sm" ? "/card_back_small.jpg" : "/card_back.jpg"}
            alt="Card back"
            fill
            priority={false}
            className="pointer-events-none object-cover opacity-80 select-none"
            draggable={false}
          />
        </div>
        {/* Front Face */}
        <div
          className={`flip-face front flex items-center justify-center rounded-xl border-2 font-semibold tracking-wide shadow-md ${frontColorClasses} ${roundedClasses}`}
        >
          <span className="card-value relative drop-shadow-md">{card.value}</span>
        </div>
      </div>
    </div>
  );
};

const PlayerBoard = ({
  player,
  isCurrentPlayer,
  compact = false,
}: {
  player: PlayerType;
  isCurrentPlayer: boolean;
  compact?: boolean;
}) => {
  return (
    <div className={`flex flex-col items-center ${compact ? "min-w-[120px]" : ""}`}>
      <div className={`flex items-center justify-center gap-2 ${compact ? "mb-1" : "mb-2"}`}>
        <span className={`text-sm font-medium ${isCurrentPlayer ? "text-amber-300" : "text-gray-300"}`}>
          {player.name}
        </span>
        <span className="rounded bg-gray-700/70 px-1.5 py-0.5 text-xs text-gray-200">{player.score}</span>
        {isCurrentPlayer && <span className="animate-pulse text-[10px] text-amber-300">●</span>}
      </div>
      <div className={`grid justify-items-center ${compact ? "grid-cols-4 gap-[2px]" : "grid-cols-4 gap-2"}`}>
        {player.cards.map((card: CardType, index: number) => (
          <Card key={index} card={card} size={compact ? "xs" : "md"} />
        ))}
      </div>
    </div>
  );
};

const GameBoard = () => {
  const {
    room,
    players,
    gameState,
    currentTurn,
    drawnCard,
    drawPile,
    discardPile,
    winner,
    scores,
    revealInitialCard,
    discardDrawnCard,
    messages,
    sendMessage,
    leaveRoom,
  } = useGameStore();
  const [isFlippingAfterDiscard, setIsFlippingAfterDiscard] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<"scoreboard" | "chat">("scoreboard");
  const [chatInput, setChatInput] = useState("");
  const router = useRouter();

  const mySessionId = room?.sessionId;
  const player = mySessionId ? players[mySessionId] : null;
  const isMyTurn = currentTurn === mySessionId;

  const otherPlayers = useMemo(
    () =>
      Object.entries(players)
        .filter(([id]) => id !== mySessionId)
        .map(([id, p]) => ({ id, player: p })),
    [players, mySessionId]
  );

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
    if (gameState === "starting" && player && !player.isReady) {
      revealInitialCard(index);
      return;
    }

    if (isMyTurn && gameState === "playing") {
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
    if (isMyTurn && gameState === "playing" && !drawnCard && !isFlippingAfterDiscard) {
      room?.send("drawFromDrawPile");
      // No local state needed; overlay will be derived from presence of drawnCard not on discard pile
    }
  };

  const handleDiscardPileClick = () => {
    if (isMyTurn && gameState === "playing" && !isFlippingAfterDiscard) {
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
  };

  if (!player) return <div>Loading player data...</div>;

  // Winner / Round summary overlay style presentation.
  if (winner || gameState === "finished") {
    return (
      <div className="flex flex-grow flex-col items-center justify-center space-y-6 rounded-lg bg-gray-900/80 p-6 text-center">
        {winner && (
          <div>
            <h2 className="text-5xl font-extrabold text-amber-400 drop-shadow">Game Over</h2>
            <p className="mt-4 text-2xl text-gray-200">
              Winner: <span className="font-semibold text-amber-300">{winner}</span>
            </p>
          </div>
        )}
        {gameState === "finished" && (
          <div>
            <h2 className="mb-4 text-3xl font-bold">Round Scores</h2>
            <div className="space-y-1">
              {scores &&
                Object.entries(scores)
                  .sort((a, b) => a[1] - b[1])
                  .map(([id, score]) => (
                    <p key={id} className="text-lg text-gray-300">
                      {players[id]?.name}: <span className="font-medium text-amber-200">{score}</span>
                    </p>
                  ))}
            </div>
            {!winner && <p className="mt-6 text-sm text-gray-400">Next round will start soon...</p>}
          </div>
        )}
      </div>
    );
  }

  // Phase & turn headline logic extracted for reuse.
  const phaseTitle =
    gameState === "starting"
      ? "Reveal two cards"
      : isMyTurn
        ? isFlippingAfterDiscard
          ? "Flip a card"
          : drawnCard
            ? "Choose: swap or discard"
            : "Your Turn"
        : `${players[currentTurn!]?.name}'s Turn`;

  return (
    <div className="flex flex-grow flex-col overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 md:p-5">
      {/* Top bar: other players (centered, wrapping) */}
      <div className="mb-3 flex flex-wrap items-start justify-center gap-4 border-b border-gray-700/60 pb-2">
        {otherPlayers.map(({ id, player: p }) => (
          <PlayerBoard key={id} player={p} isCurrentPlayer={currentTurn === id} compact />
        ))}
        {otherPlayers.length === 0 && <p className="px-2 text-xs text-gray-500">No other players yet...</p>}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Center play zone */}
        <div className="flex flex-1 flex-col">
          {/* Status / instructions (mobile inline) */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-100 md:text-xl">{phaseTitle}</h2>
            <div className="flex gap-3">
              {/* Turn indicator badge */}
              <div
                className={`rounded-full px-2 py-1 text-xs ${isMyTurn ? "border border-amber-400/40 bg-amber-400/20 text-amber-300" : "bg-gray-700/60 text-gray-300"}`}
              >
                {isMyTurn ? "Your turn" : "Waiting"}
              </div>
            </div>
          </div>

          {/* Central piles area */}
          <div className="flex flex-1 flex-col items-center justify-center gap-10 py-2 md:flex-row">
            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-1">
              {(() => {
                const count = drawPile.length;
                const isSelectedFromDraw = drawnCard && !drawnFromDiscard;
                // Single card & selected -> show placeholder instead of base card
                if (count === 1 && isSelectedFromDraw) {
                  return (
                    <div className="relative">
                      <div className="flex h-30 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-700 text-[11px] tracking-wide text-gray-400 uppercase opacity-80">
                        Draw
                      </div>
                      <div className="absolute -top-3 -right-4 rotate-[6deg]">
                        <Card card={drawnCard!} isSelected size="md" />
                      </div>
                    </div>
                  );
                }
                // Single card & not selected -> show the actual card
                if (count === 1) {
                  return (
                    <div className="relative">
                      <Card card={drawPile[0]} onClick={handleDrawPileClick} isSelected={true} size="md" />
                    </div>
                  );
                }
                // Multiple cards -> stacked representation
                if (count > 1 && isSelectedFromDraw) {
                  return (
                    <div className="relative">
                      <Card
                        card={drawPile[count - 2]}
                        onClick={isSelectedFromDraw ? undefined : handleDrawPileClick}
                        isSelected={true}
                        size="md"
                      />
                      <div className="absolute -right-1 -bottom-1 -z-10 h-30 w-20 rounded-xl border-2 border-gray-500 bg-gray-700/80" />
                      <div className="absolute -top-3 right-4 -rotate-[6deg]">
                        <Card card={drawnCard} isSelected size="md" />
                      </div>
                    </div>
                  );
                }
                // Not selected yet
                return (
                  <div className="relative">
                    <Card
                      card={drawPile[count - 1]}
                      onClick={isSelectedFromDraw ? undefined : handleDrawPileClick}
                      isSelected={false}
                      size="md"
                    />
                  </div>
                );
              })()}
              <span className="mt-1 flex items-center gap-1 text-xs tracking-wide text-gray-400 uppercase">
                <span>Draw</span>
                <span className="rounded bg-gray-700/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-200">
                  {drawPile.length}
                </span>
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
                      <div className="flex h-30 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-700 text-[11px] tracking-wide text-gray-400 uppercase opacity-80">
                        Discard
                      </div>
                      <div className="absolute -top-3 -right-4 rotate-[6deg]">
                        <Card card={drawnCard!} isSelected size="md" />
                      </div>
                    </div>
                  );
                }
                // Single card & not selected -> show the actual card
                if (count === 1) {
                  return (
                    <div className="relative">
                      <Card card={discardPile[0]} onClick={handleDiscardPileClick} isSelected={false} size="md" />
                    </div>
                  );
                }
                // Multiple cards -> stacked representation
                if (count > 1 && isSelectedFromDiscard) {
                  return (
                    <div className="relative">
                      <Card
                        card={discardPile[count - 2]}
                        onClick={isSelectedFromDiscard ? undefined : handleDiscardPileClick}
                        isSelected={false}
                        size="md"
                      />
                      <div className="absolute -right-1 -bottom-1 -z-10 h-30 w-20 rounded-xl border-2 border-gray-500 bg-gray-700/80" />
                      <div className="absolute -top-3 -right-4 rotate-[6deg]">
                        <Card card={discardPile[count - 1]} isSelected size="md" />
                      </div>
                    </div>
                  );
                }
                // Not selected yet
                return (
                  <div className="relative">
                    <Card
                      card={discardPile[count - 1]}
                      onClick={isSelectedFromDiscard ? undefined : handleDiscardPileClick}
                      isSelected={false}
                      size="md"
                    />
                  </div>
                );
              })()}
              <span className="mt-1 flex items-center gap-1 text-xs tracking-wide text-gray-400 uppercase">
                <span>Discard</span>
                <span className="rounded bg-gray-700/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-200">
                  {discardPile.length}
                </span>
              </span>
            </div>
          </div>

          {/* Instruction banner (moved below piles, above player board) */}
          {(isMyTurn && (drawnCard || isFlippingAfterDiscard)) || (gameState === "starting" && !player.isReady) ? (
            <div className="mx-auto mt-2 mb-3 w-full max-w-md px-4 py-3 text-sm text-gray-200">
              {gameState === "starting" && !player.isReady ? (
                <div>
                  <p className="mb-1 text-center font-semibold text-amber-300">Reveal Your Cards</p>
                  <p className="text-center">
                    Click {player.cards.filter((c: CardType) => c.isFlipped).length === 0 ? "two" : "one"} hidden
                    card(s) to reveal.
                  </p>
                </div>
              ) : isFlippingAfterDiscard ? (
                <p className="text-center">You discarded. Now flip one of your face-down cards.</p>
              ) : drawnCard && !drawnFromDiscard ? (
                <p className="text-center">
                  You drew <span className="font-medium text-amber-300">{drawnCard!.value}</span>. Swap with a board
                  card or discard it to flip instead.
                </p>
              ) : drawnCard && drawnFromDiscard ? (
                <p className="text-center">
                  You selected <span className="font-medium text-amber-300">{drawnCard!.value}</span> from discard. Swap
                  it with a card on your board.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Player Board at bottom (heading removed, score moved to sidebar) */}
          <div className="mt-auto flex flex-col items-center pt-3">
            <div className="inline-grid grid-cols-4 place-items-center gap-2 sm:gap-3">
              {player.cards.map((card: CardType, index: number) => (
                <Card key={index} card={card} onClick={() => handleBoardCardClick(index)} isSelected={false} />
              ))}
            </div>
          </div>
        </div>

        {/* Unified Sidebar with Tabs (phase card removed) */}
        <aside className="hidden w-64 flex-col gap-4 border-l border-gray-700/60 pl-4 lg:flex">
          {/* Your info panel */}
          <div className="rounded-lg border border-gray-700/70 bg-gray-800/70 p-3 shadow-sm">
            <p className="text-xs text-gray-300">
              Your Score: <span className="font-medium text-amber-300">{player.score}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex overflow-hidden rounded-lg border border-gray-700/70 bg-gray-800/70">
            <button
              onClick={() => setSidebarTab("scoreboard")}
              className={`flex-1 py-2 text-xs font-medium transition ${sidebarTab === "scoreboard" ? "bg-gray-700 text-amber-300" : "text-gray-300 hover:text-gray-100"}`}
            >
              Scoreboard
            </button>
            <button
              onClick={() => setSidebarTab("chat")}
              className={`flex-1 py-2 text-xs font-medium transition ${sidebarTab === "chat" ? "bg-gray-700 text-amber-300" : "text-gray-300 hover:text-gray-100"}`}
            >
              Chat
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700/70 bg-gray-800/60">
            {sidebarTab === "scoreboard" ? (
              <div className="scrollbar-thin scrollbar-thumb-gray-700/70 flex-1 space-y-1 overflow-y-auto p-3">
                {Object.entries(players).map(([id, p]) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between rounded px-2 py-1 text-sm ${id === currentTurn ? "border border-amber-300/30 bg-amber-400/15" : "bg-gray-700/40"} ${id === mySessionId ? "ring-1 ring-amber-300/30" : ""}`}
                  >
                    <span
                      className={`truncate ${id === mySessionId ? "font-medium text-amber-200" : "text-gray-200"}`}
                      title={p.name}
                    >
                      {id === mySessionId ? `You` : p.name}
                    </span>
                    <span className="font-mono text-xs text-gray-300">{p.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="scrollbar-thin scrollbar-thumb-gray-700/70 flex-1 space-y-1 overflow-y-auto p-3">
                  {messages.length === 0 && <div className="text-[11px] text-gray-400">No messages yet.</div>}
                  {messages.map((m, i) => (
                    <div key={i} className="rounded bg-gray-700/60 px-2 py-1 text-xs break-words text-gray-200">
                      {m}
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chatInput.trim()) {
                      sendMessage(chatInput);
                      setChatInput("");
                    }
                  }}
                  className="flex gap-2 border-t border-gray-700 p-2"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type..."
                    className="flex-1 rounded bg-gray-900/60 px-2 py-1 text-xs text-gray-100 outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-gray-900 transition hover:bg-amber-600 disabled:opacity-40"
                    disabled={!chatInput.trim()}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              leaveRoom();
              router.push("/");
            }}
            className="mt-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase shadow-lg transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Rage Quit
          </button>
        </aside>
      </div>
    </div>
  );
};

export default GameBoard;
