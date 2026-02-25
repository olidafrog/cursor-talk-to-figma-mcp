#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/talk_to_figma_mcp/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_zod = require("zod");
var import_ws = __toESM(require("ws"), 1);
var import_uuid = require("uuid");

// src/talk_to_figma_mcp/relay.ts
var channels = /* @__PURE__ */ new Map();
var relayLogger = {
  info: (message) => process.stderr.write(`[RELAY] ${message}
`),
  error: (message) => process.stderr.write(`[RELAY ERROR] ${message}
`),
  debug: (message) => process.stderr.write(`[RELAY DEBUG] ${message}
`)
};
function handleConnection(ws2) {
  relayLogger.info("New client connected");
  ws2.send(JSON.stringify({
    type: "system",
    message: "Please join a channel to start chatting"
  }));
}
function handleMessage(ws2, message) {
  try {
    const data = JSON.parse(message);
    relayLogger.debug(`Received: type=${data.type}, channel=${data.channel || "N/A"}`);
    if (data.type === "join") {
      const channelName = data.channel;
      if (!channelName || typeof channelName !== "string") {
        ws2.send(JSON.stringify({
          type: "error",
          message: "Channel name is required"
        }));
        return;
      }
      if (!channels.has(channelName)) {
        channels.set(channelName, /* @__PURE__ */ new Set());
      }
      const channelClients = channels.get(channelName);
      channelClients.add(ws2);
      relayLogger.info(`Client joined channel "${channelName}" (${channelClients.size} total clients)`);
      ws2.send(JSON.stringify({
        type: "system",
        message: `Joined channel: ${channelName}`,
        channel: channelName
      }));
      ws2.send(JSON.stringify({
        type: "system",
        message: {
          id: data.id,
          result: "Connected to channel: " + channelName
        },
        channel: channelName
      }));
      channelClients.forEach((client) => {
        if (client !== ws2 && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "system",
            message: "A new user has joined the channel",
            channel: channelName
          }));
        }
      });
      return;
    }
    if (data.type === "message") {
      const channelName = data.channel;
      if (!channelName || typeof channelName !== "string") {
        ws2.send(JSON.stringify({
          type: "error",
          message: "Channel name is required"
        }));
        return;
      }
      const channelClients = channels.get(channelName);
      if (!channelClients || !channelClients.has(ws2)) {
        ws2.send(JSON.stringify({
          type: "error",
          message: "You must join the channel first"
        }));
        return;
      }
      let broadcastCount = 0;
      channelClients.forEach((client) => {
        if (client !== ws2 && client.readyState === WebSocket.OPEN) {
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
function handleClose(ws2) {
  channels.forEach((clients, channelName) => {
    if (clients.has(ws2)) {
      clients.delete(ws2);
      relayLogger.info(`Client left channel "${channelName}" (${clients.size} remaining)`);
    }
  });
}
async function startRelayServer(port = 3055) {
  return new Promise((resolve, reject) => {
    try {
      const server2 = Bun.serve({
        port,
        // hostname: "0.0.0.0", // Uncomment for Windows WSL
        fetch(req, server3) {
          if (req.method === "OPTIONS") {
            return new Response(null, {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
              }
            });
          }
          const success = server3.upgrade(req, {
            headers: {
              "Access-Control-Allow-Origin": "*"
            }
          });
          if (success) {
            return;
          }
          return new Response("WebSocket relay server running", {
            headers: {
              "Access-Control-Allow-Origin": "*"
            }
          });
        },
        websocket: {
          open: handleConnection,
          message: handleMessage,
          close: handleClose
        },
        error(error) {
          if (error.code === "EADDRINUSE") {
            reject(new Error(`Port ${port} is already in use`));
          } else {
            reject(error);
          }
          return new Response("Server error", { status: 500 });
        }
      });
      relayLogger.info(`WebSocket relay server running on port ${server2.port}`);
      resolve({ server: server2, port: server2.port });
    } catch (error) {
      reject(error);
    }
  });
}

// src/talk_to_figma_mcp/server.ts
var logger = {
  info: (message) => process.stderr.write(`[INFO] ${message}
`),
  debug: (message) => process.stderr.write(`[DEBUG] ${message}
`),
  warn: (message) => process.stderr.write(`[WARN] ${message}
`),
  error: (message) => process.stderr.write(`[ERROR] ${message}
`),
  log: (message) => process.stderr.write(`[LOG] ${message}
`)
};
var ws = null;
var pendingRequests = /* @__PURE__ */ new Map();
var currentChannel = null;
var server = new import_mcp.McpServer({
  name: "TalkToFigmaMCP",
  version: "1.0.0"
});
var args = process.argv.slice(2);
var serverArg = args.find((arg) => arg.startsWith("--server="));
var serverUrl = serverArg ? serverArg.split("=")[1] : "localhost";
var WS_URL = serverUrl === "localhost" ? `ws://${serverUrl}` : `wss://${serverUrl}`;
var relayOnlyMode = args.includes("--relay-only");
var portArg = args.find((arg) => arg.startsWith("--port="));
var relayPort = portArg ? parseInt(portArg.split("=")[1], 10) : 3055;
server.tool(
  "get_document_info",
  "Get detailed information about the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_document_info");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting document info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_selection",
  "Get information about the current selection in Figma",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_selection");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting selection: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "read_my_design",
  "Get detailed information about the current selection in Figma, including all node details",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("read_my_design", {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_node_info",
  "Get detailed information about a specific node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to get information about")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_node_info", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filterFigmaNode(result))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
function rgbaToHex(color) {
  if (color.startsWith("#")) {
    return color;
  }
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}
function filterFigmaNode(node) {
  if (node.type === "VECTOR") {
    return null;
  }
  const filtered = {
    id: node.id,
    name: node.name,
    type: node.type
  };
  if (node.fills && node.fills.length > 0) {
    filtered.fills = node.fills.map((fill) => {
      const processedFill = { ...fill };
      delete processedFill.boundVariables;
      delete processedFill.imageRef;
      if (processedFill.gradientStops) {
        processedFill.gradientStops = processedFill.gradientStops.map((stop) => {
          const processedStop = { ...stop };
          if (processedStop.color) {
            processedStop.color = rgbaToHex(processedStop.color);
          }
          delete processedStop.boundVariables;
          return processedStop;
        });
      }
      if (processedFill.color) {
        processedFill.color = rgbaToHex(processedFill.color);
      }
      return processedFill;
    });
  }
  if (node.strokes && node.strokes.length > 0) {
    filtered.strokes = node.strokes.map((stroke) => {
      const processedStroke = { ...stroke };
      delete processedStroke.boundVariables;
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(processedStroke.color);
      }
      return processedStroke;
    });
  }
  if (node.effects && node.effects.length > 0) {
    filtered.effects = node.effects.map((effect) => {
      const processedEffect = { ...effect };
      delete processedEffect.boundVariables;
      if (processedEffect.color) {
        processedEffect.color = rgbaToHex(processedEffect.color);
      }
      return processedEffect;
    });
  }
  if (node.cornerRadius !== void 0) {
    filtered.cornerRadius = node.cornerRadius;
  }
  if (node.absoluteBoundingBox) {
    filtered.absoluteBoundingBox = node.absoluteBoundingBox;
  }
  if (node.characters) {
    filtered.characters = node.characters;
  }
  if (node.style) {
    filtered.style = {
      fontFamily: node.style.fontFamily,
      fontStyle: node.style.fontStyle,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      textAlignHorizontal: node.style.textAlignHorizontal,
      letterSpacing: node.style.letterSpacing,
      lineHeightPx: node.style.lineHeightPx
    };
  }
  if (node.children) {
    filtered.children = node.children.map((child) => filterFigmaNode(child)).filter((child) => child !== null);
  }
  return filtered;
}
server.tool(
  "get_nodes_info",
  "Get detailed information about multiple nodes in Figma",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to get information about")
  },
  async ({ nodeIds }) => {
    try {
      const results = await Promise.all(
        nodeIds.map(async (nodeId) => {
          const result = await sendCommandToFigma("get_node_info", { nodeId });
          return { nodeId, info: result };
        })
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results.map((result) => filterFigmaNode(result.info)))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting nodes info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_rectangle",
  "Create a new rectangle in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the rectangle"),
    height: import_zod.z.number().describe("Height of the rectangle"),
    name: import_zod.z.string().optional().describe("Optional name for the rectangle"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the rectangle to")
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_rectangle", {
        x,
        y,
        width,
        height,
        name: name || "Rectangle",
        parentId
      });
      return {
        content: [
          {
            type: "text",
            text: `Created rectangle "${JSON.stringify(result)}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating rectangle: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_frame",
  "Create a new frame in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the frame"),
    height: import_zod.z.number().describe("Height of the frame"),
    name: import_zod.z.string().optional().describe("Optional name for the frame"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the frame to"),
    fillColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Fill color in RGBA format"),
    strokeColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Stroke color in RGBA format"),
    strokeWeight: import_zod.z.number().positive().optional().describe("Stroke weight"),
    layoutMode: import_zod.z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional().describe("Auto-layout mode for the frame"),
    layoutWrap: import_zod.z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children"),
    paddingTop: import_zod.z.number().optional().describe("Top padding for auto-layout frame"),
    paddingRight: import_zod.z.number().optional().describe("Right padding for auto-layout frame"),
    paddingBottom: import_zod.z.number().optional().describe("Bottom padding for auto-layout frame"),
    paddingLeft: import_zod.z.number().optional().describe("Left padding for auto-layout frame"),
    primaryAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment for auto-layout frame. Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment for auto-layout frame"),
    layoutSizingHorizontal: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing mode for auto-layout frame"),
    layoutSizingVertical: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing mode for auto-layout frame"),
    itemSpacing: import_zod.z.number().optional().describe("Distance between children in auto-layout frame. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN.")
  },
  async ({
    x,
    y,
    width,
    height,
    name,
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
    layoutMode,
    layoutWrap,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    primaryAxisAlignItems,
    counterAxisAlignItems,
    layoutSizingHorizontal,
    layoutSizingVertical,
    itemSpacing
  }) => {
    try {
      const result = await sendCommandToFigma("create_frame", {
        x,
        y,
        width,
        height,
        name: name || "Frame",
        parentId,
        fillColor: fillColor || { r: 1, g: 1, b: 1, a: 1 },
        strokeColor,
        strokeWeight,
        layoutMode,
        layoutWrap,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        primaryAxisAlignItems,
        counterAxisAlignItems,
        layoutSizingHorizontal,
        layoutSizingVertical,
        itemSpacing
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created frame "${typedResult.name}" with ID: ${typedResult.id}. Use the ID as the parentId to appendChild inside this frame.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating frame: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_text",
  "Create a new text element in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    text: import_zod.z.string().describe("Text content"),
    fontSize: import_zod.z.number().optional().describe("Font size (default: 14)"),
    fontWeight: import_zod.z.number().optional().describe("Font weight (e.g., 400 for Regular, 700 for Bold)"),
    fontColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Font color in RGBA format"),
    fontFamily: import_zod.z.string().optional().describe("Font family name (e.g., 'Inter', 'Roboto'). Must be installed locally or available in Figma. Defaults to 'Inter'."),
    letterSpacing: import_zod.z.number().optional().describe("Letter spacing in pixels (e.g., -1.08 for tight, 1.2 for loose). Defaults to 0."),
    lineHeight: import_zod.z.number().optional().describe("Line height in pixels (e.g., 28). If not provided, uses 'AUTO' line height."),
    name: import_zod.z.string().optional().describe("Semantic layer name for the text node"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the text to")
  },
  async ({ x, y, text, fontSize, fontWeight, fontColor, fontFamily, letterSpacing, lineHeight, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_text", {
        x,
        y,
        text,
        fontSize: fontSize || 14,
        fontWeight: fontWeight || 400,
        fontColor: fontColor || { r: 0, g: 0, b: 0, a: 1 },
        fontFamily: fontFamily || "Inter",
        letterSpacing,
        lineHeight,
        name: name || "Text",
        parentId
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created text "${typedResult.name}" with ID: ${typedResult.id}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating text: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_fill_color",
  "Set the fill color of a node in Figma can be TextNode or FrameNode",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
  },
  async ({ nodeId, r, g, b, a }) => {
    try {
      const result = await sendCommandToFigma("set_fill_color", {
        nodeId,
        color: { r, g, b, a: a || 1 }
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set fill color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting fill color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_stroke_color",
  "Set the stroke color of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
    weight: import_zod.z.number().positive().optional().describe("Stroke weight")
  },
  async ({ nodeId, r, g, b, a, weight }) => {
    try {
      const result = await sendCommandToFigma("set_stroke_color", {
        nodeId,
        color: { r, g, b, a: a || 1 },
        weight: weight || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set stroke color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1}) with weight ${weight || 1}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting stroke color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_node_paints",
  "Retrieve the Paint[] definition (either fills or strokes) from a node in Figma. The returned array conforms to the Figma Plugin API Paint interface.",
  {
    nodeId: import_zod.z.string().describe("The ID of the node whose paints to retrieve"),
    paintsType: import_zod.z.enum(["fills", "strokes"]).optional().default("fills").describe("Which paint list to return. Defaults to 'fills'.")
  },
  async ({ nodeId, paintsType }) => {
    try {
      const result = await sendCommandToFigma("get_node_paints", {
        nodeId,
        paintsType
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node paints: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_node_paints",
  "Bind the fills or strokes of a node to a variable.",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    paints: import_zod.z.array(
      import_zod.z.object({
        type: import_zod.z.enum([
          "SOLID",
          "GRADIENT_LINEAR",
          "GRADIENT_RADIAL",
          "GRADIENT_ANGULAR",
          "GRADIENT_DIAMOND",
          "IMAGE",
          "VIDEO",
          "VARIABLE_ALIAS"
        ]),
        visible: import_zod.z.boolean().optional(),
        opacity: import_zod.z.number().min(0).max(1).optional(),
        blendMode: import_zod.z.string().optional(),
        boundVariables: import_zod.z.object({
          color: import_zod.z.object({
            type: import_zod.z.string().optional(),
            variableId: import_zod.z.string().describe("The ID of the variable to bind to the color in the format like VariableID:3:4")
          }).describe("Optional bound variables for the paint").optional()
        }).catchall(import_zod.z.unknown())
      }).describe(
        "Array of Paint objects. Each object must conform to the Paint interface: type, opacity, color, gradientStops, scaleMode, imageHash, etc."
      )
    ),
    paintsType: import_zod.z.enum(["fills", "strokes"]).optional().default("fills").describe("Whether to apply the paints to 'fills' (default) or 'strokes'.")
  },
  async ({ nodeId, paints, paintsType }) => {
    try {
      const result = await sendCommandToFigma("set_node_paints", {
        nodeId,
        paints,
        paintsType: paintsType || "fills"
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Updated ${paintsType || "fills"} on node "${typedResult.name}".`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting node paints: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "move_node",
  "Move a node to a new position in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to move"),
    x: import_zod.z.number().describe("New X position"),
    y: import_zod.z.number().describe("New Y position")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("move_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Moved node "${typedResult.name}" to position (${x}, ${y})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "clone_node",
  "Clone an existing node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to clone"),
    x: import_zod.z.number().optional().describe("New X position for the clone"),
    y: import_zod.z.number().optional().describe("New Y position for the clone")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("clone_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Cloned node "${typedResult.name}" with new ID: ${typedResult.id}${x !== void 0 && y !== void 0 ? ` at position (${x}, ${y})` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error cloning node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "resize_node",
  "Resize a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to resize"),
    width: import_zod.z.number().positive().describe("New width"),
    height: import_zod.z.number().positive().describe("New height")
  },
  async ({ nodeId, width, height }) => {
    try {
      const result = await sendCommandToFigma("resize_node", {
        nodeId,
        width,
        height
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Resized node "${typedResult.name}" to width ${width} and height ${height}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error resizing node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "delete_node",
  "Delete a node from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to delete")
  },
  async ({ nodeId }) => {
    try {
      await sendCommandToFigma("delete_node", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: `Deleted node with ID: ${nodeId}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "delete_multiple_nodes",
  "Delete multiple nodes from Figma at once",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to delete")
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("delete_multiple_nodes", { nodeIds });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting multiple nodes: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "export_node_as_image",
  "Export a node as an image from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to export"),
    format: import_zod.z.enum(["PNG", "JPG", "SVG", "PDF"]).optional().describe("Export format"),
    scale: import_zod.z.number().positive().optional().describe("Export scale")
  },
  async ({ nodeId, format, scale }) => {
    try {
      const result = await sendCommandToFigma("export_node_as_image", {
        nodeId,
        format: format || "PNG",
        scale: scale || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "image",
            data: typedResult.imageData,
            mimeType: typedResult.mimeType || "image/png"
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error exporting node as image: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_text_content",
  "Set the text content of an existing text node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the text node to modify"),
    text: import_zod.z.string().describe("New text content"),
    fontFamily: import_zod.z.string().optional().describe("Optional font family to change to (e.g., 'Inter', 'Roboto'). If not provided, keeps existing font."),
    fontWeight: import_zod.z.number().optional().describe("Optional font weight to change to (e.g., 400, 700). If not provided, keeps existing weight."),
    letterSpacing: import_zod.z.number().optional().describe("Optional letter spacing in pixels (e.g., -1.08 for tight, 1.2 for loose). If not provided, keeps existing value."),
    lineHeight: import_zod.z.number().optional().describe("Optional line height in pixels (e.g., 28). If not provided, keeps existing value.")
  },
  async ({ nodeId, text, fontFamily, fontWeight, letterSpacing, lineHeight }) => {
    try {
      const result = await sendCommandToFigma("set_text_content", {
        nodeId,
        text,
        fontFamily,
        fontWeight,
        letterSpacing,
        lineHeight
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Updated text content of node "${typedResult.name}" to "${text}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting text content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_styles",
  "Get all styles from the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_styles");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting styles: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_local_components",
  "Get all local components from the Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_local_components");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting local components: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_team_components",
  "Get all team components from the Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_team_components");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting team components: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_annotations",
  "Get all annotations in the current document or specific node",
  {
    nodeId: import_zod.z.string().describe("node ID to get annotations for specific node"),
    includeCategories: import_zod.z.boolean().optional().default(true).describe("Whether to include category information")
  },
  async ({ nodeId, includeCategories }) => {
    try {
      const result = await sendCommandToFigma("get_annotations", {
        nodeId,
        includeCategories
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting annotations: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_annotation",
  "Create or update an annotation",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to annotate"),
    annotationId: import_zod.z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
    labelMarkdown: import_zod.z.string().describe("The annotation text in markdown format"),
    categoryId: import_zod.z.string().optional().describe("The ID of the annotation category"),
    properties: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.string()
    })).optional().describe("Additional properties for the annotation")
  },
  async ({ nodeId, annotationId, labelMarkdown, categoryId, properties }) => {
    try {
      const result = await sendCommandToFigma("set_annotation", {
        nodeId,
        annotationId,
        labelMarkdown,
        categoryId,
        properties
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting annotation: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_multiple_annotations",
  "Set multiple annotations parallelly in a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node containing the elements to annotate"),
    annotations: import_zod.z.array(
      import_zod.z.object({
        nodeId: import_zod.z.string().describe("The ID of the node to annotate"),
        labelMarkdown: import_zod.z.string().describe("The annotation text in markdown format"),
        categoryId: import_zod.z.string().optional().describe("The ID of the annotation category"),
        annotationId: import_zod.z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
        properties: import_zod.z.array(import_zod.z.object({
          type: import_zod.z.string()
        })).optional().describe("Additional properties for the annotation")
      })
    ).describe("Array of annotations to apply")
  },
  async ({ nodeId, annotations }) => {
    try {
      if (!annotations || annotations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No annotations provided"
            }
          ]
        };
      }
      const initialStatus = {
        type: "text",
        text: `Starting annotation process for ${annotations.length} nodes. This will be processed in batches of 5...`
      };
      let totalProcessed = 0;
      const totalToProcess = annotations.length;
      const result = await sendCommandToFigma("set_multiple_annotations", {
        nodeId,
        annotations
      });
      const typedResult = result;
      const success = typedResult.annotationsApplied && typedResult.annotationsApplied > 0;
      const progressText = `
      Annotation process completed:
      - ${typedResult.annotationsApplied || 0} of ${totalToProcess} successfully applied
      - ${typedResult.annotationsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter((item) => !item.success);
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Nodes that failed:
${failedResults.map(
          (item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join("\n")}`;
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: progressText + detailedResponse
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple annotations: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component_instance",
  "Create an instance of a component in Figma",
  {
    componentKey: import_zod.z.string().optional().describe("Key of the component to instantiate (for published components)"),
    componentId: import_zod.z.string().optional().describe("ID of a local component to instantiate"),
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append the instance to (defaults to current page)")
  },
  async ({ componentKey, componentId, x, y, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        componentId,
        x,
        y,
        parentId
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(typedResult)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component instance: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_instance_overrides",
  "Get all override properties from a selected component instance. These overrides can be applied to other instances, which will swap them to match the source component.",
  {
    nodeId: import_zod.z.string().optional().describe("Optional ID of the component instance to get overrides from. If not provided, currently selected instance will be used.")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_instance_overrides", {
        instanceNodeId: nodeId || null
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: typedResult.success ? `Successfully got instance overrides: ${typedResult.message}` : `Failed to get instance overrides: ${typedResult.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error copying instance overrides: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_instance_overrides",
  "Apply previously copied overrides to selected component instances. Target instances will be swapped to the source component and all copied override properties will be applied.",
  {
    sourceInstanceId: import_zod.z.string().describe("ID of the source component instance"),
    targetNodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of target instance IDs. Currently selected instances will be used.")
  },
  async ({ sourceInstanceId, targetNodeIds }) => {
    try {
      const result = await sendCommandToFigma("set_instance_overrides", {
        sourceInstanceId,
        targetNodeIds: targetNodeIds || []
      });
      const typedResult = result;
      if (typedResult.success) {
        const successCount = typedResult.results?.filter((r) => r.success).length || 0;
        return {
          content: [
            {
              type: "text",
              text: `Successfully applied ${typedResult.totalCount || 0} overrides to ${successCount} instances.`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Failed to set instance overrides: ${typedResult.message}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting instance overrides: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_corner_radius",
  "Set the corner radius of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    radius: import_zod.z.number().min(0).describe("Corner radius value"),
    corners: import_zod.z.array(import_zod.z.boolean()).length(4).optional().describe(
      "Optional array of 4 booleans to specify which corners to round [topLeft, topRight, bottomRight, bottomLeft]"
    )
  },
  async ({ nodeId, radius, corners }) => {
    try {
      const result = await sendCommandToFigma("set_corner_radius", {
        nodeId,
        radius,
        corners: corners || [true, true, true, true]
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set corner radius of node "${typedResult.name}" to ${radius}px`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting corner radius: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.prompt(
  "design_strategy",
  "Best practices for working with Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When working with Figma designs, follow these best practices:

1. Start with Document Structure:
   - First use get_document_info() to understand the current document
   - Plan your layout hierarchy before creating elements
   - Create a main container frame for each screen/section

2. Naming Conventions:
   - Use descriptive, semantic names for all elements
   - Follow a consistent naming pattern (e.g., "Login Screen", "Logo Container", "Email Input")
   - Group related elements with meaningful names

3. Layout Hierarchy:
   - Create parent frames first, then add child elements
   - For forms/login screens:
     * Start with the main screen container frame
     * Create a logo container at the top
     * Group input fields in their own containers
     * Place action buttons (login, submit) after inputs
     * Add secondary elements (forgot password, signup links) last

4. Input Fields Structure:
   - Create a container frame for each input field
   - Include a label text above or inside the input
   - Group related inputs (e.g., username/password) together

5. Element Creation:
   - Use create_frame() for containers and input fields
   - Use create_text() for labels, buttons text, and links
   - Set appropriate colors and styles:
     * Use fillColor for backgrounds
     * Use strokeColor for borders
     * Set proper fontWeight for different text elements

6. Mofifying existing elements:
  - use set_text_content() to modify text content.

7. Visual Hierarchy:
   - Position elements in logical reading order (top to bottom)
   - Maintain consistent spacing between elements
   - Use appropriate font sizes for different text types:
     * Larger for headings/welcome text
     * Medium for input labels
     * Standard for button text
     * Smaller for helper text/links

8. Best Practices:
   - Verify each creation with get_node_info()
   - Use parentId to maintain proper hierarchy
   - Group related elements together in frames
   - Keep consistent spacing and alignment

Example Login Screen Structure:
- Login Screen (main frame)
  - Logo Container (frame)
    - Logo (image/text)
  - Welcome Text (text)
  - Input Container (frame)
    - Email Input (frame)
      - Email Label (text)
      - Email Field (frame)
    - Password Input (frame)
      - Password Label (text)
      - Password Field (frame)
  - Login Button (frame)
    - Button Text (text)
  - Helper Links (frame)
    - Forgot Password (text)
    - Don't have account (text)`
          }
        }
      ],
      description: "Best practices for working with Figma designs"
    };
  }
);
server.prompt(
  "read_design_strategy",
  "Best practices for reading Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When reading Figma designs, follow these best practices:

1. Start with selection:
   - First use read_my_design() to understand the current selection
   - If no selection ask user to select single or multiple nodes
`
          }
        }
      ],
      description: "Best practices for reading Figma designs"
    };
  }
);
server.tool(
  "scan_text_nodes",
  "Scan all text nodes in the selected Figma node",
  {
    nodeId: import_zod.z.string().describe("ID of the node to scan")
  },
  async ({ nodeId }) => {
    try {
      const initialStatus = {
        type: "text",
        text: "Starting text node scanning. This may take a moment for large designs..."
      };
      const result = await sendCommandToFigma("scan_text_nodes", {
        nodeId,
        useChunking: true,
        // Enable chunking on the plugin side
        chunkSize: 10
        // Process 10 nodes at a time
      });
      if (result && typeof result === "object" && "chunks" in result) {
        const typedResult = result;
        const summaryText = `
        Scan completed:
        - Found ${typedResult.totalNodes} text nodes
        - Processed in ${typedResult.chunks} chunks
        `;
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: summaryText
            },
            {
              type: "text",
              text: JSON.stringify(typedResult.textNodes, null, 2)
            }
          ]
        };
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning text nodes: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "scan_nodes_by_types",
  "Scan for child nodes with specific types in the selected Figma node",
  {
    nodeId: import_zod.z.string().describe("ID of the node to scan"),
    types: import_zod.z.array(import_zod.z.string()).describe("Array of node types to find in the child nodes (e.g. ['COMPONENT', 'FRAME'])")
  },
  async ({ nodeId, types }) => {
    try {
      const initialStatus = {
        type: "text",
        text: `Starting node type scanning for types: ${types.join(", ")}...`
      };
      const result = await sendCommandToFigma("scan_nodes_by_types", {
        nodeId,
        types
      });
      if (result && typeof result === "object" && "matchingNodes" in result) {
        const typedResult = result;
        const summaryText = `Scan completed: Found ${typedResult.count} nodes matching types: ${typedResult.searchedTypes.join(", ")}`;
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: summaryText
            },
            {
              type: "text",
              text: JSON.stringify(typedResult.matchingNodes, null, 2)
            }
          ]
        };
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning nodes by types: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.prompt(
  "text_replacement_strategy",
  "Systematic approach for replacing text in Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Intelligent Text Replacement Strategy

## 1. Analyze Design & Identify Structure
- Scan text nodes to understand the overall structure of the design
- Use AI pattern recognition to identify logical groupings:
  * Tables (rows, columns, headers, cells)
  * Lists (items, headers, nested lists)
  * Card groups (similar cards with recurring text fields)
  * Forms (labels, input fields, validation text)
  * Navigation (menu items, breadcrumbs)
\`\`\`
scan_text_nodes(nodeId: "node-id")
get_node_info(nodeId: "node-id")  // optional
\`\`\`

## 2. Strategic Chunking for Complex Designs
- Divide replacement tasks into logical content chunks based on design structure
- Use one of these chunking strategies that best fits the design:
  * **Structural Chunking**: Table rows/columns, list sections, card groups
  * **Spatial Chunking**: Top-to-bottom, left-to-right in screen areas
  * **Semantic Chunking**: Content related to the same topic or functionality
  * **Component-Based Chunking**: Process similar component instances together

## 3. Progressive Replacement with Verification
- Create a safe copy of the node for text replacement
- Replace text chunk by chunk with continuous progress updates
- After each chunk is processed:
  * Export that section as a small, manageable image
  * Verify text fits properly and maintain design integrity
  * Fix issues before proceeding to the next chunk

\`\`\`
// Clone the node to create a safe copy
clone_node(nodeId: "selected-node-id", x: [new-x], y: [new-y])

// Replace text chunk by chunk
set_multiple_text_contents(
  nodeId: "parent-node-id", 
  text: [
    { nodeId: "node-id-1", text: "New text 1" },
    // More nodes in this chunk...
  ]
)

// Verify chunk with small, targeted image exports
export_node_as_image(nodeId: "chunk-node-id", format: "PNG", scale: 0.5)
\`\`\`

## 4. Intelligent Handling for Table Data
- For tabular content:
  * Process one row or column at a time
  * Maintain alignment and spacing between cells
  * Consider conditional formatting based on cell content
  * Preserve header/data relationships

## 5. Smart Text Adaptation
- Adaptively handle text based on container constraints:
  * Auto-detect space constraints and adjust text length
  * Apply line breaks at appropriate linguistic points
  * Maintain text hierarchy and emphasis
  * Consider font scaling for critical content that must fit

## 6. Progressive Feedback Loop
- Establish a continuous feedback loop during replacement:
  * Real-time progress updates (0-100%)
  * Small image exports after each chunk for verification
  * Issues identified early and resolved incrementally
  * Quick adjustments applied to subsequent chunks

## 7. Final Verification & Context-Aware QA
- After all chunks are processed:
  * Export the entire design at reduced scale for final verification
  * Check for cross-chunk consistency issues
  * Verify proper text flow between different sections
  * Ensure design harmony across the full composition

## 8. Chunk-Specific Export Scale Guidelines
- Scale exports appropriately based on chunk size:
  * Small chunks (1-5 elements): scale 1.0
  * Medium chunks (6-20 elements): scale 0.7
  * Large chunks (21-50 elements): scale 0.5
  * Very large chunks (50+ elements): scale 0.3
  * Full design verification: scale 0.2

## Sample Chunking Strategy for Common Design Types

### Tables
- Process by logical rows (5-10 rows per chunk)
- Alternative: Process by column for columnar analysis
- Tip: Always include header row in first chunk for reference

### Card Lists
- Group 3-5 similar cards per chunk
- Process entire cards to maintain internal consistency
- Verify text-to-image ratio within cards after each chunk

### Forms
- Group related fields (e.g., "Personal Information", "Payment Details")
- Process labels and input fields together
- Ensure validation messages and hints are updated with their fields

### Navigation & Menus
- Process hierarchical levels together (main menu, submenu)
- Respect information architecture relationships
- Verify menu fit and alignment after replacement

## Best Practices
- **Preserve Design Intent**: Always prioritize design integrity
- **Structural Consistency**: Maintain alignment, spacing, and hierarchy
- **Visual Feedback**: Verify each chunk visually before proceeding
- **Incremental Improvement**: Learn from each chunk to improve subsequent ones
- **Balance Automation & Control**: Let AI handle repetitive replacements but maintain oversight
- **Respect Content Relationships**: Keep related content consistent across chunks

Remember that text is never just text\u2014it's a core design element that must work harmoniously with the overall composition. This chunk-based strategy allows you to methodically transform text while maintaining design integrity.`
          }
        }
      ],
      description: "Systematic approach for replacing text in Figma designs"
    };
  }
);
server.tool(
  "set_multiple_text_contents",
  "Set multiple text contents parallelly in a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node containing the text nodes to replace"),
    text: import_zod.z.array(
      import_zod.z.object({
        nodeId: import_zod.z.string().describe("The ID of the text node"),
        text: import_zod.z.string().describe("The replacement text")
      })
    ).describe("Array of text node IDs and their replacement texts")
  },
  async ({ nodeId, text }) => {
    try {
      if (!text || text.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No text provided"
            }
          ]
        };
      }
      const initialStatus = {
        type: "text",
        text: `Starting text replacement for ${text.length} nodes. This will be processed in batches of 5...`
      };
      let totalProcessed = 0;
      const totalToProcess = text.length;
      const result = await sendCommandToFigma("set_multiple_text_contents", {
        nodeId,
        text
      });
      const typedResult = result;
      const success = typedResult.replacementsApplied && typedResult.replacementsApplied > 0;
      const progressText = `
      Text replacement completed:
      - ${typedResult.replacementsApplied || 0} of ${totalToProcess} successfully updated
      - ${typedResult.replacementsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter((item) => !item.success);
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Nodes that failed:
${failedResults.map(
          (item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join("\n")}`;
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: progressText + detailedResponse
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple text contents: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_table_cell_contents",
  "Set text content of table cells by row and column index. Works with FigJam and Figma TABLE nodes. Use get_document_info or get_node_info to get the table node ID. Row and column indices are 0-based (row 0 = first row, e.g. header).",
  {
    tableNodeId: import_zod.z.string().describe("Node ID of the table (e.g. '0:20')"),
    updates: import_zod.z.array(
      import_zod.z.object({
        rowIndex: import_zod.z.number().describe("0-based row index"),
        columnIndex: import_zod.z.number().describe("0-based column index"),
        text: import_zod.z.string().describe("New cell text")
      })
    ).describe("Array of { rowIndex, columnIndex, text } for each cell to update")
  },
  async ({ tableNodeId, updates }) => {
    try {
      if (!updates || updates.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No updates provided"
            }
          ]
        };
      }
      const result = await sendCommandToFigma("set_table_cell_contents", {
        tableNodeId,
        updates
      });
      const typedResult = result;
      const failedResults = typedResult.results?.filter((r) => !r.ok) || [];
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Cells that failed:
${failedResults.map((r) => `- row ${r.row}, col ${r.col}: ${r.error || "Unknown error"}`).join("\n")}`;
      }
      return {
        content: [
          {
            type: "text",
            text: `Table cell update completed: ${typedResult.updated} updated, ${typedResult.failed} failed.${detailedResponse}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting table cell contents: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_ellipse",
  "Create an ellipse/circle in Figma. Use equal width/height for a circle.",
  {
    x: import_zod.z.number().optional().describe("X position (default: 0)"),
    y: import_zod.z.number().optional().describe("Y position (default: 0)"),
    width: import_zod.z.number().optional().describe("Width (default: 100)"),
    height: import_zod.z.number().optional().describe("Height (default: 100)"),
    name: import_zod.z.string().optional().describe("Name for the ellipse"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append into")
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_ellipse", { x, y, width, height, name, parentId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating ellipse: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_line",
  "Create a line in Figma with optional rotation.",
  {
    x: import_zod.z.number().optional().describe("X position (default: 0)"),
    y: import_zod.z.number().optional().describe("Y position (default: 0)"),
    length: import_zod.z.number().optional().describe("Length of the line (default: 100)"),
    rotation: import_zod.z.number().optional().describe("Rotation in degrees (default: 0)"),
    name: import_zod.z.string().optional().describe("Name for the line"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append into")
  },
  async ({ x, y, length, rotation, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_line", { x, y, length, rotation, name, parentId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating line: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_section",
  "Create a section frame for organizing content on the canvas.",
  {
    x: import_zod.z.number().optional().describe("X position (default: 0)"),
    y: import_zod.z.number().optional().describe("Y position (default: 0)"),
    width: import_zod.z.number().optional().describe("Width (default: 400)"),
    height: import_zod.z.number().optional().describe("Height (default: 400)"),
    name: import_zod.z.string().optional().describe("Name for the section"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append into")
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_section", { x, y, width, height, name, parentId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating section: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_node_from_svg",
  "Create a node from an SVG string.",
  {
    svg: import_zod.z.string().describe("SVG markup string"),
    x: import_zod.z.number().optional().describe("X position (default: 0)"),
    y: import_zod.z.number().optional().describe("Y position (default: 0)"),
    name: import_zod.z.string().optional().describe("Name for the node"),
    parentId: import_zod.z.string().optional().describe("Parent node ID")
  },
  async ({ svg, x, y, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_node_from_svg", { svg, x, y, name, parentId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating node from SVG: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_boolean_operation",
  "Create a boolean operation (union, intersect, subtract, exclude) from multiple nodes.",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to combine"),
    operation: import_zod.z.enum(["UNION", "INTERSECT", "SUBTRACT", "EXCLUDE"]).describe("Boolean operation type"),
    name: import_zod.z.string().optional().describe("Name for the resulting node")
  },
  async ({ nodeIds, operation, name }) => {
    try {
      const result = await sendCommandToFigma("create_boolean_operation", { nodeIds, operation, name });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating boolean operation: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_component_from_node",
  "Convert an existing node into a component.",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to convert to a component")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("create_component_from_node", { nodeId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating component from node: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "combine_as_variants",
  "Combine multiple components into a variant set.",
  {
    componentIds: import_zod.z.array(import_zod.z.string()).describe("Array of component node IDs to combine"),
    name: import_zod.z.string().optional().describe("Name for the component set")
  },
  async ({ componentIds, name }) => {
    try {
      const result = await sendCommandToFigma("combine_as_variants", { componentIds, name });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error combining variants: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "add_component_property",
  "Add a property to a component (BOOLEAN, TEXT, INSTANCE_SWAP, or VARIANT).",
  {
    componentId: import_zod.z.string().describe("The component node ID"),
    propertyName: import_zod.z.string().describe("Name of the property"),
    type: import_zod.z.enum(["BOOLEAN", "TEXT", "INSTANCE_SWAP", "VARIANT"]).describe("Type of the property"),
    defaultValue: import_zod.z.union([import_zod.z.string(), import_zod.z.boolean()]).describe("Default value \u2014 string for TEXT/VARIANT/INSTANCE_SWAP, boolean for BOOLEAN"),
    preferredValues: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.enum(["COMPONENT", "COMPONENT_SET"]),
      key: import_zod.z.string()
    })).optional().describe("Preferred values for INSTANCE_SWAP")
  },
  async ({ componentId, propertyName, type, defaultValue, preferredValues }) => {
    try {
      const result = await sendCommandToFigma("add_component_property", { componentId, propertyName, type, defaultValue, preferredValues });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error adding component property: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_instance_from_local",
  "Create an instance of a local component by its node ID.",
  {
    componentId: import_zod.z.string().describe("The node ID of the local component to instantiate"),
    x: import_zod.z.number().optional().describe("X position for the instance"),
    y: import_zod.z.number().optional().describe("Y position for the instance"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append to")
  },
  async ({ componentId, x, y, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_instance_from_local", { componentId, x, y, parentId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating instance: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_paint_style",
  "Create a color/paint style.",
  {
    name: import_zod.z.string().describe("Name for the paint style"),
    color: import_zod.z.object({
      r: import_zod.z.number().describe("Red (0-1)"),
      g: import_zod.z.number().describe("Green (0-1)"),
      b: import_zod.z.number().describe("Blue (0-1)"),
      a: import_zod.z.number().optional().describe("Alpha (0-1, default 1)")
    }).describe("Color RGBA (0-1 each)")
  },
  async ({ name, color }) => {
    try {
      const result = await sendCommandToFigma("create_paint_style", { name, color });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating paint style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_text_style",
  "Create a text style with font properties.",
  {
    name: import_zod.z.string().describe("Name for the text style"),
    fontFamily: import_zod.z.string().describe("Font family name"),
    fontStyle: import_zod.z.string().optional().describe("Font style (e.g., 'Regular', 'Bold') (default: 'Regular')"),
    fontSize: import_zod.z.number().describe("Font size in pixels"),
    lineHeight: import_zod.z.union([
      import_zod.z.number(),
      import_zod.z.object({ value: import_zod.z.number(), unit: import_zod.z.enum(["PIXELS", "PERCENT", "AUTO"]) })
    ]).optional().describe("Line height \u2014 number (pixels) or {value, unit}"),
    letterSpacing: import_zod.z.union([
      import_zod.z.number(),
      import_zod.z.object({ value: import_zod.z.number(), unit: import_zod.z.enum(["PIXELS", "PERCENT"]) })
    ]).optional().describe("Letter spacing \u2014 number (pixels) or {value, unit}"),
    textCase: import_zod.z.enum(["ORIGINAL", "UPPER", "LOWER", "TITLE"]).optional().describe("Text case transform"),
    textDecoration: import_zod.z.enum(["NONE", "UNDERLINE", "STRIKETHROUGH"]).optional().describe("Text decoration")
  },
  async ({ name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textCase, textDecoration }) => {
    try {
      const result = await sendCommandToFigma("create_text_style", { name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textCase, textDecoration });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating text style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_effect_style",
  "Create an effect style (shadows, blurs).",
  {
    name: import_zod.z.string().describe("Name for the effect style"),
    effects: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.enum(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"]).describe("Effect type"),
      color: import_zod.z.object({
        r: import_zod.z.number(),
        g: import_zod.z.number(),
        b: import_zod.z.number(),
        a: import_zod.z.number().optional()
      }).optional().describe("Effect color RGBA (0-1)"),
      offset: import_zod.z.object({ x: import_zod.z.number(), y: import_zod.z.number() }).optional().describe("Shadow offset"),
      radius: import_zod.z.number().describe("Blur radius"),
      spread: import_zod.z.number().optional().describe("Shadow spread"),
      visible: import_zod.z.boolean().optional().describe("Whether effect is visible (default true)"),
      blendMode: import_zod.z.string().optional().describe("Blend mode (default NORMAL)")
    })).describe("Array of effects")
  },
  async ({ name, effects }) => {
    try {
      const result = await sendCommandToFigma("create_effect_style", { name, effects });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating effect style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "apply_style_to_node",
  "Apply a style to a node by ID or name (case-insensitive match).",
  {
    nodeId: import_zod.z.string().describe("The node ID to apply the style to"),
    styleId: import_zod.z.string().optional().describe("The style ID to apply"),
    styleName: import_zod.z.string().optional().describe("Style name to look up (case-insensitive substring match)"),
    styleType: import_zod.z.enum(["fill", "stroke", "text", "effect"]).describe("Type of style to apply")
  },
  async ({ nodeId, styleId, styleName, styleType }) => {
    try {
      const result = await sendCommandToFigma("apply_style_to_node", { nodeId, styleId, styleName, styleType });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error applying style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "remove_style",
  "Remove a style by ID.",
  {
    styleId: import_zod.z.string().describe("The style ID to remove")
  },
  async ({ styleId }) => {
    try {
      const result = await sendCommandToFigma("remove_style", { styleId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error removing style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_style_by_id",
  "Get full style definition by ID.",
  {
    styleId: import_zod.z.string().describe("The style ID to retrieve")
  },
  async ({ styleId }) => {
    try {
      const result = await sendCommandToFigma("get_style_by_id", { styleId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting style: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_available_fonts",
  "List available fonts, with optional query filter.",
  {
    query: import_zod.z.string().optional().describe("Optional search query to filter fonts by name")
  },
  async ({ query }) => {
    try {
      const result = await sendCommandToFigma("get_available_fonts", { query });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting fonts: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_variable_by_id",
  "Get a variable definition with its values across all modes.",
  {
    variableId: import_zod.z.string().describe("The variable ID")
  },
  async ({ variableId }) => {
    try {
      const result = await sendCommandToFigma("get_variable_by_id", { variableId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting variable: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_variable_collection_by_id",
  "Get a variable collection's details including modes and variable IDs.",
  {
    collectionId: import_zod.z.string().describe("The variable collection ID")
  },
  async ({ collectionId }) => {
    try {
      const result = await sendCommandToFigma("get_variable_collection_by_id", { collectionId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting variable collection: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "set_variable_binding",
  "Bind a variable to a node property. For scalar fields use the field name directly (e.g., 'opacity'). For paint colors use 'fills/0/color' syntax.",
  {
    nodeId: import_zod.z.string().describe("The node ID to bind the variable to"),
    field: import_zod.z.string().describe("Property field (e.g., 'opacity', 'fills/0/color', 'strokes/0/color')"),
    variableId: import_zod.z.string().describe("The variable ID to bind")
  },
  async ({ nodeId, field, variableId }) => {
    try {
      const result = await sendCommandToFigma("set_variable_binding", { nodeId, field, variableId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error binding variable: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_local_variables",
  "List local variables (names, IDs, types). Use get_variable_by_id for full values.",
  {
    type: import_zod.z.enum(["COLOR", "FLOAT", "STRING", "BOOLEAN"]).optional().describe("Filter by variable type"),
    collectionId: import_zod.z.string().optional().describe("Filter to variables in this collection only")
  },
  async ({ type, collectionId }) => {
    try {
      const result = await sendCommandToFigma("get_local_variables", { type, collectionId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting variables: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_local_variable_collections",
  "List all local variable collections.",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_local_variable_collections");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting variable collections: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "add_mode",
  "Add a new mode to a variable collection.",
  {
    collectionId: import_zod.z.string().describe("The variable collection ID"),
    name: import_zod.z.string().describe("Name for the new mode")
  },
  async ({ collectionId, name }) => {
    try {
      const result = await sendCommandToFigma("add_mode", { collectionId, name });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error adding mode: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "rename_mode",
  "Rename an existing mode in a variable collection.",
  {
    collectionId: import_zod.z.string().describe("The variable collection ID"),
    modeId: import_zod.z.string().describe("The mode ID to rename"),
    name: import_zod.z.string().describe("New name for the mode")
  },
  async ({ collectionId, modeId, name }) => {
    try {
      const result = await sendCommandToFigma("rename_mode", { collectionId, modeId, name });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error renaming mode: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "remove_mode",
  "Remove a mode from a variable collection.",
  {
    collectionId: import_zod.z.string().describe("The variable collection ID"),
    modeId: import_zod.z.string().describe("The mode ID to remove")
  },
  async ({ collectionId, modeId }) => {
    try {
      const result = await sendCommandToFigma("remove_mode", { collectionId, modeId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error removing mode: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "create_auto_layout",
  "Wrap existing nodes in an auto-layout frame. Defaults to VERTICAL layout with HUG sizing.",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to wrap"),
    name: import_zod.z.string().optional().describe("Name for the frame (default 'Auto Layout')"),
    layoutMode: import_zod.z.enum(["HORIZONTAL", "VERTICAL"]).optional().describe("Layout direction (default VERTICAL)"),
    itemSpacing: import_zod.z.number().optional().describe("Spacing between children (default 0)"),
    paddingTop: import_zod.z.number().optional().describe("Top padding (default: 0)"),
    paddingRight: import_zod.z.number().optional().describe("Right padding (default: 0)"),
    paddingBottom: import_zod.z.number().optional().describe("Bottom padding (default: 0)"),
    paddingLeft: import_zod.z.number().optional().describe("Left padding (default: 0)"),
    primaryAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment (default: MIN)"),
    counterAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment (default: MIN)"),
    layoutSizingHorizontal: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing (default: HUG)"),
    layoutSizingVertical: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing (default: HUG)"),
    layoutWrap: import_zod.z.enum(["NO_WRAP", "WRAP"]).optional().describe("Wrap children (default: NO_WRAP)")
  },
  async ({ nodeIds, name, layoutMode, itemSpacing, paddingTop, paddingRight, paddingBottom, paddingLeft, primaryAxisAlignItems, counterAxisAlignItems, layoutSizingHorizontal, layoutSizingVertical, layoutWrap }) => {
    try {
      const result = await sendCommandToFigma("create_auto_layout", { nodeIds, name, layoutMode, itemSpacing, paddingTop, paddingRight, paddingBottom, paddingLeft, primaryAxisAlignItems, counterAxisAlignItems, layoutSizingHorizontal, layoutSizingVertical, layoutWrap });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error creating auto layout: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "set_constraints",
  "Set responsive layout constraints on a node.",
  {
    nodeId: import_zod.z.string().describe("The node ID"),
    horizontal: import_zod.z.enum(["MIN", "CENTER", "MAX", "STRETCH", "SCALE"]).describe("Horizontal constraint"),
    vertical: import_zod.z.enum(["MIN", "CENTER", "MAX", "STRETCH", "SCALE"]).describe("Vertical constraint")
  },
  async ({ nodeId, horizontal, vertical }) => {
    try {
      const result = await sendCommandToFigma("set_constraints", { nodeId, horizontal, vertical });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error setting constraints: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "insert_child",
  "Insert a node as a child of another node at an optional index.",
  {
    parentId: import_zod.z.string().describe("The parent node ID"),
    childId: import_zod.z.string().describe("The child node ID to insert"),
    index: import_zod.z.number().optional().describe("Index position (default: append at end)")
  },
  async ({ parentId, childId, index }) => {
    try {
      const result = await sendCommandToFigma("insert_child", { parentId, childId, index });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error inserting child: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "rename_page",
  "Rename a page. Defaults to current page if no pageId given.",
  {
    newName: import_zod.z.string().describe("New name for the page"),
    pageId: import_zod.z.string().optional().describe("Page ID to rename (defaults to current page)")
  },
  async ({ newName, pageId }) => {
    try {
      const result = await sendCommandToFigma("rename_page", { newName, pageId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error renaming page: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_current_page",
  "Get the current page info and its top-level children.",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_current_page");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting current page: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "zoom_into_view",
  "Scroll and zoom the viewport to fit specific nodes on screen.",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to zoom into view")
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("zoom_into_view", { nodeIds });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error zooming into view: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "set_viewport",
  "Set the viewport center position and/or zoom level.",
  {
    center: import_zod.z.object({
      x: import_zod.z.number().describe("X coordinate of viewport center"),
      y: import_zod.z.number().describe("Y coordinate of viewport center")
    }).optional().describe("Viewport center point"),
    zoom: import_zod.z.number().min(0.01).max(256).optional().describe("Zoom level (1.0 = 100%)")
  },
  async ({ center, zoom }) => {
    try {
      const result = await sendCommandToFigma("set_viewport", { center, zoom });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error setting viewport: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "search_nodes",
  "Search for nodes by name and/or type within a scope. Returns paginated results.",
  {
    query: import_zod.z.string().optional().describe("Search string to match against node names (case-insensitive)"),
    types: import_zod.z.array(import_zod.z.string()).optional().describe("Filter by node types (e.g., ['FRAME', 'TEXT'])"),
    scopeNodeId: import_zod.z.string().optional().describe("Node ID to search within (defaults to current page)"),
    limit: import_zod.z.number().optional().describe("Max results to return (default: 100)"),
    offset: import_zod.z.number().optional().describe("Number of results to skip (default: 0)")
  },
  async ({ query, types, scopeNodeId, limit, offset }) => {
    try {
      const result = await sendCommandToFigma("search_nodes", { query, types, scopeNodeId, limit, offset });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error searching nodes: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_node_css",
  "Get computed CSS properties for a node.",
  {
    nodeId: import_zod.z.string().describe("The node ID")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_node_css", { nodeId });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting CSS: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "set_export_settings",
  "Configure export format/scale for a node.",
  {
    nodeId: import_zod.z.string().describe("The node ID"),
    settings: import_zod.z.array(import_zod.z.object({
      format: import_zod.z.enum(["PNG", "JPG", "SVG", "PDF"]).describe("Export format"),
      suffix: import_zod.z.string().optional().describe("File suffix"),
      contentsOnly: import_zod.z.boolean().optional().describe("Export contents only (default true)"),
      constraint: import_zod.z.object({
        type: import_zod.z.enum(["SCALE", "WIDTH", "HEIGHT"]).describe("Constraint type"),
        value: import_zod.z.number().describe("Constraint value")
      }).optional().describe("Export constraint")
    })).describe("Array of export settings")
  },
  async ({ nodeId, settings }) => {
    try {
      const result = await sendCommandToFigma("set_export_settings", { nodeId, settings });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error setting export settings: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "set_node_properties",
  "Generic multi-property setter for a node. Set multiple properties at once.",
  {
    nodeId: import_zod.z.string().describe("The node ID"),
    properties: import_zod.z.record(import_zod.z.any()).describe("Object of property name-value pairs to set")
  },
  async ({ nodeId, properties }) => {
    try {
      const result = await sendCommandToFigma("set_node_properties", { nodeId, properties });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error setting node properties: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.tool(
  "get_component_by_id",
  "Get component details by ID.",
  {
    componentId: import_zod.z.string().describe("The component node ID"),
    includeChildren: import_zod.z.boolean().optional().describe("Include children in response (default: false)")
  },
  async ({ componentId, includeChildren }) => {
    try {
      const result = await sendCommandToFigma("get_component_by_id", { componentId, includeChildren });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error getting component: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);
server.prompt(
  "annotation_conversion_strategy",
  "Strategy for converting manual annotations to Figma's native annotations",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Automatic Annotation Conversion
            
## Process Overview

The process of converting manual annotations (numbered/alphabetical indicators with connected descriptions) to Figma's native annotations:

1. Get selected frame/component information
2. Scan and collect all annotation text nodes
3. Scan target UI elements (components, instances, frames)
4. Match annotations to appropriate UI elements
5. Apply native Figma annotations

## Step 1: Get Selection and Initial Setup

First, get the selected frame or component that contains annotations:

\`\`\`typescript
// Get the selected frame/component
const selection = await get_selection();
const selectedNodeId = selection[0].id

// Get available annotation categories for later use
const annotationData = await get_annotations({
  nodeId: selectedNodeId,
  includeCategories: true
});
const categories = annotationData.categories;
\`\`\`

## Step 2: Scan Annotation Text Nodes

Scan all text nodes to identify annotations and their descriptions:

\`\`\`typescript
// Get all text nodes in the selection
const textNodes = await scan_text_nodes({
  nodeId: selectedNodeId
});

// Filter and group annotation markers and descriptions

// Markers typically have these characteristics:
// - Short text content (usually single digit/letter)
// - Specific font styles (often bold)
// - Located in a container with "Marker" or "Dot" in the name
// - Have a clear naming pattern (e.g., "1", "2", "3" or "A", "B", "C")


// Identify description nodes
// Usually longer text nodes near markers or with matching numbers in path
  
\`\`\`

## Step 3: Scan Target UI Elements

Get all potential target elements that annotations might refer to:

\`\`\`typescript
// Scan for all UI elements that could be annotation targets
const targetNodes = await scan_nodes_by_types({
  nodeId: selectedNodeId,
  types: [
    "COMPONENT",
    "INSTANCE",
    "FRAME"
  ]
});
\`\`\`

## Step 4: Match Annotations to Targets

Match each annotation to its target UI element using these strategies in order of priority:

1. **Path-Based Matching**:
   - Look at the marker's parent container name in the Figma layer hierarchy
   - Remove any "Marker:" or "Annotation:" prefixes from the parent name
   - Find UI elements that share the same parent name or have it in their path
   - This works well when markers are grouped with their target elements

2. **Name-Based Matching**:
   - Extract key terms from the annotation description
   - Look for UI elements whose names contain these key terms
   - Consider both exact matches and semantic similarities
   - Particularly effective for form fields, buttons, and labeled components

3. **Proximity-Based Matching** (fallback):
   - Calculate the center point of the marker
   - Find the closest UI element by measuring distances to element centers
   - Consider the marker's position relative to nearby elements
   - Use this method when other matching strategies fail

Additional Matching Considerations:
- Give higher priority to matches found through path-based matching
- Consider the type of UI element when evaluating matches
- Take into account the annotation's context and content
- Use a combination of strategies for more accurate matching

## Step 5: Apply Native Annotations

Convert matched annotations to Figma's native annotations using batch processing:

\`\`\`typescript
// Prepare annotations array for batch processing
const annotationsToApply = Object.values(annotations).map(({ marker, description }) => {
  // Find target using multiple strategies
  const target = 
    findTargetByPath(marker, targetNodes) ||
    findTargetByName(description, targetNodes) ||
    findTargetByProximity(marker, targetNodes);
  
  if (target) {
    // Determine appropriate category based on content
    const category = determineCategory(description.characters, categories);

    // Determine appropriate additional annotationProperty based on content
    const annotationProperty = determineProperties(description.characters, target.type);
    
    return {
      nodeId: target.id,
      labelMarkdown: description.characters,
      categoryId: category.id,
      properties: annotationProperty
    };
  }
  return null;
}).filter(Boolean); // Remove null entries

// Apply annotations in batches using set_multiple_annotations
if (annotationsToApply.length > 0) {
  await set_multiple_annotations({
    nodeId: selectedNodeId,
    annotations: annotationsToApply
  });
}
\`\`\`


This strategy focuses on practical implementation based on real-world usage patterns, emphasizing the importance of handling various UI elements as annotation targets, not just text nodes.`
          }
        }
      ],
      description: "Strategy for converting manual annotations to Figma's native annotations"
    };
  }
);
server.prompt(
  "swap_overrides_instances",
  "Guide to swap instance overrides between instances",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Swap Component Instance and Override Strategy

## Overview
This strategy enables transferring content and property overrides from a source instance to one or more target instances in Figma, maintaining design consistency while reducing manual work.

## Step-by-Step Process

### 1. Selection Analysis
- Use \`get_selection()\` to identify the parent component or selected instances
- For parent components, scan for instances with \`scan_nodes_by_types({ nodeId: "parent-id", types: ["INSTANCE"] })\`
- Identify custom slots by name patterns (e.g. "Custom Slot*" or "Instance Slot") or by examining text content
- Determine which is the source instance (with content to copy) and which are targets (where to apply content)

### 2. Extract Source Overrides
- Use \`get_instance_overrides()\` to extract customizations from the source instance
- This captures text content, property values, and style overrides
- Command syntax: \`get_instance_overrides({ nodeId: "source-instance-id" })\`
- Look for successful response like "Got component information from [instance name]"

### 3. Apply Overrides to Targets
- Apply captured overrides using \`set_instance_overrides()\`
- Command syntax:
  \`\`\`
  set_instance_overrides({
    sourceInstanceId: "source-instance-id", 
    targetNodeIds: ["target-id-1", "target-id-2", ...]
  })
  \`\`\`

### 4. Verification
- Verify results with \`get_node_info()\` or \`read_my_design()\`
- Confirm text content and style overrides have transferred successfully

## Key Tips
- Always join the appropriate channel first with \`join_channel()\`
- When working with multiple targets, check the full selection with \`get_selection()\`
- Preserve component relationships by using instance overrides rather than direct text manipulation`
          }
        }
      ],
      description: "Strategy for transferring overrides between component instances in Figma"
    };
  }
);
server.tool(
  "set_layout_mode",
  "Set the layout mode and wrap behavior of a frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    layoutMode: import_zod.z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).describe("Layout mode for the frame"),
    layoutWrap: import_zod.z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children")
  },
  async ({ nodeId, layoutMode, layoutWrap }) => {
    try {
      const result = await sendCommandToFigma("set_layout_mode", {
        nodeId,
        layoutMode,
        layoutWrap: layoutWrap || "NO_WRAP"
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set layout mode of frame "${typedResult.name}" to ${layoutMode}${layoutWrap ? ` with ${layoutWrap}` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout mode: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_padding",
  "Set padding values for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    paddingTop: import_zod.z.number().optional().describe("Top padding value"),
    paddingRight: import_zod.z.number().optional().describe("Right padding value"),
    paddingBottom: import_zod.z.number().optional().describe("Bottom padding value"),
    paddingLeft: import_zod.z.number().optional().describe("Left padding value")
  },
  async ({ nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft }) => {
    try {
      const result = await sendCommandToFigma("set_padding", {
        nodeId,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
      });
      const typedResult = result;
      const paddingMessages = [];
      if (paddingTop !== void 0) paddingMessages.push(`top: ${paddingTop}`);
      if (paddingRight !== void 0) paddingMessages.push(`right: ${paddingRight}`);
      if (paddingBottom !== void 0) paddingMessages.push(`bottom: ${paddingBottom}`);
      if (paddingLeft !== void 0) paddingMessages.push(`left: ${paddingLeft}`);
      const paddingText = paddingMessages.length > 0 ? `padding (${paddingMessages.join(", ")})` : "padding";
      return {
        content: [
          {
            type: "text",
            text: `Set ${paddingText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting padding: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_axis_align",
  "Set primary and counter axis alignment for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    primaryAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment (MIN/MAX = left/right in horizontal, top/bottom in vertical). Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment (MIN/MAX = top/bottom in horizontal, left/right in vertical)")
  },
  async ({ nodeId, primaryAxisAlignItems, counterAxisAlignItems }) => {
    try {
      const result = await sendCommandToFigma("set_axis_align", {
        nodeId,
        primaryAxisAlignItems,
        counterAxisAlignItems
      });
      const typedResult = result;
      const alignMessages = [];
      if (primaryAxisAlignItems !== void 0) alignMessages.push(`primary: ${primaryAxisAlignItems}`);
      if (counterAxisAlignItems !== void 0) alignMessages.push(`counter: ${counterAxisAlignItems}`);
      const alignText = alignMessages.length > 0 ? `axis alignment (${alignMessages.join(", ")})` : "axis alignment";
      return {
        content: [
          {
            type: "text",
            text: `Set ${alignText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting axis alignment: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_layout_sizing",
  "Set horizontal and vertical sizing modes for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    layoutSizingHorizontal: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing mode (HUG for frames/text only, FILL for auto-layout children only)"),
    layoutSizingVertical: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing mode (HUG for frames/text only, FILL for auto-layout children only)")
  },
  async ({ nodeId, layoutSizingHorizontal, layoutSizingVertical }) => {
    try {
      const result = await sendCommandToFigma("set_layout_sizing", {
        nodeId,
        layoutSizingHorizontal,
        layoutSizingVertical
      });
      const typedResult = result;
      const sizingMessages = [];
      if (layoutSizingHorizontal !== void 0) sizingMessages.push(`horizontal: ${layoutSizingHorizontal}`);
      if (layoutSizingVertical !== void 0) sizingMessages.push(`vertical: ${layoutSizingVertical}`);
      const sizingText = sizingMessages.length > 0 ? `layout sizing (${sizingMessages.join(", ")})` : "layout sizing";
      return {
        content: [
          {
            type: "text",
            text: `Set ${sizingText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout sizing: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_item_spacing",
  "Set distance between children in an auto-layout frame",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    itemSpacing: import_zod.z.number().optional().describe("Distance between children. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN."),
    counterAxisSpacing: import_zod.z.number().optional().describe("Distance between wrapped rows/columns. Only works when layoutWrap is set to WRAP.")
  },
  async ({ nodeId, itemSpacing, counterAxisSpacing }) => {
    try {
      const params = { nodeId };
      if (itemSpacing !== void 0) params.itemSpacing = itemSpacing;
      if (counterAxisSpacing !== void 0) params.counterAxisSpacing = counterAxisSpacing;
      const result = await sendCommandToFigma("set_item_spacing", params);
      const typedResult = result;
      let message = `Updated spacing for frame "${typedResult.name}":`;
      if (itemSpacing !== void 0) message += ` itemSpacing=${itemSpacing}`;
      if (counterAxisSpacing !== void 0) message += ` counterAxisSpacing=${counterAxisSpacing}`;
      return {
        content: [
          {
            type: "text",
            text: message
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting spacing: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_reactions",
  "Get Figma Prototyping Reactions from multiple nodes. CRITICAL: The output MUST be processed using the 'reaction_to_connector_strategy' prompt IMMEDIATELY to generate parameters for connector lines via the 'create_connections' tool.",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to get reactions from")
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("get_reactions", { nodeIds });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          },
          {
            type: "text",
            text: "IMPORTANT: You MUST now use the reaction data above and follow the `reaction_to_connector_strategy` prompt to prepare the parameters for the `create_connections` tool call. This is a required next step."
          }
        ],
        followUp: {
          type: "prompt",
          prompt: "reaction_to_connector_strategy"
        }
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting reactions: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_default_connector",
  "Set a copied connector node as the default connector",
  {
    connectorId: import_zod.z.string().optional().describe("The ID of the connector node to set as default")
  },
  async ({ connectorId }) => {
    try {
      const result = await sendCommandToFigma("set_default_connector", {
        connectorId
      });
      return {
        content: [
          {
            type: "text",
            text: `Default connector set: ${JSON.stringify(result)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting default connector: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_connections",
  "Create connections between nodes using the default connector style",
  {
    connections: import_zod.z.array(import_zod.z.object({
      startNodeId: import_zod.z.string().describe("ID of the starting node"),
      endNodeId: import_zod.z.string().describe("ID of the ending node"),
      text: import_zod.z.string().optional().describe("Optional text to display on the connector")
    })).describe("Array of node connections to create")
  },
  async ({ connections }) => {
    try {
      if (!connections || connections.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No connections provided"
            }
          ]
        };
      }
      const result = await sendCommandToFigma("create_connections", {
        connections
      });
      return {
        content: [
          {
            type: "text",
            text: `Created ${connections.length} connections: ${JSON.stringify(result)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating connections: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_focus",
  "Set focus on a specific node in Figma by selecting it and scrolling viewport to it",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to focus on")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("set_focus", { nodeId });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Focused on node "${typedResult.name}" (ID: ${typedResult.id})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting focus: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_selections",
  "Set selection to multiple nodes in Figma and scroll viewport to show them",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to select")
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("set_selections", { nodeIds });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Selected ${typedResult.count} nodes: ${typedResult.selectedNodes.map((node) => `"${node.name}" (${node.id})`).join(", ")}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting selections: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.prompt(
  "reaction_to_connector_strategy",
  "Strategy for converting Figma prototype reactions to connector lines using the output of 'get_reactions'",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Strategy: Convert Figma Prototype Reactions to Connector Lines

## Goal
Process the JSON output from the \`get_reactions\` tool to generate an array of connection objects suitable for the \`create_connections\` tool. This visually represents prototype flows as connector lines on the Figma canvas.

## Input Data
You will receive JSON data from the \`get_reactions\` tool. This data contains an array of nodes, each with potential reactions. A typical reaction object looks like this:
\`\`\`json
{
  "trigger": { "type": "ON_CLICK" },
  "action": {
    "type": "NAVIGATE",
    "destinationId": "destination-node-id",
    "navigationTransition": { ... },
    "preserveScrollPosition": false
  }
}
\`\`\`

## Step-by-Step Process

### 1. Preparation & Context Gathering
   - **Action:** Call \`read_my_design\` on the relevant node(s) to get context about the nodes involved (names, types, etc.). This helps in generating meaningful connector labels later.
   - **Action:** Call \`set_default_connector\` **without** the \`connectorId\` parameter.
   - **Check Result:** Analyze the response from \`set_default_connector\`.
     - If it confirms a default connector is already set (e.g., "Default connector is already set"), proceed to Step 2.
     - If it indicates no default connector is set (e.g., "No default connector set..."), you **cannot** proceed with \`create_connections\` yet. Inform the user they need to manually copy a connector from FigJam, paste it onto the current page, select it, and then you can run \`set_default_connector({ connectorId: "SELECTED_NODE_ID" })\` before attempting \`create_connections\`. **Do not proceed to Step 2 until a default connector is confirmed.**

### 2. Filter and Transform Reactions from \`get_reactions\` Output
   - **Iterate:** Go through the JSON array provided by \`get_reactions\`. For each node in the array:
     - Iterate through its \`reactions\` array.
   - **Filter:** Keep only reactions where the \`action\` meets these criteria:
     - Has a \`type\` that implies a connection (e.g., \`NAVIGATE\`, \`OPEN_OVERLAY\`, \`SWAP_OVERLAY\`). **Ignore** types like \`CHANGE_TO\`, \`CLOSE_OVERLAY\`, etc.
     - Has a valid \`destinationId\` property.
   - **Extract:** For each valid reaction, extract the following information:
     - \`sourceNodeId\`: The ID of the node the reaction belongs to (from the outer loop).
     - \`destinationNodeId\`: The value of \`action.destinationId\`.
     - \`actionType\`: The value of \`action.type\`.
     - \`triggerType\`: The value of \`trigger.type\`.

### 3. Generate Connector Text Labels
   - **For each extracted connection:** Create a concise, descriptive text label string.
   - **Combine Information:** Use the \`actionType\`, \`triggerType\`, and potentially the names of the source/destination nodes (obtained from Step 1's \`read_my_design\` or by calling \`get_node_info\` if necessary) to generate the label.
   - **Example Labels:**
     - If \`triggerType\` is "ON_CLICK" and \`actionType\` is "NAVIGATE": "On click, navigate to [Destination Node Name]"
     - If \`triggerType\` is "ON_DRAG" and \`actionType\` is "OPEN_OVERLAY": "On drag, open [Destination Node Name] overlay"
   - **Keep it brief and informative.** Let this generated string be \`generatedText\`.

### 4. Prepare the \`connections\` Array for \`create_connections\`
   - **Structure:** Create a JSON array where each element is an object representing a connection.
   - **Format:** Each object in the array must have the following structure:
     \`\`\`json
     {
       "startNodeId": "sourceNodeId_from_step_2",
       "endNodeId": "destinationNodeId_from_step_2",
       "text": "generatedText_from_step_3"
     }
     \`\`\`
   - **Result:** This final array is the value you will pass to the \`connections\` parameter when calling the \`create_connections\` tool.

### 5. Execute Connection Creation
   - **Action:** Call the \`create_connections\` tool, passing the array generated in Step 4 as the \`connections\` argument.
   - **Verify:** Check the response from \`create_connections\` to confirm success or failure.

This detailed process ensures you correctly interpret the reaction data, prepare the necessary information, and use the appropriate tools to create the connector lines.`
          }
        }
      ],
      description: "Strategy for converting Figma prototype reactions to connector lines using the output of 'get_reactions'"
    };
  }
);
server.tool(
  "list_variables",
  "List all local variables in the current Figma document. Returns an array of variable objects, including their id, name, type, and values.",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("list_variables");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing variables: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_node_variables",
  "Get all variable bindings for a specific node. Returns an object mapping property types (e.g., 'fills', 'strokes', 'opacity', etc.) to variable binding info.",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to get variable bindings for")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_node_variables", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: `These are the variables for the node: ${JSON.stringify(result, null, 2)}, you may use the 'list_variables' tool to find the name of the variables.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node variables: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_variable",
  "Create a new variable inside a collection. Returns the created variable object.",
  {
    name: import_zod.z.string().describe("The name of the variable"),
    resolvedType: import_zod.z.enum(["FLOAT", "STRING", "BOOLEAN", "COLOR"]).describe("The type of the variable"),
    description: import_zod.z.string().optional().describe("Optional description for the variable"),
    collectionId: import_zod.z.string().describe("Collection ID to create the variable in you may use the 'list_collections' tool to find the collection ID")
  },
  async ({ name, resolvedType, description, collectionId }) => {
    try {
      const params = {
        name,
        resolvedType,
        description,
        collectionId
      };
      const result = await sendCommandToFigma("create_variable", params);
      return {
        content: [
          {
            type: "text",
            text: `The variable has been created ${JSON.stringify(result, null, 2)} now you must 'set_variable_value' to assign the proper value to the variable. The variable will not be usable until it has a value assigned to it.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating variable: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_variable_value",
  "Set the value of a variable in the Figma document. Returns the updated variable object.",
  {
    variableId: import_zod.z.string().describe("The ID of the variable to update"),
    modeId: import_zod.z.string().optional().describe("Optional mode ID for the variable, if applicable"),
    value: import_zod.z.object({
      r: import_zod.z.number().optional(),
      g: import_zod.z.number().optional(),
      b: import_zod.z.number().optional(),
      a: import_zod.z.number().optional()
    }).optional().describe("The value for the variable"),
    valueType: import_zod.z.enum(["FLOAT", "STRING", "BOOLEAN", "COLOR"]).describe("The type of the value to set"),
    variableReferenceId: import_zod.z.string().optional().describe("Optional reference to another variable")
  },
  async ({ variableId, modeId, value, valueType, variableReferenceId }) => {
    try {
      const formattedValue = valueType === "COLOR" && value ? {
        r: value.r || 0,
        g: value.g || 0,
        b: value.b || 0,
        a: value.a || 1
      } : value;
      const result = await sendCommandToFigma("set_variable_value", {
        variableId,
        modeId,
        value: formattedValue,
        valueType,
        variableReferenceId
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting variable value: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "list_collections",
  "List all variable collections in the Figma document. Returns an array of collection objects, including their id, name, and type.",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("list_collections");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing collections: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_collection",
  "Create a new variable collection in the Figma document. Returns the created collection object with id, name, key, defaultModeId, and modes.",
  {
    name: import_zod.z.string().describe("The name of the collection to create")
  },
  async ({ name }) => {
    try {
      const result = await sendCommandToFigma("create_collection", { name });
      return {
        content: [
          {
            type: "text",
            text: `Created collection: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating collection: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "rename_node",
  "Rename a node in the Figma document. Returns the updated node info.",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to rename"),
    name: import_zod.z.string().describe("The new name for the node")
  },
  async ({ nodeId, name }) => {
    try {
      const result = await sendCommandToFigma("rename_node", { nodeId, name });
      return {
        content: [
          {
            type: "text",
            text: `Renamed node: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error renaming node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
function connectToFigma(port = 3055) {
  if (ws && ws.readyState === import_ws.default.OPEN) {
    logger.info("Already connected to Figma");
    return;
  }
  const wsUrl = serverUrl === "localhost" ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  ws = new import_ws.default(wsUrl);
  ws.on("open", () => {
    logger.info("Connected to Figma socket server");
    currentChannel = null;
  });
  ws.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === "progress_update") {
        const progressData = json.message.data;
        const requestId = json.id || "";
        if (requestId && pendingRequests.has(requestId)) {
          const request = pendingRequests.get(requestId);
          request.lastActivity = Date.now();
          clearTimeout(request.timeout);
          request.timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              logger.error(`Request ${requestId} timed out after extended period of inactivity`);
              pendingRequests.delete(requestId);
              request.reject(new Error("Request to Figma timed out"));
            }
          }, 6e4);
          logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);
          if (progressData.status === "completed" && progressData.progress === 100) {
            logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
          }
        }
        return;
      }
      const myResponse = json.message;
      logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
      logger.log("myResponse" + JSON.stringify(myResponse));
      if (myResponse.id && pendingRequests.has(myResponse.id) && myResponse.result) {
        const request = pendingRequests.get(myResponse.id);
        clearTimeout(request.timeout);
        if (myResponse.error) {
          logger.error(`Error from Figma: ${myResponse.error}`);
          request.reject(new Error(myResponse.error));
        } else {
          if (myResponse.result) {
            request.resolve(myResponse.result);
          }
        }
        pendingRequests.delete(myResponse.id);
      } else {
        logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
      }
    } catch (error) {
      logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  ws.on("error", (error) => {
    logger.error(`Socket error: ${error}`);
  });
  ws.on("close", () => {
    logger.info("Disconnected from Figma socket server");
    ws = null;
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection closed"));
      pendingRequests.delete(id);
    }
    logger.info("Attempting to reconnect in 2 seconds...");
    setTimeout(() => connectToFigma(port), 2e3);
  });
}
async function joinChannel(channelName) {
  if (!ws || ws.readyState !== import_ws.default.OPEN) {
    throw new Error("Not connected to Figma");
  }
  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
function sendCommandToFigma(command, params = {}, timeoutMs = 3e4) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== import_ws.default.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }
    const id = (0, import_uuid.v4)();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...command === "join" ? { channel: params.channel } : { channel: currentChannel },
      message: {
        id,
        command,
        params: {
          ...params,
          commandId: id
          // Include the command ID in params
        }
      }
    };
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${timeoutMs / 1e3} seconds`);
        reject(new Error("Request to Figma timed out"));
      }
    }, timeoutMs);
    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now()
    });
    logger.info(`Sending command to Figma: ${command}`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}
server.tool(
  "create_local_instance",
  "Create an instance of a local (unpublished) component by its node ID, optionally inside a parent node",
  {
    componentId: import_zod.z.string().describe("The node ID of the local component to instantiate"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append the instance into"),
    x: import_zod.z.number().optional().describe("X position").default(0),
    y: import_zod.z.number().optional().describe("Y position").default(0)
  },
  async ({ componentId, parentId, x, y }) => {
    try {
      const result = await sendCommandToFigma("create_local_instance", {
        componentId,
        parentId,
        x,
        y
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating local instance: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component",
  "Convert an existing frame or group into a reusable component",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to convert into a component")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("create_component", { nodeId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component_from_scratch",
  "Create a new empty component node from scratch",
  {
    name: import_zod.z.string().optional().describe("Name for the component"),
    x: import_zod.z.number().optional().describe("X position"),
    y: import_zod.z.number().optional().describe("Y position"),
    width: import_zod.z.number().optional().describe("Width of the component"),
    height: import_zod.z.number().optional().describe("Height of the component"),
    parentId: import_zod.z.string().optional().describe("Parent node ID to append the component to")
  },
  async ({ name, x, y, width, height, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_component_from_scratch", {
        name,
        x,
        y,
        width,
        height,
        parentId
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component from scratch: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component_set",
  "Group variant components into a component set",
  {
    componentIds: import_zod.z.preprocess(
      (val) => typeof val === "string" ? JSON.parse(val) : val,
      import_zod.z.array(import_zod.z.string())
    ).describe("Array of component node IDs to combine as variants"),
    name: import_zod.z.string().optional().describe("Name for the component set")
  },
  async ({ componentIds, name }) => {
    try {
      const result = await sendCommandToFigma("create_component_set", {
        componentIds,
        name
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component set: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_page",
  "Create a new page in the Figma document",
  {
    name: import_zod.z.string().optional().describe("Name for the new page")
  },
  async ({ name }) => {
    try {
      const result = await sendCommandToFigma("create_page", { name });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating page: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "switch_page",
  "Navigate to a specific page in the Figma document",
  {
    pageId: import_zod.z.string().describe("The ID of the page to switch to")
  },
  async ({ pageId }) => {
    try {
      const result = await sendCommandToFigma("switch_page", { pageId });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error switching page: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_all_pages",
  "List all pages in the Figma document with their IDs and child counts",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_all_pages");
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting pages: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_opacity",
  "Set the opacity of a node (0 to 1)",
  {
    nodeId: import_zod.z.string().describe("The ID of the node"),
    opacity: import_zod.z.number().min(0).max(1).describe("Opacity value from 0 (transparent) to 1 (opaque)")
  },
  async ({ nodeId, opacity }) => {
    try {
      const result = await sendCommandToFigma("set_opacity", { nodeId, opacity });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting opacity: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_effects",
  "Set effects (drop shadow, inner shadow, layer blur, background blur) on a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node"),
    effects: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.enum(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"]).describe("Effect type"),
      visible: import_zod.z.boolean().optional().describe("Whether the effect is visible"),
      radius: import_zod.z.number().optional().describe("Blur radius"),
      color: import_zod.z.object({
        r: import_zod.z.number(),
        g: import_zod.z.number(),
        b: import_zod.z.number(),
        a: import_zod.z.number().optional()
      }).optional().describe("Effect color (for shadows)"),
      offset: import_zod.z.object({
        x: import_zod.z.number(),
        y: import_zod.z.number()
      }).optional().describe("Shadow offset"),
      spread: import_zod.z.number().optional().describe("Shadow spread"),
      blendMode: import_zod.z.string().optional().describe("Blend mode")
    })).describe("Array of effects to apply")
  },
  async ({ nodeId, effects }) => {
    try {
      const result = await sendCommandToFigma("set_effects", { nodeId, effects });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting effects: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_style",
  "Create a named reusable style (fill/paint, text, or effect) in the document",
  {
    name: import_zod.z.string().describe("Name for the style"),
    type: import_zod.z.enum(["FILL", "TEXT", "EFFECT"]).describe("Type of style to create"),
    paints: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.string(),
      color: import_zod.z.object({
        r: import_zod.z.number(),
        g: import_zod.z.number(),
        b: import_zod.z.number(),
        a: import_zod.z.number().optional()
      }).optional(),
      visible: import_zod.z.boolean().optional(),
      opacity: import_zod.z.number().optional()
    })).optional().describe("Paint array for FILL styles"),
    effects: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.string(),
      visible: import_zod.z.boolean().optional(),
      radius: import_zod.z.number().optional(),
      color: import_zod.z.object({
        r: import_zod.z.number(),
        g: import_zod.z.number(),
        b: import_zod.z.number(),
        a: import_zod.z.number().optional()
      }).optional(),
      offset: import_zod.z.object({
        x: import_zod.z.number(),
        y: import_zod.z.number()
      }).optional(),
      spread: import_zod.z.number().optional()
    })).optional().describe("Effects array for EFFECT styles"),
    fontSize: import_zod.z.number().optional().describe("Font size for TEXT styles"),
    fontFamily: import_zod.z.string().optional().describe("Font family for TEXT styles"),
    fontStyle: import_zod.z.string().optional().describe("Font style for TEXT styles (e.g. Regular, Bold)"),
    lineHeight: import_zod.z.number().optional().describe("Line height for TEXT styles"),
    letterSpacing: import_zod.z.number().optional().describe("Letter spacing for TEXT styles")
  },
  async ({ name, type, paints, effects, fontSize, fontFamily, fontStyle, lineHeight, letterSpacing }) => {
    try {
      const result = await sendCommandToFigma("create_style", {
        name,
        type,
        paints,
        effects,
        fontSize,
        fontFamily,
        fontStyle,
        lineHeight,
        letterSpacing
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating style: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "reorder_child",
  "Reorder a child node within its parent by moving it to a specific index (0-based). Use this to change sibling order.",
  {
    parentId: import_zod.z.string().describe("The ID of the parent node"),
    childId: import_zod.z.string().describe("The ID of the child node to reorder"),
    index: import_zod.z.number().describe("The target index (0-based) within the parent's children")
  },
  async ({ parentId, childId, index }) => {
    try {
      const result = await sendCommandToFigma("reorder_child", { parentId, childId, index });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reordering child: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "join_channel",
  "Join a specific channel to communicate with Figma",
  {
    channel: import_zod.z.string().describe("The name of the channel to join").default("")
  },
  async ({ channel }) => {
    try {
      if (!channel) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a channel name to join:"
            }
          ],
          followUp: {
            tool: "join_channel",
            description: "Join the specified channel"
          }
        };
      }
      await joinChannel(channel);
      return {
        content: [
          {
            type: "text",
            text: `Successfully joined channel: ${channel}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error joining channel: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
async function main() {
  if (relayOnlyMode) {
    logger.info("Starting in relay-only mode...");
    try {
      await startRelayServer(relayPort);
      logger.info(`Relay server started on port ${relayPort}. Press Ctrl+C to stop.`);
      await new Promise(() => {
      });
    } catch (error) {
      logger.error(`Failed to start relay server: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
    return;
  }
  try {
    await startRelayServer(relayPort);
    logger.info(`Embedded relay server started on port ${relayPort}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already in use")) {
      logger.info(`Relay server already running on port ${relayPort}, using existing server`);
    } else {
      logger.warn(`Could not start embedded relay: ${error instanceof Error ? error.message : String(error)}`);
      logger.warn("Continuing without embedded relay - ensure external relay is running");
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  try {
    connectToFigma(relayPort);
  } catch (error) {
    logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
    logger.warn("Will try to connect when the first command is sent");
  }
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  logger.info("FigmaMCP server running on stdio");
}
main().catch((error) => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map