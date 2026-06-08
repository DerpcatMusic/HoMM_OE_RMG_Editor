# Plan: Instant-apply forms + Sidebar layout persistence

## Problem 1: Sidebar section sizes reset on re-render

The sidebar resize handles set inline `flex` styles on DOM elements. `render()` recreates the DOM, losing those styles.

### Fix
- Store sidebar section flex values in appShell state (`sidebarSections`)
- Default: `{ settings: 6, zones: 2.5, players: 1.5 }`
- Pass as props to sidebar, apply as inline `style="flex:N"` on each section
- Resize handle updates state + calls `render()` (layout persists across renders)

### Files
- `appShell.ts` — add `sidebarSections` state, pass to sidebar
- `sidebar.ts` — accept section flex values in props, apply to sections
- `sidebar.ts` — resize handler calls a callback instead of setting inline styles directly

---

## Problem 2: "Apply" button pattern → Instant-apply with per-field reset

### Current pattern
1. Form creates input elements with initial values
2. User edits fields
3. User clicks "Apply"
4. All values collected → mutation → render

### New pattern
1. Form creates input elements with initial values
2. User edits a field → mutation fires immediately (debounced for text)
3. Field shows "dirty" indicator + reset button
4. Re-render does NOT recreate the form (form is stable)
5. Navigating away + back creates fresh form from session state

### Key insight
The form must survive `render()`. Currently `render()` recreates everything. The fix: the form's `change` callback mutates the session and re-renders OTHER parts (canvas, sidebar, inspector header) but NOT the form itself.

### Implementation

#### A. `createStableForm` helper (new utility)
```ts
function createStableForm(config: {
  onFieldChange: (fieldId: string, value: unknown) => void;
  onResetField: (fieldId: string) => void;
}): { element: HTMLElement; markDirty: (fieldId: string) => void; markClean: (fieldId: string) => void }
```

Actually, simpler: each form wraps controls in `createFieldControl()`:
```ts
function createFieldControl(label: string, input: HTMLElement, opts: {
  initialValue: string;
  onCommit: (value: string) => void;
  onReset: () => void;
}): HTMLElement
```

This creates a control row with:
- The input
- A hidden reset button that appears when value ≠ initialValue
- `change`/`input`/`blur` listeners that call `onCommit`

#### B. Form → AppShell communication

The form needs to apply mutations without triggering a full re-render. Two approaches:

**Option A: Callback that skips form re-render**
- Form's `onCommit` calls `session = updateZoneField(session, fieldId, value)`
- Then calls `render({ skipFormRebuild: true })` — re-renders canvas/sidebar/header but not the inspector body
- Problem: complex, needs render granularity

**Option B: Direct session mutation + targeted DOM update**
- Form's `onCommit` mutates session directly
- Updates only the parts that changed (canvas zone label, sidebar zone name, etc.)
- No full re-render at all
- Problem: needs to know what to update

**Option C (chosen): Mutation callback with selective re-render**
- Form emits `{ field, value }` to parent
- Parent applies mutation to session
- Parent re-renders everything EXCEPT the currently active inspector form
- The form element is detached before render, re-attached after
- Form's dirty state survives because the DOM nodes persist

Implementation:
```ts
// In appShell:
let stableFormElement: HTMLElement | null = null;

const render = (opts?: { preserveInspectorForm?: boolean }) => {
  // ... build shell ...
  if (opts?.preserveInspectorForm && stableFormElement) {
    // Re-use existing form element instead of creating new one
  }
};
```

#### C. Per-field reset

Each field tracks its initial value. When current ≠ initial:
- Add `.is-dirty` class to the control row
- Show a small reset button (undo icon)
- Clicking reset restores initial value and fires onCommit

#### D. Debouncing

Text inputs debounce at 300ms. Number inputs, selects, checkboxes fire immediately.

### Files to modify
- `src/ui/components/inspector/controls.ts` — add `createInstantControl()` wrapper
- `src/ui/components/zoneFormHelpers.ts` — rewrite `createZoneEditForm` to use instant-apply
- `src/ui/components/inspector/globalSettingsPanel.ts` — rewrite to use instant-apply
- `src/ui/components/inspector/mainObjectPanel.ts` — rewrite to use instant-apply
- `src/ui/components/inspector/roadPanel.ts` — rewrite to use instant-apply
- `src/ui/components/appShell.ts` — add form preservation logic to render
- `src/ui/styles/components.css` — add `.is-dirty`, `.field-reset` styles

### Execution order
1. Fix sidebar layout persistence (small, isolated)
2. Create `createInstantControl` utility in controls.ts
3. Rewrite globalSettingsPanel.ts as proof of concept
4. Wire form preservation in appShell.ts
5. Rewrite zoneFormHelpers.ts
6. Rewrite mainObjectPanel.ts and roadPanel.ts
7. Remove all "Apply" buttons
8. Add dirty/reset CSS
