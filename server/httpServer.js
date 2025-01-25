const HTTP = require('http');
const CONSTANTS = require('./custom_lib/websocket_constants');
const FUNCTIONS = require('./custom_lib/websocket_methods');
const WebSocketReceiver = require('./websocketReceiver'); // Importa la clase WebSocketReceiver

function createHTTPServer() {
    const HTTP_SERVER = HTTP.createServer((req, res) => {
        res.writeHead(200);
        res.end('=');
    });

    HTTP_SERVER.listen(CONSTANTS.PORT, () => {
        console.log("The HTTP server is listening on port " + CONSTANTS.PORT);
    });

    // Manejo de errores globales
    CONSTANTS.CUSTOM_ERRORS.forEach(errorEvent => {
        process.on(errorEvent, (err) => {
            console.log(`My code caught an error event: ${errorEvent}. Here's the error object`, err);
            process.exit(1);
        });
    });

    // Manejo de solicitudes de actualización a WebSocket
    HTTP_SERVER.on('upgrade', (req, socket, head) => {
        const upgradeHeaderCheck = req.headers['upgrade'].toLowerCase() === CONSTANTS.UPGRADE;
        const connectionHeaderCheck = req.headers['connection'].toLowerCase() === CONSTANTS.CONNECTION;
        const methodCheck = req.method === CONSTANTS.METHOD;
        const originCheck = FUNCTIONS.checkOrigin(req.headers['origin']);

        if (FUNCTIONS.check(socket, upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck)) {
            upgradeConnection(req, socket, head);
        }
    });

    return HTTP_SERVER;
}

function upgradeConnection(req, socket, head) {
    const clientKey = req.headers['sec-websocket-key'];
    const headers = FUNCTIONS.CreateUpgradeHeaders(clientKey);
    socket.write(headers);

    startWebSocketConnection(socket);
}

function startWebSocketConnection(socket) {
    const receiver = new WebSocketReceiver(socket);

    socket.on('data', (chunks) => {
        receiver.processBuffer(chunks);
    });

    socket.on('end', () => {
        console.log('User disconnected from the client');
    });
}

module.exports = createHTTPServer;