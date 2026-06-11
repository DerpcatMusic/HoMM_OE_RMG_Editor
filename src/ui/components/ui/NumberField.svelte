<script lang="ts">
  interface Props {
    value: number | null | undefined;
    id?: string;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    placeholder?: string;
    disabled?: boolean;
    allowEmpty?: boolean;
    unit?: string;
    title?: string;
    class?: string;
    oncommit?: (value: number | undefined) => void;
  }

  let {
    value = $bindable<number | null | undefined>(),
    id,
    min = -Infinity,
    max = Infinity,
    step = 1,
    precision,
    placeholder = "",
    disabled = false,
    allowEmpty = true,
    unit = "",
    title,
    class: className = "",
    oncommit,
  }: Props = $props();

  let inputRef = $state<HTMLInputElement>();
  let isDragging = $state(false);
  let isEditing = $state(false);
  let isHolding = $state(false);
  let editValue = $state("");
  let leftWidth = $state(0);
  let rightWidth = $state(0);
  let activeDirection = $state<"left" | "right" | null>(null);

  let startX = 0;
  let startValue = 0;
  let lastX = 0;
  let directionStartX = 0;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  const resolvedPrecision = $derived(precision ?? (step < 1 ? 2 : 0));
  const displayValue = $derived(formatValue(value, resolvedPrecision));
  const numericValue = $derived(typeof value === "number" && Number.isFinite(value) ? value : 0);
  const isAtMin = $derived(Number.isFinite(min) && numericValue <= min);
  const isAtMax = $derived(Number.isFinite(max) && numericValue >= max);
  const isAtLimit = $derived(
    isDragging &&
      ((activeDirection === "left" && isAtMin) ||
        (activeDirection === "right" && isAtMax)),
  );

  function formatValue(input: number | null | undefined, places: number) {
    if (input === null || input === undefined || Number.isNaN(input)) return "";
    if (Number.isInteger(input)) return String(input);
    return input.toFixed(places);
  }

  function parseInput(input: string) {
    const raw = input.trim().replaceAll(",", ".");
    if (raw === "" || raw === "-") return null;
    const next = Number(raw);
    return Number.isFinite(next) ? next : null;
  }

  function clampValue(input: number) {
    return Math.min(max, Math.max(min, input));
  }

  function normalizeValue(input: number | null) {
    if (input === null) {
      if (allowEmpty) return undefined;
      return Number.isFinite(min) ? min : 0;
    }
    return clampValue(input);
  }

  function commit(input: number | null) {
    const next = normalizeValue(input);
    value = next;
    oncommit?.(next);
  }

  function clearHoldTimer() {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  function resetDragState() {
    clearHoldTimer();
    isDragging = false;
    isHolding = false;
    activeDirection = null;
    leftWidth = 0;
    rightWidth = 0;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function handlePointerDown(event: PointerEvent) {
    if (disabled || isEditing || event.button !== 0 || event.detail > 1) return;

    event.preventDefault();
    startX = event.clientX;
    lastX = event.clientX;
    directionStartX = event.clientX;
    startValue = numericValue;
    activeDirection = null;
    leftWidth = 0;
    rightWidth = 0;

    holdTimer = setTimeout(() => {
      isHolding = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }, 100);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isHolding || disabled) return;

    const currentX = event.clientX;
    if (!isDragging && Math.abs(currentX - startX) > 2) {
      isDragging = true;
    }
    if (!isDragging) return;

    const moveDelta = currentX - lastX;
    if (moveDelta < -0.5) {
      if (activeDirection !== "left") {
        activeDirection = "left";
        directionStartX = currentX;
      }
      leftWidth = Math.min((Math.abs(currentX - directionStartX) / 30) * 50, 50);
    } else if (moveDelta > 0.5) {
      if (activeDirection !== "right") {
        activeDirection = "right";
        directionStartX = currentX;
      }
      rightWidth = Math.min((Math.abs(currentX - directionStartX) / 30) * 50, 50);
    }

    lastX = currentX;

    const multiplier = event.shiftKey ? 10 : event.altKey || event.ctrlKey ? 0.1 : 1;
    const rawChange = ((currentX - startX) * step * multiplier) / 2;
    const scaledValue = startValue + rawChange;
    const next = resolvedPrecision > 0
      ? Math.round(scaledValue * 10 ** resolvedPrecision) / 10 ** resolvedPrecision
      : Math.round(scaledValue);

    commit(next);
  }

  function handlePointerUp() {
    resetDragState();
  }

  function enterEditMode() {
    if (disabled) return;
    resetDragState();
    isEditing = true;
    editValue = displayValue;
    setTimeout(() => {
      inputRef?.focus();
      inputRef?.select();
    }, 0);
  }

  function finishEditing(commitCurrent = true) {
    if (!isEditing) return;
    if (commitCurrent) {
      const parsed = parseInput(editValue);
      if (parsed !== null || editValue.trim() === "") {
        commit(parsed);
      }
    }
    isEditing = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isEditing) {
      if (event.key === "Enter") {
        event.preventDefault();
        finishEditing(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        isEditing = false;
      }
      return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const multiplier = event.shiftKey ? 10 : event.altKey || event.ctrlKey ? 0.1 : 1;
    const direction = event.key === "ArrowUp" ? 1 : -1;
    commit(numericValue + step * multiplier * direction);
  }

  function handleWheel(event: WheelEvent) {
    if (disabled || isEditing) return;
    event.preventDefault();
    const multiplier = event.shiftKey ? 10 : event.altKey || event.ctrlKey ? 0.1 : 1;
    const direction = event.deltaY < 0 ? 1 : -1;
    commit(numericValue + step * multiplier * direction);
  }

  $effect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => handlePointerMove(event);
    const handleWindowPointerUp = () => handlePointerUp();
    const handleWindowBlur = () => resetDragState();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") resetDragState();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resetDragState();
    };
  });
