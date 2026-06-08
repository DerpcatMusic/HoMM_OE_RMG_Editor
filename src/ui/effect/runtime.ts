import { Effect } from "effect";

export function runUiEffect<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  return Effect.runPromise(effect);
}

export function runUiEffectSync<A, E>(effect: Effect.Effect<A, E, never>): A {
  return Effect.runSync(effect);
}
