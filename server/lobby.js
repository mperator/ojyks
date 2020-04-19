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
                    payload: { lobby: newLobby }
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
        case 'join-lobby': {
            const { payload } = data;

            let error = false;
            // check if lobby is full and lobby is open.
            const results = lobbies.filter(l => l.name === payload.lobby);
            if (results.length === 0) {
               
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was not found" })
                error = true; // error
            }

            const lobby = results[0];
            if (lobby.state !== "open") {
                
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was closed" })
                error = true; // error lobby not open
            }
            if (lobby.players.length >= (lobby.slots - 1)) {
                
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby is full" })
                error = true; // error lobby full
            }

            if(!error) {
                lobby.players.push({ name: payload.user, ws: sender });
                send(sender, { type: "response", action: "join-lobby", state: "success", payload: { lobby: payload.lobby } })
                broadcastToLobby(null, lobby.name, { type: 'response', action: 'update-lobby', payload: { lobby: getLobby(payload.lobby) } })
            }

            
            // update lobby overview for all connected players 
            // TODO: only need to broadcast to players that are not in lobby yet.
            broadcast(sender, createResponseLobbyOverview());

        } break; // TODO -> refresh lobby for user that are already in lobby
        case 'update-lobby': {
            // user requests an update of the lobby data
            send(sender, { type: 'response', action: 'update-lobby', payload: { lobby: getLobby(data.payload.lobbyname) } })
        } break;
        case 'message-lobby': {
            // const results = lobbies.filter(l => l.name === data.payload.lobby);
            // if (results.length === 0) {
            //     return; // error
            // }

            // const lobby = results[0];
            // var usersWs = lobby.users.map(u => u.ws);
            const { payload } = data;
            const lobby = lobbies.find(l => l.name === payload.lobby);
            broadcastToLobby(sender, lobby.name, { type: 'response', action: 'message-lobby', payload: data.payload })

        } break;
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

function broadcastTest(sender, clients, data) {
    // console.log("br", clients.length)

    // clients.forEach(function each(client) {
    //     if (client !== sender && client.readyState === WebSocket.OPEN) {
    //         client.send(JSON.stringify(data));
    //     }
    // });
    this.sendToHandler(null, clients, data);
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


function getLobbies() {
    const tmp = lobbies.map(l => ({
        name: l.name,
        creator: l.creator,
        state: l.state,
        slots: 8,
        users: l.players.length
    }));

    return tmp;
}


function getLobby(lobbyname) {
    const results = lobbies.filter(l => l.name === lobbyname);
    if (results.length === 0) return null;

    return results.map(l => ({
        name: l.name,
        creator: l.creator,
        state: l.state,
        slots: l.slots,
        users: l.players.map(u => u.name),
        game: null,
        scores: []
    }))[0];
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
