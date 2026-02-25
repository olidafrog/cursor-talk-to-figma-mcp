#!/usr/bin/env bun

/**
 * Standalone WebSocket relay server.
 *
 * This script starts the relay server independently.
 * You can also run the relay embedded in the MCP server (default behavior).
 *
 * Usage:
 *   bun socket              # Start relay on default port 3055
 *   bun socket --port=3056  # Start relay on custom port
 */

import { startRelayServer } from "./talk_to_figma_mcp/relay.js";

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3055;

// Start the relay server
startRelayServer(port)
  .then(({ port: actualPort }) => {
    console.log(`WebSocket relay server running on port ${actualPort}`);
    console.log('Press Ctrl+C to stop.');
  })
  .catch((error) => {
    console.error(`Failed to start relay server: ${error.message}`);
    process.exit(1);
  });
