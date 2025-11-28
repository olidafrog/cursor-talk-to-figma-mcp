# Adding Style Creation Functionality - Implementation Assessment

## 🎯 Current State

The MCP currently has **read-only** style access:
- ✅ `get_styles` - Reads all local styles (colors, texts, effects, grids)
- ❌ No ability to create new styles

## 🛠️ How Easy Would It Be to Add?

**Difficulty Level: ⭐⭐ (Easy to Moderate)**

### Why It's Relatively Easy:

1. **Existing Pattern**: The codebase already follows a consistent pattern:
   - Command handler in switch statement (`code.js`)
   - Function implementation in same file
   - MCP tool registration in `server.ts`
   - Type definitions in `CommandParams` type

2. **Figma Plugin API is Straightforward**: Creating styles uses simple API calls:
   - `figma.createPaintStyle()` - For color styles
   - `figma.createTextStyle()` - For text styles
   - `figma.createEffectStyle()` - For effect styles
   - `figma.createGridStyle()` - For grid styles

3. **Code Already Handles Similar Operations**: 
   - The codebase already creates paint objects inline (see `setFillColor`, `setStrokeColor`)
   - Similar parameter structures exist (RGBA colors, text properties)

## 📋 Implementation Plan

### Step 1: Plugin Implementation (`src/cursor_mcp_plugin/code.js`)

#### A. Add Command Handlers (in switch statement, ~line 110)

```javascript
case "create_paint_style":
  return await createPaintStyle(params);
case "create_text_style":
  return await createTextStyle(params);
case "create_effect_style":
  return await createEffectStyle(params);
case "create_grid_style":
  return await createGridStyle(params);
```

#### B. Implement Functions (~line 1100, after `getStyles`)

```javascript
async function createPaintStyle(params) {
  const { name, color, paintType = "SOLID" } = params || {};
  
  if (!name) {
    throw new Error("Missing name parameter");
  }
  
  // Create paint style
  const paintStyle = figma.createPaintStyle();
  paintStyle.name = name;
  
  // Set paint properties based on type
  if (paintType === "SOLID" && color) {
    paintStyle.paints = [{
      type: "SOLID",
      color: {
        r: color.r || 0,
        g: color.g || 0,
        b: color.b || 0,
      },
      opacity: color.a !== undefined ? color.a : 1,
    }];
  }
  // Add support for gradients, images, etc.
  
  return {
    id: paintStyle.id,
    name: paintStyle.name,
    key: paintStyle.key,
    success: true,
  };
}

async function createTextStyle(params) {
  const { 
    name, 
    fontSize, 
    fontFamily = "Inter", 
    fontWeight = 400,
    // ... other text properties
  } = params || {};
  
  if (!name) {
    throw new Error("Missing name parameter");
  }
  
  // Load font first
  await figma.loadFontAsync({
    family: fontFamily,
    style: getFontStyle(fontWeight), // reuse existing function
  });
  
  // Create text style
  const textStyle = figma.createTextStyle();
  textStyle.name = name;
  textStyle.fontSize = fontSize || 14;
  textStyle.fontName = { family: fontFamily, style: getFontStyle(fontWeight) };
  // Set other properties...
  
  return {
    id: textStyle.id,
    name: textStyle.name,
    key: textStyle.key,
    success: true,
  };
}

// Similar for effect and grid styles...
```

**Estimated Lines of Code**: ~200-300 lines for all 4 style types

### Step 2: MCP Server Implementation (`src/talk_to_figma_mcp/server.ts`)

#### A. Add Tool Registrations (~line 935, after `get_styles`)

```typescript
// Create Paint Style Tool
server.tool(
  "create_paint_style",
  "Create a new paint style (color style) in Figma",
  {
    name: z.string().describe("Name for the style"),
    color: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1).optional(),
    }).describe("RGBA color value"),
    paintType: z.enum(["SOLID", "GRADIENT_LINEAR", "GRADIENT_RADIAL"]).optional().default("SOLID"),
  },
  async ({ name, color, paintType }: any) => {
    try {
      const result = await sendCommandToFigma("create_paint_style", {
        name,
        color,
        paintType,
      });
      return {
        content: [{
          type: "text",
          text: `Created paint style "${name}" with ID: ${result.id}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating paint style: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }
);

// Similar for other style types...
```

#### B. Add Type Definitions (~line 2611)

```typescript
type FigmaCommand =
  | "create_paint_style"
  | "create_text_style"
  | "create_effect_style"
  | "create_grid_style"
  // ... existing commands

type CommandParams = {
  create_paint_style: {
    name: string;
    color: { r: number; g: number; b: number; a?: number };
    paintType?: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL";
  };
  create_text_style: {
    name: string;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: number;
    // ... other text properties
  };
  // ... other style types
}
```

**Estimated Lines of Code**: ~150-200 lines for all 4 tools

### Step 3: Update README

Add documentation for new tools in the "MCP Tools" section.

**Estimated Lines of Code**: ~20-30 lines

## 📊 Complexity Breakdown

| Component | Difficulty | Time Estimate |
|-----------|-----------|---------------|
| Plugin implementation | ⭐⭐ Easy | 2-3 hours |
| MCP server tools | ⭐ Easy | 1-2 hours |
| Type definitions | ⭐ Easy | 30 mins |
| Testing | ⭐⭐ Moderate | 2-3 hours |
| Documentation | ⭐ Easy | 1 hour |
| **Total** | **⭐⭐ Easy-Moderate** | **6-9 hours** |

## 🎯 Recommended Implementation Order

1. **Start with Paint Styles** (easiest)
   - Most commonly used
   - Straightforward API
   - Similar to existing `setFillColor` logic

2. **Text Styles** (moderate)
   - Need font loading (already handled in `createText`)
   - More properties to configure

3. **Effect Styles** (moderate-hard)
   - More complex property structure
   - Less commonly needed

4. **Grid Styles** (moderate)
   - Less commonly used
   - Specific to layout grids

## ⚠️ Potential Challenges

1. **Font Loading**: Text styles require fonts to be loaded first (already handled elsewhere in codebase)

2. **Style Naming Conflicts**: Figma doesn't allow duplicate style names - may need to handle errors gracefully

3. **Paint Type Complexity**: Beyond solid colors, gradients have additional properties (stops, angles, etc.)

4. **Style Binding**: After creation, users might want to apply styles to nodes - would need separate tool or extend existing tools

## 💡 Additional Enhancements (Future)

1. **Apply Style to Node**: Extend `set_fill_color` to accept a style ID instead of raw color
2. **Update Existing Style**: Modify existing styles
3. **Delete Style**: Remove styles
4. **Style from Node**: Extract style from existing node and create a reusable style

## ✅ Conclusion

**Adding style creation is definitely feasible and relatively straightforward!**

The main work involves:
- Following existing code patterns
- Using well-documented Figma Plugin API methods
- Adding appropriate error handling

The hardest part would be handling edge cases (duplicate names, complex gradient configurations, etc.), but the core functionality is very achievable.

**Estimated Total Time**: 1-2 days of focused development work.

