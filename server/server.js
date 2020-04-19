/* Server logic, mainly handles socket connection handling and 
 * sending and receiving messages from socket.
 * */

const WebSocket = require('ws');
const { registerSendCallback, handleDisconnect, handleMessage } = require('./lobby');

// define port to listen to, use env setting if specified.
const port = process.env.PORT || 3001;

// create new websocket server, listen on specified port.
const wss = new WebSocket.Server({ port: port });
console.log("Starting server ...");

// register callbacks with lobby
registerSendCallback(send);

/* send data to webserver, 
 * to broadcast to all connected clients set clients to null,
 * to include messages back to sender set sender to null,
 * to broadcast to specific connecgted clients only set clients,
 * data must be object data and will be serialized to JSON for 
 * sending.
 * */
function send(sender, clients, data) {
    if(!clients) clients = wss.clients;

    if(clients.length === 0) return;

    for(const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}

// listen to socket and delegate data
wss.on('connection', (ws) => {
    ws.on('close', (message) => {
        // delegate event to lobby
        handleDisconnect(ws, message);
    });

    ws.on('message', (message) => {
        console.log(message);

        // parse string message data to object and 
        // delagate message to lobby.
        var data = JSON.parse(message);
        handleMessage(ws, data);
    });
});