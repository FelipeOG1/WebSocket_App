This repository contains a **WebSocket server** implemented from scratch using **Node.js**. The server follows the **RFC 6455** protocol and provides functionalities such as message handling, echo responses, and proper connection closure.

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

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FelipeOG1/WebSocket_App.git
   cd WebSocket_App
2. Start the server:
 ```bash
 node server/app.js

3. The server will start listening on port 8080 (or the port specified in CONSTANTS.PORT).


## Usage

Testing with the Interactive Interface
The repository includes an index.html file that provides a user-friendly interface to test WebSocket functionalities. To use it:

Open the index.html file in your browser.

Click the "Open WS" button to establish a WebSocket connection.

Use the form to send messages to the server. The server will echo the messages back.

Click the "Close Connection" button to close the WebSocket connection.

Use the "Prepopulate" button to test sending large payloads.

Features of the Interface:
Open WS: Establishes a WebSocket connection.

Send Message: Sends a message to the server and displays the echoed response.

Close Connection: Closes the WebSocket connection gracefully.

Prepopulate: Automatically fills the message field with a large payload for testing.

project-root
├── /custom_lib
│   ├── websocket_constants.js    # WebSocket-related constants.
│   └── websocket_methods.js      # Helper functions for WebSocket operations.
├── /src
│   ├── websocketReceiver.js      # Handles WebSocket frame processing.
│   ├── websocketServer.js        # Main WebSocket server logic.
│   └── index.js                  # Entry point for the server.
├── index.html                    # Interactive interface for testing WebSocket features.
├── LICENSE                       # MIT License.
└── README.md                     # This file.
