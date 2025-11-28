# TalkToFigma MCP - Complete Tools Overview

## 🔗 Connection Management

### `join_channel`
**Purpose**: Connect to a specific channel for communicating with Figma plugin  
**Parameters**: `channel` (string) - Channel ID from Figma plugin  
**Use Case**: First command to run before any other operations

---

## 📖 Document & Selection Tools

### `get_document_info`
**Purpose**: Get overview of the current Figma document structure  
**Returns**: Document name, pages, all top-level nodes with IDs and types  
**Use Case**: Understand document layout before making changes

### `get_selection`
**Purpose**: Get information about currently selected nodes in Figma  
**Returns**: Selection count and array of selected node info  
**Use Case**: See what user has selected before modifying

### `read_my_design`
**Purpose**: Get detailed information about current selection (detailed node data)  
**Returns**: Complete node tree with all properties  
**Use Case**: Deep analysis of selected design elements

### `get_node_info`
**Purpose**: Get detailed info about a specific node by ID  
**Parameters**: `nodeId` (string)  
**Returns**: Filtered node data (excludes VECTOR types)  
**Use Case**: Inspect specific element properties

### `get_nodes_info`
**Purpose**: Get info for multiple nodes at once  
**Parameters**: `nodeIds` (array of strings)  
**Returns**: Array of node information  
**Use Case**: Batch inspection of multiple elements

### `set_focus`
**Purpose**: Select a node and scroll viewport to it  
**Parameters**: `nodeId` (string)  
**Use Case**: Navigate to specific elements

### `set_selections`
**Purpose**: Select multiple nodes and scroll to show them  
**Parameters**: `nodeIds` (array of strings)  
**Use Case**: Multi-select and navigate

---

## 🎨 Creating Elements

### `create_rectangle`
**Purpose**: Create a new rectangle shape  
**Parameters**: 
- `x`, `y` (numbers) - Position
- `width`, `height` (numbers) - Size
- `name` (string, optional) - Layer name
- `parentId` (string, optional) - Parent container  
**Use Case**: Basic shapes, containers

### `create_frame`
**Purpose**: Create a new frame (container)  
**Parameters**:
- `x`, `y`, `width`, `height` (numbers)
- `name` (string, optional)
- `parentId` (string, optional)
- `fillColor` (RGBA object, optional)
- `strokeColor` (RGBA object, optional)
- `strokeWeight` (number, optional)
- Auto-layout options: `layoutMode`, `layoutWrap`, `paddingTop/Right/Bottom/Left`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `layoutSizingHorizontal/Vertical`, `itemSpacing`  
**Use Case**: Containers, screens, sections with optional auto-layout

### `create_text`
**Purpose**: Create a text element  
**Parameters**:
- `x`, `y` (numbers)
- `text` (string) - Content
- `fontSize` (number, optional, default: 14)
- `fontWeight` (number, optional, default: 400)
- `fontColor` (RGBA object, optional)
- `name` (string, optional)
- `parentId` (string, optional)  
**Use Case**: Labels, headings, body text

---

## 🎨 Styling & Modification

### `set_fill_color`
**Purpose**: Set fill color of a node  
**Parameters**: `nodeId`, `r`, `g`, `b`, `a` (0-1 range)  
**Use Case**: Change background colors, fills

### `set_stroke_color`
**Purpose**: Set stroke color and weight  
**Parameters**: `nodeId`, `r`, `g`, `b`, `a`, `weight` (optional)  
**Use Case**: Borders, outlines

### `set_corner_radius`
**Purpose**: Set corner radius (rounded corners)  
**Parameters**: `nodeId`, `radius` (number), `corners` (4 booleans, optional)  
**Use Case**: Rounded rectangles, cards

---

## 📐 Layout & Auto-Layout

### `set_layout_mode`
**Purpose**: Enable/configure auto-layout on a frame  
**Parameters**: `nodeId`, `layoutMode` ("NONE"|"HORIZONTAL"|"VERTICAL"), `layoutWrap` (optional)  
**Use Case**: Convert frames to auto-layout containers

### `set_padding`
**Purpose**: Set padding values for auto-layout frame  
**Parameters**: `nodeId`, `paddingTop/Right/Bottom/Left` (numbers, optional)  
**Use Case**: Spacing inside containers

### `set_axis_align`
**Purpose**: Set alignment within auto-layout  
**Parameters**: `nodeId`, `primaryAxisAlignItems` (MIN|MAX|CENTER|SPACE_BETWEEN), `counterAxisAlignItems` (MIN|MAX|CENTER|BASELINE)  
**Use Case**: Align items in auto-layout

### `set_layout_sizing`
**Purpose**: Set sizing behavior for auto-layout children  
**Parameters**: `nodeId`, `layoutSizingHorizontal/Vertical` (FIXED|HUG|FILL)  
**Use Case**: Control how children size in auto-layout

### `set_item_spacing`
**Purpose**: Set spacing between auto-layout children  
**Parameters**: `nodeId`, `itemSpacing` (number), `counterAxisSpacing` (number, optional)  
**Use Case**: Gap between items in auto-layout

---

## 🔄 Transform Operations

### `move_node`
**Purpose**: Move a node to new position  
**Parameters**: `nodeId`, `x`, `y`  
**Use Case**: Repositioning elements

### `resize_node`
**Purpose**: Resize a node  
**Parameters**: `nodeId`, `width`, `height`  
**Use Case**: Change dimensions

### `clone_node`
**Purpose**: Duplicate a node  
**Parameters**: `nodeId`, `x`, `y` (optional) - Position for clone  
**Use Case**: Copy elements

