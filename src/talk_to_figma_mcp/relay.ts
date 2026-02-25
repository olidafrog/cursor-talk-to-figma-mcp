import { Server, ServerWebSocket } from "bun";

// Store clients by channel
const channels = new Map<string, Set<ServerWebSocket<unknown>>>();

// Logger that writes to stderr to avoid interfering with MCP stdio
const relayLogger = {
  info: (message: string) => process.stderr.write(`[RELAY] ${message}\n`),
  error: (message: string) => process.stderr.write(`[RELAY ERROR] ${message}\n`),
  debug: (message: string) => process.stderr.write(`[RELAY DEBUG] ${message}\n`),
};

function handleConnection(ws: ServerWebSocket<unknown>) {
  relayLogger.info("New client connected");

  // Send welcome message to the new client
  ws.send(JSON.stringify({
    type: "system",
    message: "Please join a channel to start chatting",
  }));
}

function handleMessage(ws: ServerWebSocket<unknown>, message: string | Buffer) {
  try {
    const data = JSON.parse(message as string);
    relayLogger.debug(`Received: type=${data.type}, channel=${data.channel || 'N/A'}`);

    if (data.type === "join") {
      const channelName = data.channel;
      if (!channelName || typeof channelName !== "string") {
        ws.send(JSON.stringify({
          type: "error",
          message: "Channel name is required"
        }));
        return;
      }

      // Create channel if it doesn't exist
      if (!channels.has(channelName)) {
        channels.set(channelName, new Set());
      }

      // Add client to channel
      const channelClients = channels.get(channelName)!;
      channelClients.add(ws);

      relayLogger.info(`Client joined channel "${channelName}" (${channelClients.size} total clients)`);

      // Notify client they joined successfully
      ws.send(JSON.stringify({
        type: "system",
        message: `Joined channel: ${channelName}`,
        channel: channelName
      }));

      ws.send(JSON.stringify({
        type: "system",
        message: {
          id: data.id,
          result: "Connected to channel: " + channelName,
        },
        channel: channelName
      }));

      // Notify other clients in channel
      channelClients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "system",
            message: "A new user has joined the channel",
            channel: channelName
          }));
        }
      });
      return;
    }

    // Handle regular messages
    if (data.type === "message") {
      const channelName = data.channel;
      if (!channelName || typeof channelName !== "string") {
        ws.send(JSON.stringify({
          type: "error",
          message: "Channel name is required"
        }));
        return;
      }

      const channelClients = channels.get(channelName);
      if (!channelClients || !channelClients.has(ws)) {
        ws.send(JSON.stringify({
          type: "error",
          message: "You must join the channel first"
        }));
        return;
      }

      // Broadcast to all OTHER clients in the channel (not the sender)
      let broadcastCount = 0;
      channelClients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          broadcastCount++;
          const broadcastMessage = {
            type: "broadcast",
            message: data.message,
            sender: "peer",
            channel: channelName
          };
          client.send(JSON.stringify(broadcastMessage));
        }
      });

      if (broadcastCount === 0) {
        relayLogger.debug(`No other clients in channel "${channelName}" to receive message`);
      } else {
        relayLogger.debug(`Broadcast to ${broadcastCount} peer(s) in channel "${channelName}"`);
      }
    }
  } catch (err) {
    relayLogger.error(`Error handling message: ${err}`);
  }
}

function handleClose(ws: ServerWebSocket<unknown>) {
  // Remove client from their channel
  channels.forEach((clients, channelName) => {
    if (clients.has(ws)) {
      clients.delete(ws);
      relayLogger.info(`Client left channel "${channelName}" (${clients.size} remaining)`);
    }
  });
}

export interface RelayServerResult {
  server: Server;
  port: number;
}

/**
 * Starts the WebSocket relay server on the specified port.
 *
 * @param port - The port to listen on (default: 3055)
 * @returns Promise that resolves with the server instance, or rejects if port is in use
 */
export async function startRelayServer(port: number = 3055): Promise<RelayServerResult> {
  return new Promise((resolve, reject) => {
    try {
      const server = Bun.serve({
        port,
        // hostname: "0.0.0.0", // Uncomment for Windows WSL
        fetch(req: Request, server: Server) {
          // Handle CORS preflight
          if (req.method === "OPTIONS") {
            return new Response(null, {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            });
          }

          // Handle WebSocket upgrade
          const success = server.upgrade(req, {
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          });

          if (success) {
            return; // Upgraded to WebSocket
          }

          // Return response for non-WebSocket requests
          return new Response("WebSocket relay server running", {
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          });
        },
        websocket: {
          open: handleConnection,
          message: handleMessage,
          close: handleClose,
        },
        error(error) {
          // Handle startup errors (like port in use)
          if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
            reject(new Error(`Port ${port} is already in use`));
          } else {
            reject(error);
          }
          return new Response("Server error", { status: 500 });
        },
      });

      relayLogger.info(`WebSocket relay server running on port ${server.port}`);
      resolve({ server, port: server.port });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if a relay server is already running on the specified port.
 */
export async function isRelayRunning(port: number = 3055): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}
