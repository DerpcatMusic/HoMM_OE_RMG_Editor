// Fine-grained reactive signal system — no DOM replacement, only targeted updates

export class Signal<T> {
  private _value: T;
  private _subs = new Set<() => void>();

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    if (currentEffect !== null) {
      this._subs.add(currentEffect);
    }
    return this._value;
  }

  set value(next: T) {
    if (this._value !== next) {
      this._value = next;
      if (batchDepth > 0) {
        dirtySignals.add(this);
      } else {
        this._notify();
      }
    }
  }

  peek(): T {
    return this._value;
  }

  private _notify(): void {
    const subs = [...this._subs];
    for (const fn of subs) fn();
  }

  /** @internal called by batch flush */
  _flush(): void {
    this._notify();
  }
}

let currentEffect: (() => void) | null = null;
let batchDepth = 0;
const dirtySignals = new Set<Signal<unknown>>();

export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  let disposed = false;

  const run = () => {
    if (disposed) return;
    if (cleanup) cleanup();
    const prev = currentEffect;
    currentEffect = run;
    try {
      cleanup = fn();
    } finally {
      currentEffect = prev;
    }
  };

  run();

  return () => {
    disposed = true;
    if (cleanup) cleanup();
  };
}

export function computed<T>(fn: () => T): Signal<T> {
  const s = new Signal<T>(undefined as T);
  effect(() => {
    s.value = fn();
  });
  return s;
}

export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const signals = [...dirtySignals];
      dirtySignals.clear();
      for (const s of signals) s._flush();
    }
  }
}

export function untrack<T>(fn: () => T): T {
  const prev = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prev;
  }
}

export function signal<T>(value: T): Signal<T> {
  return new Signal(value);
}
