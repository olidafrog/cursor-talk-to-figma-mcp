# Cursor Changelog

## [2025-11-28 10:40] - STYLE

### Files Modified
- `src/cursor_mcp_plugin/ui.html`

### Changes Made
- Redesigned the Connection Status and Channel ID layout:
  - Merged into a single flex row with 8px gap
  - Simplified connection status to a colored dot (Red/Green/Blue) + short text ("Connected" / "Disconnected")
  - Reduced Channel ID visual prominence (smaller font, padding)
  - Aligned Channel ID height with the status indicator
- Removed verbose connection messages in favor of simple state indicators
- Removed manual connection status class manipulation in favor of state-based styling

### Impact
- Cleaner, more modern UI
- Reduced visual clutter
- Better use of vertical space
- Status information is more concise and easier to scan

### Testing Notes
- Verify "Disconnected" state shows red dot and text
- Verify "Connecting..." shows blue dot
- Verify "Connected" shows green dot and reveals the Channel ID
- Check that Channel ID copy functionality still works

---

## [2025-11-28 10:30] - STYLE

### Files Modified
- `src/cursor_mcp_plugin/ui.html`
- `src/cursor_mcp_plugin/code.js`

### Changes Made
- Rearranged the Connection tab UI:
  - Moved "Disconnect" button next to "Connect" button in a flex row
  - Made WebSocket port input full-width above the buttons
  - Added `.button-container` for proper button layout with 8px gap
- Reduced plugin window height by 100px (from 450px to 350px) to be more compact

### Impact
- More intuitive button placement (Connect/Disconnect together)
- Better use of horizontal space
- Reduced visual footprint on the Figma canvas

### Testing Notes
- Verify buttons are side-by-side with equal width and gap
- Check that the port input spans full width
- Confirm the plugin window height is smaller

---

## [2025-11-28 10:20] - BUGFIX

### Files Modified
- `src/cursor_mcp_plugin/ui.html`

### Changes Made
- Fixed clipboard copy not working in Figma plugin iframe
- Replaced `navigator.clipboard.writeText()` with fallback `execCommand('copy')` method
- The modern clipboard API doesn't work in Figma plugin iframes due to security restrictions

### Impact
- Copy-to-clipboard now works correctly when clicking the channel ID badge

### Testing Notes
- Reload the Figma plugin and test clicking the channel ID badge
- Verify it copies, turns green, and shows the notification

---

## [2025-11-28 10:15] - FEATURE

### Files Modified
- `src/cursor_mcp_plugin/ui.html`

### Changes Made
- Added a dedicated clickable channel ID container in the Figma plugin UI
- Channel ID is now displayed in its own styled badge with monospace font
- Single-click on the channel ID copies it to clipboard
- Visual feedback shows green "copied" state for 2 seconds
- Figma notification confirms when channel ID is copied
- Removed channel ID from the inline connection status message to prevent line-breaking issues

### Impact
- Much easier to copy channel ID - single click instead of manual text selection
- Cleaner UI with channel ID visually separated from connection status
- Better user experience with copy confirmation feedback

### Testing Notes
- Connect to the MCP server and verify channel ID appears in its own container
- Click the channel ID and verify it copies to clipboard
- Verify the Figma notification appears confirming the copy
- Check that the badge turns green briefly after copying

---

## [2024-11-28 23:30] - DOCS

### Files Modified
- `readme.md`

### Changes Made
- Added `rename_node` to the "Layout & Organization" section
- Added `create_collection` to the "Variables & Design Tokens" section
- Updated best practices for working with variables to include the full workflow:
  - Creating collections before variables
  - Setting variable values after creation
  - Renaming nodes to match variable naming conventions

### Impact
- Documentation now reflects all available MCP tools
- Users have clearer guidance on the complete design token workflow

### Testing Notes
- Review readme.md for accuracy and completeness

---

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

