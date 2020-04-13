const WebSocket = require('ws');
const Ojyks = require('./ojyks')

const wss = new WebSocket.Server({ port: 8080 });
console.log("Starting server ...");

// const lobby = {
//     name: "",
//     creator: "",
//     state: "open|closed",
//     users: [ { name: "name", ws : socket]
// }

const lobbies = [];

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log(message);
        var data = JSON.parse(message);

        function send(ws, data) {
            ws.send(JSON.stringify(data));
        }

        function broadcast(data) {
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }

        function broadcastTest(clients, data) {
            console.log("br", clients.length)

            clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }

        function broadcastToLobby(lobbyName, data) {
            const lobby = lobbies.find(l => l.name == lobbyName);

            for (const user of lobby.users) {
                const ws = user.ws;

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            }
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

        switch (data.action) {
            case 'create-lobby': {
                // check if lobby already exists
                const exists = lobbies.filter(l => l.name === data.lobby).length;

                if (exists) {
                    ws.send(JSON.stringify({ type: 'response', action: 'create-lobby', state: 'error', errorMessage: `Lobby with name ${data.lobby} already exists, please use other name.`, user: data.user }))
                } else {
                    lobbies.push({
                        name: data.lobby,
                        creator: data.user,
                        state: 'open',
                        slots: 8,
                        users: [{ name: data.user, ws: ws }]
                    });

                    console.log(`Lobby ${data.lobby} was created by ${data.user}`);

                    ws.send(JSON.stringify({ type: 'response', action: 'create-lobby', state: 'success', user: data.user, lobby: data.lobby }))

                    broadcast({ type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                    // TODO send all other information about lobby
                }
            } break; // TODO send lobby update for all that are on lobby page
            case 'update-lobbies': {
                // returns all lobbies
                send(ws, { type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
            } break; // initial lobby update statement
            case 'join-lobby': {
                const { payload } = data;
                // check if lobby is full and lobby is open
                const results = lobbies.filter(l => l.name === payload.lobby);
                if (results.length === 0) {
                    broadcast({ type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                    send(ws, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was not found" })
                    return; // error
                }

                const lobby = results[0];
                if (lobby.state !== "open") {
                    broadcast({ type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                    send(ws, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby was closed" })
                    return; // error lobby not open
                }
                if (lobby.users.length >= (lobby.slots - 1)) {
                    broadcast({ type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });
                    send(ws, { type: "response", action: "join-lobby", state: "error", payload: null, errorMessge: "Lobby is full" })
                    return; // error lobby full
                }

                lobby.users.push({ name: payload.user, ws: ws });

                send(ws, { type: "response", action: "join-lobby", state: "success", payload: { lobby: payload.lobby } })

                // inform all about lobby update
                broadcast({ type: 'response', action: 'update-lobbies', payload: { lobbies: getLobbies() } });

                var usersWs = lobby.users.map(u => u.ws);
                broadcastTest(usersWs, { type: 'response', action: 'update-lobby', payload: { lobby: getLobby(payload.lobby) } })
            } break; // TODO -> refresh lobby for user that are already in lobby
            case 'update-lobby': {
                // user requests an update of the lobby data
                send(ws, { type: 'response', action: 'update-lobby', payload: { lobby: getLobby(data.payload.lobbyname) } })
            } break;
            case 'message-lobby': {
                const results = lobbies.filter(l => l.name === data.payload.lobby);
                if (results.length === 0) {
                    return; // error
                }

                const lobby = results[0];
                var usersWs = lobby.users.map(u => u.ws);
                broadcastTest(usersWs, { type: 'response', action: 'message-lobby', payload: data.payload })

            } break;
            case 'start-game': {
                const { payload } = data;
                const lobby = lobbies.find(l => l.name === payload.lobby);
                lobby.state = 'closed'

                console.log("create game for " + lobby.name)

                const playerNames = lobby.users.map(u => u.name);
                lobby.game = new Ojyks(playerNames);

                broadcastToLobby(lobby.name, { type: 'response', action: 'start-game', payload: { lobby: lobby.name} })
            }
            case 'game-state': {
                const { payload } = data;
                const lobby = lobbies.find(l => l.name === payload.lobby);

                send(ws, { type: 'response', action: 'game-state', payload: getCurrentGameState(lobby.game) })
            }
            case 'game-turn': {
                const { payload } = data;

                console.log(data)

                const lobby = lobbies.find(l => l.name === payload.lobby);
                const game = lobby.game;

                game.turn(payload.user, payload.source, payload.cardIndex);

                broadcastToLobby(lobby.name, { type: 'response', action: 'game-state', payload: getCurrentGameState(lobby.game) });               
            }
        }


        // ws.send(messENDage);
    });
});

// room
    // name
    // players
    // chats
    // gamestate
    // stats
    // can join -> only if dropp out

// room settings