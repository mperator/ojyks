const WebSocket = require('ws');


const { registerSendCallback, handleDisconnect, handleMessage } = require('./lobby');

const port = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: port });
console.log("Starting server ...");

// register callbacks with lobby
registerSendCallback(send);

function send(sender, clients, data) {
    if(!clients) clients = wss.clients;

    if(clients.length === 0) return;

    for(const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}

wss.on('connection', (ws) => {
    ws.on('close', (message) => {
        // propagate event to lobby
        handleDisconnect(ws, message);
    });

    ws.on('message', (message) => {
        console.log(message);

        var data = JSON.parse(message);
        handleMessage(ws, data);
    });
});