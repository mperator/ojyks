const Ojyks = require('./ojyks')
/* Contains lobby logic, manage lobbys, creation, auto cleanup
 * connections, connection loss and reconnections to lobby.
 * */

const lobbies = [];

// callbacks
let sendToHandler;

// methods
function registerSendCallback(callback) {
    this.sendToHandler = callback;
}

function handleDisconnect(sender) {
    const lobbiesContainingSender = lobbies && lobbies.filter(f => f.players.find(p => p.ws === sender))

    for (const lobby of lobbiesContainingSender) {
        const player = lobby.players.find(p => p.ws === sender);
        player.ws = null;

        console.log(`player [${player.name} |${player.uuid}] disconnected....`);

        if (lobby.game) {
            lobby.game.setPlayerNetworkState(player.uuid, false);

            broadcastToLobby(null, lobby.name, {
                type: 'response',
                action: 'game-state',
                payload: getCurrentGameState(lobby.game)
            });
        }
    }
}

function handleMessage(sender, data) {
    const { action, payload } = data;
    switch (action) {
        case 'reconnect':
            /* if the player reconnects the player should automatically navigate to the site he was on before losing 
             * the websocket connection but als depending on the current state of the lobby. 
             * */
            {
                // get lobby player is in by the players uuid
                const lobby = lobbies && lobbies.find(l => l.players.find(p => p.uuid === payload.player.uuid));

                if (lobby) {
                    // get player with uuid
                    const player = lobby.players.find(p => p.uuid === payload.player.uuid);
                    player.ws = sender;

                    // response with lobby and game state
                    const gameState = lobby.game ? lobby.game.state : 'score';

                    sendDirectResponse(sender, {
                        type: 'response',
                        action: 'reconnect',
                        state: 'success',
                        payload: {
                            player: {
                                uuid: payload.player.uuid
                            },
                            lobby: lobby.name,
                            gameState: gameState,
                        }
                    });
                } else {
                    // the player was not connect to lobby yet.
                    sendDirectResponse(sender, {
                        type: 'response',
                        action: 'reconnect',
                        state: 'success',
                        payload: {
                            player: {
                                uuid: payload.player.uuid
                            },
                            lobby: null,
                            gameState: null,
                        }
                    });
                }
            }
            break;

        case 'lobby-create':
            // a player requests to create a new lobby.
            const lobby = lobbies && lobbies.find(l => l.name === payload.lobby);

            if (lobby) {
                sendDirectResponse(sender, {
                    type: 'response',
                    action: 'lobby-create',
                    state: 'error',
                    errorMessage: `Lobby with name ${payload.lobby} already exists, please use other name`,
                    payload: null
                })
            } else {
                const lobbyName = payload.lobby;
                const playerName = payload.player.name;
                const playerUUID = payload.player.uuid;

                // create new lobby if not exists.
                const newLobby = {
                    name: lobbyName,
                    creator: playerName,
                    state: 'open',
                    slots: 8,
                    players: [{ name: playerName, uuid: playerUUID, ws: sender, scores: [] }],
                    game: new Ojyks()
                };
                lobbies.push(newLobby);

                console.log(`Lobby ${lobbyName} was created by ${playerName}`);

                // respond to creator
                sendDirectResponse(sender, {
                    type: 'response',
                    action: 'lobby-create',
                    state: 'success',
                    payload: { lobby: getLobbyDTO(lobbyName) }
                });

                // update lobby overview for all connected players.
                // TODO: only need to broadcast to players that are not in lobby yet.
                broadcast(sender, createResponseLobbyOverview());
            }
            break;
        case 'lobby-overview':
            // a player requests the lobby overview data.
            sendDirectResponse(sender, createResponseLobbyOverview());
            break;
        case 'lobby-leave':
            const lobbyToLeave = lobbies && lobbies.find(l => l.name === payload.lobby);

            const pid = lobbyToLeave.players.findIndex(p => p.uuid === payload.player.uuid);
            const removedPlayer = lobbyToLeave.players.splice(pid, 1)[0];
            
            if (lobbyToLeave.game && lobbyToLeave.game.state !== 'init') {
                // remove player from game
                lobbyToLeave.game.removePlayer(payload.player.uuid);
                if (lobbyToLeave.game.state === 'active') {
                    broadcastToLobby(null, lobbyToLeave.name, {
                        type: 'response',
                        action: 'game-state',
                        payload: getCurrentGameState(lobbyToLeave.game)
                    });
                }
            }

            sendDirectResponse(sender, {
                type: "response",
                action: "lobby-leave",
                state: "success",
                payload: null
            });

            if(removedPlayer.name === lobbyToLeave.creator) {
                /// change to other player in the 
                if(lobbyToLeave.players.length > 0) {
                    lobbyToLeave.creator = lobbyToLeave.players[0].name;
                }
            }

            // notifiy lobby
            broadcastToLobby(null, lobbyToLeave.name, createResponseLobbyUpdate(lobbyToLeave.name));

            if(lobbyToLeave.players.length === 0) {
                // delete lobby
                const lid = lobbies.findIndex(l => l.name === lobbyToLeave.name);
                lobbies.splice(lid, 1);
            }

            broadcast(sender, createResponseLobbyOverview());

            break;
        case 'lobby-join':
            // a player requests to join the lobby.
            const lobbyToJoin = lobbies && lobbies.find(l => l.name === payload.lobby);
            if (!lobbyToJoin) {
                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "error",
                    errorMessage: "Lobby was not found",
                    payload: null
                });
            } else if (lobbyToJoin.state !== "open") {
                // player does not exists or exists and is already connected
                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "error",
                    errorMessage: "Lobby is not open anymore.",
                    payload: null
                });
            } else if (lobbyToJoin.players.length >= (lobbyToJoin.slots)) {
                // does not exist and lobby is full
                // or player exists and is already connected
                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "error",
                    errorMessage: "Maximum player count reached.",
                    payload: null
                });

            } else {
                lobbyToJoin.players.push({
                    name: payload.player.name,
                    uuid: payload.player.uuid,
                    ws: sender,
                    scores: []
                });

                const lobbyName = payload.lobby;

                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "success",
                    payload: {
                        lobby: getLobbyDTO(lobbyName),
                    }
                });

                broadcastToLobby(null, lobbyName, createResponseLobbyUpdate(lobbyName));
            }

            // update lobby overview for all connected players 
            // TODO: only need to broadcast to players that are not in lobby yet.
            broadcast(sender, createResponseLobbyOverview());
            break;
        case 'lobby-update':
            // user requests an update of a specific lobby
            sendDirectResponse(sender, createResponseLobbyUpdate(payload.lobby));
            break;
        case 'lobby-message':
            const lobbyToMessage = lobbies && lobbies.find(l => l.name === payload.lobby);
            if (!lobbyToMessage) return

            broadcastToLobby(sender, lobbyToMessage.name, { type: 'response', action: 'lobby-message', payload: payload })
            break;

        // messages for game start
        case 'game-start':
            // a player requests to start the game
            const lobbyToStartGame = lobbies.find(l => l.name === payload.lobby);
            lobbyToStartGame.state = 'closed'

            const playerNames = lobbyToStartGame.players.map(u => ({ name: u.name, uuid: u.uuid }));
            lobbyToStartGame.game.tryInit(playerNames)
            lobbyToStartGame.game.start();

            broadcastToLobby(null, lobbyToStartGame.name, {
                type: 'response',
                action: 'game-start',
                payload: { lobby: lobbyToStartGame.name }
            });
            break;

        case 'game-state':
            // a player requests the current game state
            const lobbyGameState = lobbies.find(l => l.name === payload.lobby);

            // if player currently was offline and reconnect
            // set player to online 
            if (lobbyGameState.game) {
                lobbyGameState.game.setPlayerNetworkState(payload.player.uuid, true);

                broadcastToLobby(null, lobbyGameState.name, {
                    type: 'response',
                    action: 'game-state',
                    payload: getCurrentGameState(lobbyGameState.game)
                });
            }

            sendDirectResponse(sender, {
                type: 'response',
                action: 'game-state',
                payload: getCurrentGameState(lobbyGameState.game)
            });
        case 'game-turn': {
            // a player executes a game turn.
            const lobbyGameTurn = lobbies.find(l => l.name === payload.lobby);
            const game = lobbyGameTurn.game;

            if (game.state === "score") {
                console.log("execution on game end!!!!")
                return;
            }

            game.turn(payload.user, payload.source, payload.cardIndex);

            broadcastToLobby(null, lobbyGameTurn.name, {
                type: 'response',
                action: 'game-state',
                payload: getCurrentGameState(lobbyGameTurn.game)
            });
        }
    }
}

