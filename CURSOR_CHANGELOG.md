# Cursor Changelog

## [2024-11-28 23:15] - FEATURE

### Files Modified
- `src/cursor_mcp_plugin/code.js`
- `src/talk_to_figma_mcp/server.ts`

### Changes Made
- Added `create_collection` command to create new variable collections in Figma
- Added `rename_node` command to rename any node by its ID
- Added MCP tool definitions in server.ts for both new commands
- These commands were needed to complete the design token workflow (creating collections for variables and renaming swatch rectangles)

### Impact
- Users can now create variable collections programmatically before adding variables
- Node renaming is now possible via MCP, enabling batch renaming operations
- Completes the variable creation workflow that was missing the collection creation step

### Testing Notes
- Restart Cursor to reload the MCP server with new tools
- Reload the Figma plugin to pick up the new commands
- Test `create_collection` with a name parameter
- Test `rename_node` with nodeId and name parameters

---

## [2024-11-28 21:45] - FEATURE

### Files Modified
- `src/cursor_mcp_plugin/code.js`
- `src/talk_to_figma_mcp/server.ts`
- `readme.md`

### Changes Made
- Merged PR #84 from upstream repository (grab/cursor-talk-to-figma-mcp)
- Added Variables & Design Tokens support with new MCP tools:
  - `list_variables` - List all local variables in the document
  - `list_collections` - List all variable collections
  - `get_node_variables` - Get variable bindings for a node
  - `create_variable` - Create new variables (FLOAT, STRING, BOOLEAN, COLOR)
  - `set_variable_value` - Set variable values with mode support
- Added Paint manipulation tools:
  - `get_node_paints` - Retrieve Paint[] (fills/strokes) from nodes
  - `set_node_paints` - Set paints with variable binding support
- Added `get_team_components` - Access team library components
- Resolved merge conflicts to preserve `set_focus` and `set_selections` tools
- Updated readme.md with documentation for all new tools and best practices

### Impact
- Users can now create and manage Figma variables programmatically
- Design tokens and theming can be controlled via the MCP
- Paint properties can be bound to variables for dynamic styling
- Team library components are now accessible
- No breaking changes to existing functionality

### Testing Notes
- Restart Cursor to reload MCP server with new tools
- Reconnect to Figma plugin channel after restart
- Test variable creation with different types (FLOAT, STRING, BOOLEAN, COLOR)
- Verify paint binding works with `set_node_paints` and `boundVariables`

---

