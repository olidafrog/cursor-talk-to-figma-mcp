# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server that bridges AI coding assistants (Cursor, Claude Code) with Figma. The system has three components that communicate via WebSocket:

1. **MCP Server** (`src/talk_to_figma_mcp/server.ts`) — A ~4000-line TypeScript file that registers 60+ MCP tools and prompts. Uses stdio transport for MCP and connects to the relay as a WebSocket client. This is the main file you'll edit for adding tools.
2. **WebSocket Relay** (`src/talk_to_figma_mcp/relay.ts`) — Channel-based message broker using Bun's native WebSocket server on port 3055. Routes messages between MCP server and Figma plugin.
3. **Figma Plugin** (`src/cursor_mcp_plugin/`) — Plain JS plugin (`code.js` + `ui.html`) that runs inside Figma. Connects to the relay, receives commands, executes them via the Figma Plugin API, and returns results.

## Architecture: Communication Flow

```
AI Assistant → (stdio) → MCP Server → (WebSocket) → Relay Server → (WebSocket) → Figma Plugin
```

- The MCP server starts an **embedded relay** automatically on startup. If port 3055 is already in use, it assumes an external relay is running.
- Both MCP server and Figma plugin must **join the same channel** (`join_channel` tool) before commands work.
- Commands use a request/response pattern: `sendCommandToFigma()` sends a JSON message with a UUID, stores a pending promise, and resolves when the Figma plugin responds with the matching ID.
- Progress updates for long-running operations (batch text replacement, scanning) use a separate `command_progress` message type that resets timeouts.
- The `FigmaCommand` union type (server.ts ~line 3011) and `CommandParams` type must be extended when adding new commands.

## Build & Development Commands

```bash
bun install          # Install dependencies
bun run build        # Build with tsup (outputs to dist/)
bun run dev          # Build with watch mode
bun socket           # Start standalone WebSocket relay on port 3055
bun setup            # Install deps + create .cursor/mcp.json for Cursor
```

**For local development**, point your MCP client config directly at the source:
```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "bun",
      "args": ["/path-to-repo/src/talk_to_figma_mcp/server.ts"]
    }
  }
}
```

The MCP server accepts CLI flags: `--server=<host>`, `--port=<number>`, `--relay-only`.

## Key Conventions

- **Runtime**: Bun (not Node). The relay uses `Bun.serve()` natively.
- **Build**: tsup bundles `src/talk_to_figma_mcp/server.ts` into `dist/` (CJS + ESM). The Figma plugin is plain JS, not bundled.
- **Logging**: All logging goes to `stderr` (not stdout) via the `logger` object, since stdout is reserved for MCP stdio transport.
- **Tool pattern**: Each MCP tool follows the same structure — call `sendCommandToFigma(commandName, params)`, JSON-stringify the result, return it as text content. Errors are caught and returned as text, not thrown.
- **No test suite**: There are currently no automated tests in this project.
- **TypeScript strict mode is off** (`strict: false` in tsconfig).

## Adding a New MCP Tool

1. Add the command name to the `FigmaCommand` union type (~line 3011)
2. Add the params type to `CommandParams` (~line 3075)
3. Register the tool with `server.tool(name, description, zodSchema, handler)`
4. Implement the corresponding handler in the Figma plugin's `code.js`

## Figma Plugin Development

The plugin at `src/cursor_mcp_plugin/` is edited directly as `code.js` and `ui.html` — there is no build step. To install locally in Figma: Plugins > Development > New Plugin > Link existing plugin > select `manifest.json`. The plugin connects to `ws://localhost:3055`.

## Windows/WSL

Uncomment `hostname: "0.0.0.0"` in `src/talk_to_figma_mcp/relay.ts` (line ~150) to allow WSL connections.
