import { Effect, Ref, SubscriptionRef } from "effect";

import { Dial } from "./Dial";
import type { Instruction } from "./schema";

export class DialWithFullRotationCounter extends Dial {
  getFullRotationCount: Effect.Effect<number>;

  constructor(
    private rotationsCount: Ref.Ref<number>,
    rotation: SubscriptionRef.SubscriptionRef<number>,
    maxRotation: number = 100,
  ) {
    super(rotation, maxRotation);
    this.getFullRotationCount = this.rotationsCount.pipe(Ref.get);
    this.maxRotation = maxRotation;
  }

  override turn({ direction, amount }: Instruction): Effect.Effect<number> {
    const get = this.get;
    const turnDial = super.turn.bind(this);
    const rotationsCount = this.rotationsCount;
    const maxRotation = this.maxRotation;
    return Effect.gen(function*() {
      const currentRotation = yield* get;

      // perform the actual dial rotation
      const newRotation = yield* turnDial({ direction, amount });

      // how many times did we pass 0 during THIS move?
      const wraps =
        direction === "R"
          ? Math.floor((currentRotation + amount) / maxRotation)
          : Math.floor(
            (((maxRotation - currentRotation) % maxRotation) + amount) /
            maxRotation,
          );

      if (wraps > 0) {
        yield* rotationsCount.pipe(Ref.update((count) => count + wraps));
      }

      return newRotation;
    });
  }
}

export const make = (startingRotation: number) =>
  Effect.andThen(
    Effect.gen(function*() {
      const rotation = yield* SubscriptionRef.make(startingRotation);
      const rotationsCount = yield* Ref.make(0);
      return { rotation, rotationsCount };
    }),
    ({ rotation, rotationsCount }) =>
      new DialWithFullRotationCounter(rotationsCount, rotation),
  );