module.exports = {
    registerSendCallback,
    handleDisconnect,
    handleMessage
}

// send message to client.
function sendDirectResponse(client, data) {
    client.send(JSON.stringify(data));
}

// creates an response object send updated lobby overiew.
function createResponseLobbyOverview() {
    // create dto
    const _lobbies = lobbies.map(l => ({
        name: l.name,
        creator: l.creator,
        state: l.state,
        slots: 8,
        players: l.players.map(u => ({ name: u.name, uuid: u.uuid })),
    }));

    return {
        type: 'response',
        action: 'lobby-overview',
        payload: {
            lobbies: _lobbies
        }
    }
}

// create lobby update response.
function createResponseLobbyUpdate(lobbyName) {
    return {
        type: 'response',
        action: 'lobby-update',
        payload: {
            lobby: getLobbyDTO(lobbyName)
        }
    };
}

// create lobby dto.
function getLobbyDTO(lobbyName) {
    const lobby = lobbies.find(l => l.name === lobbyName);
    if (!lobby) return null;

    return {
        name: lobby.name,
        creator: lobby.creator,
        state: lobby.state,
        slots: lobby.slots,
        players: lobby.players.map(u => u.name),
        game: null,
        scores: lobby.game && lobby.game.getScores()
    };
}

function send(sender, data) {
    sender.send(JSON.stringify(data));
}

function broadcast(sender, data) {
    this.sendToHandler(sender, null, data);
}

function broadcastToLobby(sender, lobbyName, data) {
    const lobby = lobbies.find(l => l.name == lobbyName);

    const clients = lobby.players.map(u => u.ws);
    this.sendToHandler(sender, clients, data);
}

function getCurrentGameState(game) {
    return {
        drawPile: game.drawPile,
        discardPile: game.discardPile,
        players: game.players.filter(p => !p.deleted),
        currentPlayer: game.currentPlayer
    }
}
