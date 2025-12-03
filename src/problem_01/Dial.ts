import { Effect, type Stream, SubscriptionRef } from "effect";
import type { Instruction } from "./schema";

export class Dial {
  public get: Effect.Effect<number>;
  public changes: Stream.Stream<number, never, never>;

  constructor(
    private rotation: SubscriptionRef.SubscriptionRef<number>,
    public maxRotation: number = 100,
  ) {
    this.get = SubscriptionRef.get(this.rotation);
    this.changes = this.rotation.changes;
  }

  turn({ direction, amount }: Instruction): Effect.Effect<number> {
    return this.rotation.pipe(
      SubscriptionRef.updateAndGet((rotation) => {
        if (direction === "R") {
          return (rotation + amount) % this.maxRotation;
        } else {
          const newRotation = (rotation - amount) % this.maxRotation;
          return newRotation >= 0
            ? newRotation
            : this.maxRotation + newRotation;
        }
      }),
    );
  }
}

export const make = (startingRotation: number) =>
  Effect.andThen(
    SubscriptionRef.make(startingRotation),
    (rotation) => new Dial(rotation),
  );
