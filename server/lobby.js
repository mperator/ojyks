const Ojyks = require('./ojyks')
/* Manager lobbies, create, delete
*/

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
    switch (data.action) {
        case 'create-lobby': {
            // check if lobby already exists
            const exists = lobbies.filter(l => l.name === data.lobby).length;

            if (exists) {
                sender.send(JSON.stringify({ type: 'response', action: 'create-lobby', state: 'error', errorMessage: `Lobby with name ${data.lobby} already exists, please use other name.`, user: data.user }))
            } else {
                lobbies.push({
                    name: data.lobby,
                    creator: data.user,
                    state: 'open',
                    slots: 8,
                    users: [{ name: data.user, ws: sender }],
                    game: null,
                    scores: []
                });

                console.log(`Lobby ${data.lobby} was created by ${data.user}`);

                sender.send(JSON.stringify({ type: 'response', action: 'create-lobby', state: 'success', user: data.user, lobby: data.lobby }))
                broadcast(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                // TODO send all other information about lobby
            }
        } break; // TODO send lobby update for all that are on lobby page
        case 'update-lobbies': {
            // returns all lobbies
            send(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
        } break; // initial lobby update statement
        case 'join-lobby': {
            const { payload } = data;
            // check if lobby is full and lobby is open
            const results = lobbies.filter(l => l.name === payload.lobby);
            if (results.length === 0) {
                broadcast(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was not found" })
                return; // error
            }

            const lobby = results[0];
            if (lobby.state !== "open") {
                broadcast(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was closed" })
                return; // error lobby not open
            }
            if (lobby.users.length >= (lobby.slots - 1)) {
                broadcast(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                send(sender, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby is full" })
                return; // error lobby full
            }

            lobby.users.push({ name: payload.user, ws: sender });

            send(sender, { type: "response", action: "join-lobby", state: "success", payload: { lobby: payload.lobby } })

            // inform all about lobby update
            broadcast(sender, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });

            broadcastToLobby(null, lobby.name, { type: 'response', action: 'update-lobby', payload: { lobby: getLobby(payload.lobby) } })
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

            const playerNames = lobby.users.map(u => u.name);
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

    const clients = lobby.users.map(u => u.ws);
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
        users: l.users.length
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
        users: l.users.map(u => u.name),
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
