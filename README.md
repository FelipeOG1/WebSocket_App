# WebSocket Server Implementation in Node.js

This repository contains a **WebSocket server** implemented from scratch using **Node.js**. The server follows the **RFC 6455** protocol and provides functionalities such as message handling, echo responses, and proper connection closure. It also includes an **interactive HTML interface** to test WebSocket features.

---

## Features

- **Handshake Management**: Validates WebSocket upgrade requests and completes the handshake.
- **Frame Processing**: Handles WebSocket frames, including:
  - Text and binary frames.
  - Fragmented frames.
  - Control frames (e.g., close frames).
- **Echo Functionality**: Sends back received messages to the client.
- **Connection Closure**: Properly handles connection closure with status codes and reasons.
- **Custom Error Handling**: Catches and logs errors for better debugging.
- **Interactive Testing Interface**: Includes an `index.html` file to test WebSocket functionalities in a browser.

---

## Project Structure
/project-root
├── /server
│   ├── /custom_lib
│   │   ├── websocket_constants.js    # WebSocket-related constants.
│   │   └── websocket_methods.js      # Helper functions for WebSocket operations.
│   ├── websocketReceiver.js          # Handles WebSocket frame processing.
│   ├── httpServer.js                 # Main WebSocket server logic.
│   └── app.js                        # Entry point for the server.
├── index.html                        # Interactive interface for testing WebSocket features.
├── styles.css                        # CSS styles for the interactive interface.
└── README.md                         # This file.

## Modules and Classes

### **1. `httpServer.js`**
This module contains the logic for creating an HTTP server that supports WebSocket upgrade requests. It handles:
- HTTP server creation.
- WebSocket handshake validation.
- Connection upgrades to WebSocket.
- Error handling for custom events.

#### Key Functions:
- **`createHTTPServer()`**: Creates and configures the HTTP server.
- **`upgradeConnection()`**: Validates WebSocket headers and completes the handshake.
- **`startWebSocketConnection()`**: Initializes WebSocket communication after a successful handshake.

---

### **2. `websocketReceiver.js`**
This module contains the `WebSocketReceiver` class, which processes WebSocket frames and handles communication with the client.

#### Key Features:
- **Frame Parsing**: Extracts information from WebSocket frames (FIN, opcode, masking, payload length, etc.).
- **Payload Unmasking**: Unmasks payload data using the provided masking key.
- **Echo Functionality**: Sends received messages back to the client.
- **Connection Closure**: Handles close frames and responds with a proper close frame.

#### Key Methods:
- **`processBuffer()`**: Processes incoming data chunks.
- **`#sendEcho()`**: Sends an echo response to the client.
- **`#sendClose()`**: Handles connection closure according to RFC 6455.
- **`#reset()`**: Resets the state of the receiver for new connections.

---

### **3. `app.js`**
This is the entry point of the application. It initializes the HTTP server and starts listening for WebSocket connections.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FelipeOG1/WebSocket_App.git
  
2. Start the server:
 ```bash
 node server/app.js
