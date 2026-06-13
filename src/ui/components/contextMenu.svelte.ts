export interface ContextMenuItem {
  label: string;
  icon?: string;
  variant?: "default" | "danger";
  onClick: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function createContextMenuState() {
  let current = $state<ContextMenuState | null>(null);

  return {
    get current() {
      return current;
    },
    open(event: MouseEvent, items: ContextMenuItem[]) {
      event.preventDefault();
      current = {
        x: event.clientX,
        y: event.clientY,
        items,
      };
    },
    close() {
      current = null;
    },
  };
}
