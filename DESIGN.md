# Design

## Overview

The UI is a bare-bones editor shell for `.rmg.json` templates. It should feel closer to a level editor utility than a dashboard: clear regions, hard borders, compact labels, and no decorative panels.

## Layout

The shell has four fixed regions:

- Top bar: `Load template`, `New template`, `Save template`, `Add Core.zip`, `Undo`, `Redo`.
- Left sidebar: global settings, zone list, and players sections with resizable dividers.
- Center workspace: `Canvas` tab.
- Right inspector: Zone, Connection, Objects, Content, Pools, Roads, Raw, and Validation tabs.
- The left rail and right inspector have hard separator resize handles.

Desktop uses a three-column editor grid. Medium screens move the inspector below the workspace. Small screens collapse to one column while preserving the same region order.

## Color

Color is intentionally low-expression:

- background: true near-white
- panels: white and neutral gray
- text: near-black
- borders: gray and near-black
- active state: flat gray fill
- focus: blue outline only

No gradients, shadows, glass effects, decorative glows, or nested card surfaces.

## Typography

Use compact UI typography:

- Sans: `"IBM Plex Sans", "Aptos", "Segoe UI", sans-serif`
- Mono: `"JetBrains Mono", "Berkeley Mono", "SFMono-Regular", monospace`

Use monospace for schema counts, IDs, and zone labels where it helps scanning.

## Components

Reusable component families are deliberately small:

- Buttons: `primary`, `secondary`
- Tabs: shared tab button primitive
- Value rows: label/value table rows
- Navigation rows
- Object identity rows: compact icon/type, label, and optional detail in `ObjectIdentity.svelte`
- Canvas nodes and connection lines
- Dotted draft connection line for `Ctrl` + drag
- Zone-internal object nodes and road lines
- Disabled state for unavailable commands
- Selectable connection lines
- SVG spline layers connected to live rectangle centers
- Horizontal tab overflow for dense inspector tabs

Component rules:

- Prefer full-width rows and hard separators over cards.
- Avoid nested panels unless the data model requires it.
- Keep copy short and task-specific.
- Preserve selected state with both fill and hard outline or inset line.

## Accessibility

The shell targets WCAG 2.2 AA:

- visible focus outlines
- semantic header, navigation, main, and inspector regions
- buttons for navigation and tab controls
- no color-only state indication
- responsive layout without clipped controls

## Source Files

- `src/ui/styles/tokens.css`
- `src/ui/styles/base.css`
- `src/ui/styles/layout.css`
- `src/ui/styles/components.css`
- `src/ui/components/*.ts`