</script>

<div
  class="number-field {className}"
  class:is-disabled={disabled}
  class:is-dragging={isDragging}
  class:is-editing={isEditing}
  class:is-holding={isHolding}
  class:is-at-limit={isAtLimit}
  role="spinbutton"
  tabindex={disabled ? undefined : 0}
  aria-valuenow={typeof value === "number" ? value : undefined}
  aria-valuemin={Number.isFinite(min) ? min : undefined}
  aria-valuemax={Number.isFinite(max) ? max : undefined}
  {title}
  onpointerdown={handlePointerDown}
  ondblclick={(event) => {
    event.preventDefault();
    event.stopPropagation();
    enterEditMode();
  }}
  onkeydown={handleKeydown}
  onwheel={handleWheel}
>
  {#if isEditing}
    <input
      bind:this={inputRef}
      {id}
      class="number-field-input"
      type="text"
      inputmode="decimal"
      bind:value={editValue}
      {placeholder}
      {disabled}
      {step}
      onblur={() => finishEditing(true)}
      onkeydown={handleKeydown}
    />
  {:else}
    <span class="number-field-scrub" aria-hidden="true">
      <span class="material-symbols-outlined">swap_horiz</span>
    </span>
    <span class="number-field-value">
      <span>{displayValue || placeholder}</span>
      {#if unit}
        <small>{unit}</small>
      {/if}
    </span>
    <span
      class="number-field-gradient number-field-gradient-left"
      style:width="{leftWidth}%"
      style:opacity={activeDirection === "left" && !isAtLimit ? 0.4 : 0}
    ></span>
    <span
      class="number-field-gradient number-field-gradient-right"
      style:width="{rightWidth}%"
      style:opacity={activeDirection === "right" && !isAtLimit ? 0.4 : 0}
    ></span>
    {#if isDragging}
      <span class="number-field-tooltip">
        {displayValue || "empty"}{#if unit} {unit}{/if}
        {#if isAtLimit}
          <small>{isAtMin ? "MIN" : "MAX"}</small>
        {/if}
      </span>
    {/if}
  {/if}
</div>

<style>
  .number-field {
    position: relative;
    height: 1.5rem;
    min-width: 4ch;
    max-width: 100%;
    display: inline-grid;
    grid-template-columns: 1.25rem minmax(0, 1fr);
    align-items: stretch;
    overflow: visible;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-ink);
    cursor: pointer;
    user-select: none;
  }
  .number-field:hover,
  .number-field.is-holding,
  .number-field.is-dragging,
  .number-field.is-editing {
    border-color: var(--color-line-strong);
    background: var(--color-panel-2);
  }
  .number-field.is-dragging {
    cursor: ew-resize;
  }
  .number-field.is-at-limit {
    border-color: var(--color-state-invalid);
  }
  .number-field.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .number-field-scrub {
    min-width: 0;
    display: grid;
    place-items: center;
    border-right: var(--line) solid var(--color-line);
    color: var(--color-muted);
    z-index: 2;
  }
  .number-field.is-holding .number-field-scrub,
  .number-field.is-dragging .number-field-scrub {
    color: var(--color-ink);
    background: var(--color-active);
  }
  .number-field-scrub .material-symbols-outlined {
    font-family: var(--font-icon);
    font-size: 0.875rem;
    line-height: 1;
  }
  .number-field-value {
    min-width: 0;
    padding: 0 var(--space-1);
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-variant-numeric: tabular-nums;
    z-index: 2;
    pointer-events: none;
  }
  .number-field-value small {
    color: var(--color-muted);
    font-size: 0.5625rem;
    text-transform: uppercase;
  }
  .number-field-input {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    border: 0;
    padding: 0 var(--space-1);
    background: transparent;
    color: inherit;
    font: inherit;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    outline: none;
  }
  .number-field-gradient {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease-out;
  }
  .number-field-gradient-left {
    left: 0;
    background: linear-gradient(to right, var(--color-focus), transparent);
  }
  .number-field-gradient-right {
    right: 0;
    background: linear-gradient(to left, var(--color-focus), transparent);
  }
  .number-field.is-at-limit .number-field-gradient-left,
  .number-field.is-at-limit .number-field-gradient-right {
    opacity: 0.65;
    background: linear-gradient(to right, var(--color-state-invalid), transparent);
  }
  .number-field-tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + var(--space-1));
    z-index: 20;
    transform: translateX(-50%);
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-ink);
    color: var(--color-panel);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    white-space: nowrap;
    pointer-events: none;
  }
  .number-field-tooltip small {
    margin-left: var(--space-1);
    opacity: 0.75;
  }
  .number-field.is-at-limit .number-field-tooltip {
    background: var(--color-state-invalid);
    color: var(--color-panel);
  }
</style>
