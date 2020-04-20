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
    //this.sendToHandler("disconnect")
}

function handleMessage(sender, data) {
    const { action, payload } = data;
    switch (action) {
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

                // create new lobby if not exists.
                const newLobby = {
                    name: lobbyName,
                    creator: playerName,
                    state: 'open',
                    slots: 8,
                    players: [{ name: playerName, ws: sender, scores: [] }],
                    game: null
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
                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "error",
                    errorMessage: "Lobby is not open anymore.",
                    payload: null
                });
            } else if (lobbyToJoin.players.length >= (lobbyToJoin.slots)) {
                sendDirectResponse(sender, {
                    type: "response",
                    action: "lobby-join",
                    state: "error",
                    errorMessage: "Maximum player count reached.",
                    payload: null
                });
            } else {
                lobbyToJoin.players.push({ name: payload.player.name, ws: sender, scores: [] });

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
            if(!lobbyToMessage) return
            
            broadcastToLobby(sender, lobbyToMessage.name, { type: 'response', action: 'lobby-message', payload: payload })
        break;

        
        case 'start-game': {
            const { payload } = data;
            const lobby = lobbies.find(l => l.name === payload.lobby);
            lobby.state = 'closed'

            console.log("create game for " + lobby.name)

            const playerNames = lobby.players.map(u => u.name);
            lobby.game = new Ojyks(playerNames);

            broadcastToLobby(null, lobby.name, { type: 'response', action: 'start-game', payload: { lobby: lobby.name } })
        }
        case 'game-state': {
            const { payload } = data;
            const lobby = lobbies.find(l => l.name === payload.lobby);

            send(sender, { type: 'response', action: 'game-state', payload: getCurrentGameState(lobby.game) })
        }
        case 'game-turn': {
            const { payload } = data;

            console.log(data)

            const lobby = lobbies.find(l => l.name === payload.lobby);
            const game = lobby.game;

            game.turn(payload.user, payload.source, payload.cardIndex);

            // game end -> score board
            const scoreBoard = game.getScoreBoard();
            if (scoreBoard) {
                // set score board to lobby

                lobby.scores = [...lobby.scores, scoreBoard];
            }

            broadcastToLobby(null, lobby.name, { type: 'response', action: 'game-state', payload: getCurrentGameState(lobby.game) });
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
        playerCount: l.players.length
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
        scores: []
    };
}

function send(sender, data) {
    sender.send(JSON.stringify(data));
}

function broadcast(sender, data) {
    // wss.clients.forEach(function each(client) {
    //     if (client !== ws && client.readyState === WebSocket.OPEN) {
    //         client.send(JSON.stringify(data));
    //     }
    // });

    this.sendToHandler(sender, null, data);
}

function broadcastToLobby(sender, lobbyName, data) {
    const lobby = lobbies.find(l => l.name == lobbyName);

    const clients = lobby.players.map(u => u.ws);
    this.sendToHandler(sender, clients, data);

    // for (const user of lobby.users) {
    //     const ws = user.ws;

    //     if (ws.readyState === WebSocket.OPEN) {
    //         ws.send(JSON.stringify(data));
    //     }
    // }
}



function getCurrentGameState(game) {
    return {
        // drawPileCount: game.drawPile.length,
        // drawPileTopCard: null,
        drawPile: game.drawPile,
        discardPile: game.discardPile,
        players: game.players,
        currentPlayer: game.currentPlayer
    }
}
