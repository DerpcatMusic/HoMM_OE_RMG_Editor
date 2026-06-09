// DOM bindings for fine-grained signals — updates only changed nodes, never rebuilds panels
import { Signal, effect, untrack } from "./signals.js";

export function bindText(parent: Node, s: Signal<string>): Text {
  const node = document.createTextNode(s.peek());
  effect(() => {
    node.textContent = s.value;
  });
  parent.appendChild(node);
  return node;
}

export function bindInput(
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  s: Signal<string>,
  opts?: { type?: "text" | "number" | "checkbox" },
): void {
  const type = opts?.type ?? (input instanceof HTMLInputElement ? input.type : "text");

  if (type === "checkbox" && input instanceof HTMLInputElement) {
    input.checked = s.peek() === "true";
    input.addEventListener("change", () => {
      s.value = String(input.checked);
    });
    effect(() => {
      if (document.activeElement !== input) {
        input.checked = s.value === "true";
      }
    });
    return;
  }

  input.value = s.peek();
  input.addEventListener("input", () => {
    s.value = input.value;
  });
  effect(() => {
    if (document.activeElement !== input) {
      input.value = s.value;
    }
  });
}

export function bindClass(element: HTMLElement, className: string, s: Signal<boolean>): void {
  effect(() => {
    element.classList.toggle(className, s.value);
  });
}

export function bindStyle(element: HTMLElement, property: string, s: Signal<string>): void {
  effect(() => {
    element.style.setProperty(property, s.value);
  });
}

export function bindAttribute(element: Element, attr: string, s: Signal<string | null>): void {
  effect(() => {
    const v = s.value;
    if (v === null) {
      element.removeAttribute(attr);
    } else {
      element.setAttribute(attr, v);
    }
  });
}

interface KeyedItem {
  key: string;
  el: HTMLElement;
}

export function bindChildren<T>(
  container: HTMLElement,
  items: Signal<readonly T[]>,
  render: (item: T) => HTMLElement,
  keyFn: (item: T) => string,
): void {
  let current: KeyedItem[] = [];

  effect(() => {
    const nextItems = items.value;
    const nextKeys = nextItems.map(keyFn);

    // Reconcile: remove old, keep existing, append new
    const next: KeyedItem[] = [];
    const keyToEl = new Map<string, HTMLElement>();
    for (const { key, el } of current) {
      keyToEl.set(key, el);
    }

    for (let i = 0; i < nextItems.length; i += 1) {
      const key = nextKeys[i]!;
      const existing = keyToEl.get(key);
      if (existing) {
        next.push({ key, el: existing });
        keyToEl.delete(key);
      } else {
        const el = render(nextItems[i]!);
        next.push({ key, el });
      }
    }

    // Remove unused
    for (const el of keyToEl.values()) {
      el.remove();
    }

    // Reorder / append in DOM
    for (let i = 0; i < next.length; i += 1) {
      const { el } = next[i]!;
      const currentAtIndex = container.children[i] ?? null;
      if (currentAtIndex !== el) {
        container.insertBefore(el, currentAtIndex);
      }
    }

    current = next;
  });
}