### `delete_node`
**Purpose**: Delete a single node  
**Parameters**: `nodeId`  
**Use Case**: Remove elements

### `delete_multiple_nodes`
**Purpose**: Delete multiple nodes at once  
**Parameters**: `nodeIds` (array)  
**Use Case**: Batch deletion

---

## 📝 Text Operations

### `set_text_content`
**Purpose**: Change text content of a text node  
**Parameters**: `nodeId`, `text`  
**Use Case**: Update text values

### `scan_text_nodes`
**Purpose**: Find all text nodes in a container (with chunking for large designs)  
**Parameters**: `nodeId`  
**Returns**: Array of all text nodes with their IDs and content  
**Use Case**: Text replacement workflows, content audits

### `set_multiple_text_contents`
**Purpose**: Batch update multiple text nodes efficiently  
**Parameters**: `nodeId` (parent), `text` (array of {nodeId, text})  
**Use Case**: Bulk text replacement, translations

---

## 🏷️ Components & Instances

### `get_local_components`
**Purpose**: List all components in the document  
**Returns**: Array of component info (id, name, key)  
**Use Case**: Find available components

### `create_component_instance`
**Purpose**: Create an instance of a component  
**Parameters**: `componentKey`, `x`, `y`  
**Use Case**: Use existing components

### `get_instance_overrides`
**Purpose**: Extract override properties from a component instance  
**Parameters**: `nodeId` (optional - uses selection if not provided)  
**Returns**: Override data that can be applied to other instances  
**Use Case**: Copy instance customizations

### `set_instance_overrides`
**Purpose**: Apply overrides to multiple component instances  
**Parameters**: `sourceInstanceId`, `targetNodeIds` (array)  
**Use Case**: Propagate instance customizations, swap component variants

---

## 📋 Annotations

### `get_annotations`
**Purpose**: Get all annotations in document or specific node  
**Parameters**: `nodeId` (string), `includeCategories` (boolean, optional)  
**Returns**: Annotations with markdown content and categories  
**Use Case**: Read design documentation/notes

### `set_annotation`
**Purpose**: Create or update a single annotation  
**Parameters**: `nodeId`, `labelMarkdown` (string), `categoryId` (optional), `annotationId` (optional for updates), `properties` (optional)  
**Use Case**: Add documentation to elements

### `set_multiple_annotations`
**Purpose**: Batch create/update multiple annotations  
**Parameters**: `nodeId` (parent), `annotations` (array)  
**Use Case**: Convert manual annotations to native Figma annotations

### `scan_nodes_by_types`
**Purpose**: Find nodes by type in a container  
**Parameters**: `nodeId`, `types` (array of strings like ["COMPONENT", "FRAME"])  
**Returns**: Matching nodes with positions  
**Use Case**: Find annotation targets, locate specific element types

---

## 🔗 Prototyping & Connections (FigJam)

### `get_reactions`
**Purpose**: Extract prototype reactions/flows from nodes  
**Parameters**: `nodeIds` (array)  
**Returns**: Reaction data with triggers and destinations  
**Use Case**: Convert prototype flows to connectors

### `set_default_connector`
**Purpose**: Set a connector style for creating connections  
**Parameters**: `connectorId` (optional)  
**Use Case**: Prepare connector styling before creating connections

### `create_connections`
**Purpose**: Create connector lines between nodes (FigJam)  
**Parameters**: `connections` (array of {startNodeId, endNodeId, text?})  
**Use Case**: Visualize flows, create diagrams

---

## 📤 Export & Utilities

### `export_node_as_image`
**Purpose**: Export a node as an image  
**Parameters**: `nodeId`, `format` (PNG|JPG|SVG|PDF), `scale` (number)  
**Returns**: Base64 image data  
**Use Case**: Screenshots, design exports

### `get_styles`
**Purpose**: Get all local styles from document  
**Returns**: Arrays of color, text, effect, and grid styles  
**Use Case**: List existing styles (currently read-only)

---

## 🧠 Strategy Prompts (MCP Prompts)

The MCP also includes helper prompts for complex workflows:

- **`design_strategy`** - Best practices for creating designs
- **`read_design_strategy`** - Best practices for reading designs
- **`text_replacement_strategy`** - Systematic text replacement approach
- **`annotation_conversion_strategy`** - Convert manual annotations to native
- **`swap_overrides_instances`** - Transfer overrides between instances
- **`reaction_to_connector_strategy`** - Convert prototype flows to connectors

---

## 📊 Tool Categories Summary

| Category | Count | Tools |
|----------|-------|-------|
| Document/Selection | 6 | get_document_info, get_selection, read_my_design, get_node_info, get_nodes_info, set_focus, set_selections |
| Creating Elements | 3 | create_rectangle, create_frame, create_text |
| Styling | 3 | set_fill_color, set_stroke_color, set_corner_radius |
| Layout/Auto-Layout | 5 | set_layout_mode, set_padding, set_axis_align, set_layout_sizing, set_item_spacing |
| Transform | 4 | move_node, resize_node, clone_node, delete_node, delete_multiple_nodes |
| Text Operations | 3 | set_text_content, scan_text_nodes, set_multiple_text_contents |
| Components | 4 | get_local_components, create_component_instance, get_instance_overrides, set_instance_overrides |
| Annotations | 4 | get_annotations, set_annotation, set_multiple_annotations, scan_nodes_by_types |
| Prototyping | 3 | get_reactions, set_default_connector, create_connections |
| Export/Utils | 2 | export_node_as_image, get_styles |

**Total: ~37 tools + 6 strategy prompts**

